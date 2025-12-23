import { normalizePath, parseYaml, stringifyYaml, TFile, TFolder, Vault } from "obsidian";
import { CONTENT_DELIMITER } from "src/config/constants";
import { FIELD_DEFINITIONS } from "src/config/fieldDefinitions";

import ObsidianHardcover from "src/main";
import {
	ActivityDateFieldConfig,
	BookMetadata,
	GroupingSettings,
} from "src/types";
import { FileUtils } from "src/utils/FileUtils";

export class NoteService {
	constructor(
		private vault: Vault,
		private fileUtils: FileUtils,
		private plugin: ObsidianHardcover
	) {
		this.plugin = plugin;
	}

	/**
	 * Force metadata cache refresh for files that might not have been indexed.
	 * Call this at the end of sync to ensure all files are searchable.
	 */
	async refreshMetadataCache(folderPath: string): Promise<void> {
		const files = this.getMarkdownFiles(folderPath);
		let refreshedCount = 0;

		for (const file of files) {
			// Check if file is in metadata cache
			const cache = this.plugin.app.metadataCache.getFileCache(file);

			if (!cache || !cache.frontmatter) {
				// File not in cache - trigger a re-read to force indexing
				// Reading the file through the vault should trigger cache population
				try {
					const content = await this.vault.read(file);
					// Trigger modify event to force cache update
					await this.vault.modify(file, content);
					refreshedCount++;
				} catch (e) {
					console.warn(`[Hardcover] Failed to refresh cache for ${file.path}:`, e);
				}
			}
		}

		if (refreshedCount > 0) {
			console.log(`[Hardcover] Refreshed metadata cache for ${refreshedCount} files`);
		}
	}

	async createNote(
		bookMetadata: BookMetadata,
		rawContributors?: Record<any, any>[]
	): Promise<TFile | null> {
		try {
			const fullPath = this.generateNotePath(
				bookMetadata,
				this.plugin.settings.grouping,
				rawContributors
			);

			const directoryPath = this.fileUtils.getDirectoryPath(fullPath);
			if (directoryPath) {
				await this.ensureFolderExists(directoryPath);
			}

			const formattedMetadata = this.applyWikilinkFormatting(bookMetadata);

			// prepare frontmatter with proper ordering and filtering
			const frontmatterData = this.prepareFrontmatter(formattedMetadata);

			// create body content only
			const bodyContent = this.createBodyContent(formattedMetadata);

			// build full content with frontmatter in a single write
			const frontmatterYaml = stringifyYaml(frontmatterData);
			const fullContent = `---\n${frontmatterYaml}---\n${bodyContent}`;

			// check if file exists at target path
			let existingFile = this.vault.getFileByPath(fullPath);
			let file: TFile;

			if (existingFile) {
				// File exists at target path - update it
				// This handles both same book updates AND different editions of the same title
				// (e.g., hardcover vs paperback editions will share one note file)
				const existingCache = this.plugin.app.metadataCache.getFileCache(existingFile);
				const existingBookId = existingCache?.frontmatter?.hardcoverBookId;
				const newBookId = frontmatterData.hardcoverBookId;

				if (existingBookId !== undefined && existingBookId !== newBookId) {
					// Different edition of same book - update with newer data
					if (this.plugin.settings.debugLogging) {
						console.log(
							`[Hardcover] Updating "${fullPath}" (was ID ${existingBookId}, now ID ${newBookId}) - merging editions`
						);
					}
				}

				await this.vault.modify(existingFile, fullContent);
				file = existingFile;
			} else {
				try {
					file = await this.vault.create(fullPath, fullContent);
				} catch (error) {
					// Handle race condition: file may have been created by another operation
					if (error.message?.includes("File already exists")) {
						existingFile = this.vault.getFileByPath(fullPath);
						if (existingFile) {
							// Just update the existing file (same title = same note)
							await this.vault.modify(existingFile, fullContent);
							file = existingFile;
						} else {
							throw error;
						}
					} else {
						throw error;
					}
				}
			}

			return file;
		} catch (error) {
			console.error("Error creating note:", error);
			return null;
		}
	}

	async updateNote(
		bookMetadata: BookMetadata,
		existingFile: TFile,
		rawContributors?: Record<any, any>[]
	): Promise<TFile | null> {
		try {
			const originalPath = existingFile.path;
			const existingContent = await this.vault.cachedRead(existingFile);
			const { frontmatterData: existingFrontmatter, bodyText: existingBodyText } =
				this.extractFrontmatterData(existingContent);

			const formattedMetadata = this.applyWikilinkFormatting(bookMetadata);
			const managedFrontmatterKeys = this.getManagedFrontmatterKeys();
			const preserveCustomFrontmatter =
				this.plugin.settings.preserveCustomFrontmatter !== false;

			// prepare new frontmatter data
			const newFrontmatterData = this.prepareFrontmatter(formattedMetadata);

			// merge frontmatter: preserve custom keys, update managed keys
			const mergedFrontmatter: Record<string, any> = {};
			this.updateFrontmatterObject(
				mergedFrontmatter,
				newFrontmatterData,
				managedFrontmatterKeys,
				preserveCustomFrontmatter,
				this.getManagedOrder(newFrontmatterData)
			);
			// Copy existing values first, then apply merge logic
			if (existingFrontmatter) {
				const tempFrontmatter = { ...existingFrontmatter };
				// Clear and rebuild with proper ordering
				for (const key of Object.keys(mergedFrontmatter)) {
					delete mergedFrontmatter[key];
				}
				this.updateFrontmatterObject(
					tempFrontmatter,
					newFrontmatterData,
					managedFrontmatterKeys,
					preserveCustomFrontmatter,
					this.getManagedOrder(newFrontmatterData)
				);
				Object.assign(mergedFrontmatter, tempFrontmatter);
			} else {
				Object.assign(mergedFrontmatter, newFrontmatterData);
			}

			// create new body content
			const newBodyContent = this.createBodyContent(formattedMetadata);

			// check if delimiter exists in the current content - preserve user content after delimiter
			const delimiterIndex = existingBodyText.indexOf(CONTENT_DELIMITER);
			let finalBodyContent: string;

			if (delimiterIndex !== -1) {
				const userContent = existingBodyText.substring(
					delimiterIndex + CONTENT_DELIMITER.length
				);
				finalBodyContent = newBodyContent.replace(
					`${CONTENT_DELIMITER}\n\n`,
					`${CONTENT_DELIMITER}${userContent}`
				);
			} else {
				finalBodyContent = newBodyContent;
			}

			// build full content with frontmatter in a single write
			const frontmatterYaml = stringifyYaml(mergedFrontmatter);
			const fullContent = `---\n${frontmatterYaml}---\n${finalBodyContent}`;

			const newPath = this.generateNotePath(
				bookMetadata,
				this.plugin.settings.grouping,
				rawContributors
			);

			const directoryPath = this.fileUtils.getDirectoryPath(newPath);
			if (directoryPath) {
				await this.ensureFolderExists(directoryPath);
			}

			// check if the file needs to be renamed
			if (originalPath !== newPath) {
				// Check if target path already exists (collision with different book)
				const targetFile = this.vault.getFileByPath(newPath);
				let finalPath = newPath;

				if (targetFile) {
					// Target path already has a file - this could be a different edition
					// of the same book. Instead of creating duplicates, we'll delete
					// our current file and update the target (same title = same note)
					const targetCache = this.plugin.app.metadataCache.getFileCache(targetFile);
					const targetBookId = targetCache?.frontmatter?.hardcoverBookId;
					const thisBookId = mergedFrontmatter.hardcoverBookId;

					if (targetBookId !== undefined && targetBookId !== thisBookId) {
						if (this.plugin.settings.debugLogging) {
							console.log(
								`[Hardcover] Merging editions: "${existingFile.path}" (ID ${thisBookId}) -> "${newPath}" (ID ${targetBookId})`
							);
						}
						// Delete current file and update target instead
						await this.vault.delete(existingFile);
						await this.vault.modify(targetFile, fullContent);
						return targetFile;
					}
				}

				await this.vault.modify(existingFile, fullContent);
				await this.vault.rename(existingFile, finalPath);

				// get the new file reference after renaming
				const renamedFile = this.vault.getFileByPath(finalPath);
				return renamedFile || null;
			} else {
				// update content in single write
				await this.vault.modify(existingFile, fullContent);
				return existingFile;
			}
		} catch (error) {
			const titleProp = this.plugin.settings.fieldsSettings.title.propertyName;
			const title = bookMetadata[titleProp] || "Unknown";
			const bookId = bookMetadata.hardcoverBookId || "Unknown";
			// Compute the path again for error logging
			let attemptedPath = "Unknown";
			try {
				attemptedPath = this.generateNotePath(
					bookMetadata,
					this.plugin.settings.grouping,
					rawContributors
				);
			} catch (e) {
				// Ignore if path generation also fails
			}
			console.error(
				`[Hardcover] Error updating note for "${title}" (ID: ${bookId})`,
				`\n  Original: "${existingFile.path}"`,
				`\n  Attempted: "${attemptedPath}"`,
				`\n  Error:`, error.message
			);
			return null;
		}
	}

	public generateNotePath(
		bookMetadata: BookMetadata,
		groupingSettings: GroupingSettings,
		rawContributors?: Record<any, any>[]
	): string {
		const filename = this.fileUtils.processFilenameTemplate(
			this.plugin.settings.filenameTemplate,
			bookMetadata,
			this.plugin.settings.fieldsSettings
		);

		let basePath = normalizePath(this.plugin.settings.targetFolder);

		if (groupingSettings.enabled) {
			const directories = this.buildDirectoryPath(
				bookMetadata,
				groupingSettings,
				rawContributors
			);

			if (directories) {
				basePath = `${basePath}/${directories}`;
			}
		}

		return basePath ? `${basePath}/${filename}` : filename;
	}

	public buildDirectoryPath(
		bookMetadata: BookMetadata,
		groupingSettings: GroupingSettings,
		rawContributors?: Record<any, any>[]
	): string {
		const pathComponents: string[] = [];

		if (
			groupingSettings.groupBy === "author" ||
			groupingSettings.groupBy === "author-series"
		) {
			const authorDirectory = this.getAuthorDirectory(
				bookMetadata,
				rawContributors
			);

			if (authorDirectory) {
				pathComponents.push(authorDirectory);
			}
		}

		if (
			groupingSettings.groupBy === "series" ||
			groupingSettings.groupBy === "author-series"
		) {
			const seriesDirectory = this.getSeriesDirectory(bookMetadata);

			if (seriesDirectory) {
				pathComponents.push(seriesDirectory);
			}
		}

		return pathComponents.join("/");
	}

	private getAuthorDirectory(
		bookMetadata: BookMetadata,
		rawContributors?: Record<any, any>[]
	): string | null {
		const authorProperty =
			this.plugin.settings.fieldsSettings.authors.propertyName;
		const authors = bookMetadata[authorProperty];

		// check if multiple authors and should use collections folder
		if (
			Array.isArray(authors) &&
			authors.length > 1 &&
			this.plugin.settings.grouping.multipleAuthorsBehavior ===
				"useCollectionsFolder"
		) {
			return this.fileUtils.sanitizeFolderName(
				this.plugin.settings.grouping.collectionsFolderName
			);
		}

		if (Array.isArray(authors) && authors.length > 0) {
			let authorName = authors[0].replace(/[\[\]']+/g, "");

			// format the name based on settings
			if (this.plugin.settings.grouping.authorFormat === "lastFirst") {
				authorName = this.formatNameAsLastFirst(authorName);
			}

			return this.fileUtils.sanitizeFolderName(authorName);
		}

		//  if no authors and using fallback folder, return the folder name
		if (
			this.plugin.settings.grouping.noAuthorBehavior === "useFallbackFolder"
		) {
			return this.fileUtils.sanitizeFolderName(
				this.plugin.settings.grouping.fallbackFolderName
			);
		}

		// if no authors and using fallback priority, try to find Writer/Editor/first contributor
		if (
			this.plugin.settings.grouping.noAuthorBehavior ===
				"useFallbackPriority" &&
			rawContributors
		) {
			const fallbackName = this.findFallbackAuthor(rawContributors);
			if (fallbackName) {
				let authorName = fallbackName;

				// format the name based on settings
				if (this.plugin.settings.grouping.authorFormat === "lastFirst") {
					authorName = this.formatNameAsLastFirst(authorName);
				}

				return this.fileUtils.sanitizeFolderName(authorName);
			}
		}

		return null;
	}

	private getSeriesDirectory(bookMetadata: BookMetadata): string | null {
		const seriesProperty =
			this.plugin.settings.fieldsSettings.series.propertyName;
		const series = bookMetadata[seriesProperty];

		if (Array.isArray(series) && series.length > 0) {
			let seriesName = series[0];

			// extract series name from wikilink format: [[Series|Series #1]] -> Series
			const wikilinkMatch = seriesName.match(
				/^\[\[([^|\]]+)(?:\|[^\]]+)?\]\]$/
			);
			if (wikilinkMatch) {
				seriesName = wikilinkMatch[1];
			} else {
				// fallback: remove series position info if it exists ("Series Name #1" -> "Series Name")
				seriesName = seriesName.replace(/\s*#\d+.*$/, "");
			}

			return this.fileUtils.sanitizeFolderName(seriesName);
		}

		return null;
	}

	private createBodyContent(bookMetadata: any): string {
		let content = "";

		// add title
		const title = this.getBookTitle(bookMetadata);
		const escapedTitle = this.fileUtils.escapeMarkdownCharacters(title);
		content += `# ${escapedTitle}\n\n`;

		// add book cover if enabled
		const hasCover =
			this.plugin.settings.fieldsSettings.cover.enabled &&
			bookMetadata[this.plugin.settings.fieldsSettings.cover.propertyName];

		if (hasCover) {
			const coverProperty =
				this.plugin.settings.fieldsSettings.cover.propertyName;
			content += `![${escapedTitle} Cover|300](${bookMetadata[coverProperty]})\n\n`;
		}

		// add description if available
		const hasDescription =
			this.plugin.settings.fieldsSettings.description.enabled &&
			bookMetadata[
				this.plugin.settings.fieldsSettings.description.propertyName
			];

		if (hasDescription) {
			const descProperty =
				this.plugin.settings.fieldsSettings.description.propertyName;
			// add extra spacing if there is a cover above
			const spacing = hasCover ? "\n" : "";
			content += `${spacing}${bookMetadata[descProperty]}\n\n`;
		}

		if (
			this.plugin.settings.fieldsSettings.review.enabled &&
			bookMetadata.bodyContent.review
		) {
			const formattedReview = this.formatReviewText(
				bookMetadata.bodyContent.review
			);
			content += `## My Review\n\n${formattedReview}\n\n`;
		}

		// add obsidian-hardcover plugin delimiter
		content += `\n${CONTENT_DELIMITER}\n\n`;

		return content;
	}

	private getBookTitle(bookMetadata: any) {
		const titleProperty =
			this.plugin.settings.fieldsSettings.title.propertyName;

		return bookMetadata[titleProperty] || "Untitled";
	}

	private async ensureFolderExists(folderPath: string): Promise<void> {
		if (!folderPath) return;

		const folder = this.vault.getFolderByPath(folderPath);
		if (!folder) {
			try {
				await this.vault.createFolder(folderPath);
			} catch (error) {
				// Handle race condition: another parallel operation may have created the folder
				if (
					error.message?.includes("Folder already exists") ||
					error.message?.includes("File already exists")
				) {
					// This is fine - folder exists now which is what we wanted
					return;
				}
				// Log the problematic path for debugging
				console.error(`[Hardcover] Failed to create folder: "${folderPath}"`, error.message);
				throw error;
			}
		}
	}

	private prepareFrontmatter(
		metadata: Record<string, any>
	): Record<string, any> {
		const { bodyContent, ...frontmatterData } = metadata;
		const prepared: Record<string, any> = {};

		// first add hardcoverBookId and hardcoverUpdatedAt as the first properties
		if (frontmatterData.hardcoverBookId !== undefined) {
			prepared.hardcoverBookId = frontmatterData.hardcoverBookId;
		}
		if (frontmatterData.hardcoverUpdatedAt !== undefined) {
			prepared.hardcoverUpdatedAt = frontmatterData.hardcoverUpdatedAt;
		}

		// add all other properties in the order defined in FIELD_DEFINITIONS
		const allFieldPropertyNames = FIELD_DEFINITIONS.flatMap((field) => {
			const fieldSettings = this.plugin.settings.fieldsSettings[field.key];
			const propertyNames = [fieldSettings.propertyName];

			// add start/end property names for activity date fields
			if (field.isActivityDateField) {
				const activityField = fieldSettings as ActivityDateFieldConfig;
				propertyNames.push(
					activityField.startPropertyName,
					activityField.endPropertyName
				);
			}

			return propertyNames;
		});

		// add properties in the defined order
		for (const propName of allFieldPropertyNames) {
			if (!frontmatterData.hasOwnProperty(propName)) continue;
			// skip hardcoverBookId and hardcoverUpdatedAt as we already added them
			if (propName === "hardcoverBookId" || propName === "hardcoverUpdatedAt")
				continue;

			const value = frontmatterData[propName];

			// skip undefined/null values
			if (value === undefined || value === null) continue;

			if (
				propName ===
				this.plugin.settings.fieldsSettings.description.propertyName
			) {
				if (typeof value === "string") {
					// remove all \n sequences and replace with spaces to avoid frontmatter issues
					const cleanValue = value.replace(/\\n/g, " ").trim();
					// remove any multiple spaces that might result
					const finalValue = cleanValue.replace(/\s+/g, " ");
					prepared[propName] = finalValue;
				}
			} else {
				// for everything else, just add it directly: Obsidian's processFrontMatter will handle arrays, strings, etc.
				prepared[propName] = value;
			}
		}

		return prepared;
	}

	private updateFrontmatterObject(
		frontmatter: Record<string, any>,
		newData: Record<string, any>,
		managedKeys: Set<string>,
		preserveCustomFrontmatter: boolean,
		managedOrder: string[]
	): void {
		const original = { ...frontmatter };
		const originalKeys = Object.keys(frontmatter);
		const added = new Set<string>();

		// if no managed order provided, fall back to newData order
		const managedOrderToUse =
			managedOrder && managedOrder.length > 0
				? managedOrder
				: Object.keys(newData);

		// clear existing keys
		for (const key of originalKeys) {
			delete frontmatter[key];
		}

		// first, follow the original order
		for (const key of originalKeys) {
			if (managedKeys.has(key)) {
				if (key in newData) {
					frontmatter[key] = newData[key];
					added.add(key);
				}
				// if managed key missing from newData, drop it (stale)
			} else if (preserveCustomFrontmatter) {
				frontmatter[key] = original[key];
				added.add(key);
			}
			// else: custom key removed when preservation disabled
		}

		// then append any new managed keys that weren't in the original order,
		// preserving the order produced by prepareFrontmatter/newData
		for (const key of managedOrderToUse) {
			if (!added.has(key)) {
				frontmatter[key] = newData[key];
				added.add(key);
			}
		}
	}

	private getManagedFrontmatterKeys(): Set<string> {
		const keys = new Set<string>();

		// hardcoverBookId and hardcoverUpdatedAt are always managed by the plugin
		keys.add("hardcoverBookId");
		keys.add("hardcoverUpdatedAt");

		// add the property names defined in FIELD_DEFINITIONS (including activity date start/end)
		for (const field of FIELD_DEFINITIONS) {
			const fieldSettings = this.plugin.settings.fieldsSettings[field.key];
			keys.add(fieldSettings.propertyName);

			if (field.isActivityDateField) {
				const activityField = fieldSettings as ActivityDateFieldConfig;
				keys.add(activityField.startPropertyName);
				keys.add(activityField.endPropertyName);
			}
		}

		return keys;
	}

	private getManagedOrder(frontmatterData: Record<string, any>): string[] {
		return Object.keys(frontmatterData);
	}

	private extractFrontmatter(content: string): {
		frontmatterText: string;
		bodyText: string;
	} {
		const match = content.match(/^---\n[\s\S]*?\n---\n/);
		if (match) {
			const frontmatterText = match[0];
			const bodyText = content.slice(frontmatterText.length);
			return { frontmatterText, bodyText };
		}

		return { frontmatterText: "", bodyText: content };
	}

	private extractFrontmatterData(content: string): {
		frontmatterData: Record<string, any> | null;
		bodyText: string;
	} {
		const match = content.match(/^---\n([\s\S]*?)\n---\n/);
		if (match) {
			const yamlContent = match[1];
			const bodyText = content.slice(match[0].length);
			try {
				const frontmatterData = parseYaml(yamlContent) || {};
				return { frontmatterData, bodyText };
			} catch (e) {
				// If YAML parsing fails, return null frontmatter
				return { frontmatterData: null, bodyText };
			}
		}

		return { frontmatterData: null, bodyText: content };
	}

	private formatReviewText(reviewText: string): string {
		if (!reviewText) return "";

		// check if the review already contains HTML
		if (reviewText.includes("<p>") || reviewText.includes("<br>")) {
			// convert HTML to markdown-friendly format
			let formatted = reviewText
				.replace(/<p>/g, "")
				.replace(/<\/p>/g, "\n\n")
				.replace(/<br\s*\/?>/g, "\n")
				.replace(/&quot;/g, '"')
				.replace(/&amp;/g, "&")
				.replace(/&lt;/g, "<")
				.replace(/&gt;/g, ">");

			return formatted.trim();
		} else {
			// for raw text apply basic formatting
			return reviewText.replace(/\\"/g, '"').trim();
		}
	}

	/**
	 * Build an index of all existing notes by their hardcoverBookId.
	 * Call this once at the start of sync for O(1) lookups instead of O(n) per book.
	 */
	buildNoteIndex(): Map<number, TFile> {
		const index = new Map<number, TFile>();
		const folderPath = this.plugin.settings.targetFolder;
		const files = this.getMarkdownFiles(folderPath);

		for (const file of files) {
			const fileCache = this.plugin.app.metadataCache.getFileCache(file);
			const frontmatter = fileCache?.frontmatter;

			if (frontmatter && typeof frontmatter.hardcoverBookId === "number") {
				index.set(frontmatter.hardcoverBookId, file);
			}
		}

		return index;
	}

	async findNoteByHardcoverId(hardcoverBookId: number): Promise<TFile | null> {
		try {
			const folderPath = this.plugin.settings.targetFolder;

			const files = this.getMarkdownFiles(folderPath);

			for (const file of files) {
				const fileCache = this.plugin.app.metadataCache.getFileCache(file);
				const frontmatter = fileCache?.frontmatter;

				if (frontmatter && frontmatter.hardcoverBookId === hardcoverBookId) {
					return file;
				}
			}

			return null;
		} catch (error) {
			console.error(
				`Error finding note by Hardcover Book ID ${hardcoverBookId}:`,
				error
			);
			return null;
		}
	}

	private formatAsWikilinks(values: string[], fieldKey: string): string[] {
		return values.map((value) => {
			// extract base name for contributors and series
			if (fieldKey === "contributors") {
				const match = value.match(/^(.+?)\s*\((.+)\)$/);
				if (match) {
					return `[[${match[1].trim()}|${value}]]`;
				}
			} else if (fieldKey === "series") {
				const match = value.match(/^(.+?)\s*#(\d+)$/);
				if (match) {
					return `[[${match[1].trim()}|${value}]]`;
				}
			}

			return `[[${value}]]`;
		});
	}

	private applyWikilinkFormatting(metadata: BookMetadata): BookMetadata {
		const formattedMetadata = { ...metadata };
		const settings = this.plugin.settings.fieldsSettings;

		if (
			settings.authors.wikilinks &&
			formattedMetadata[settings.authors.propertyName]
		) {
			formattedMetadata[settings.authors.propertyName] = this.formatAsWikilinks(
				formattedMetadata[settings.authors.propertyName],
				"authors"
			);
		}

		if (
			settings.contributors.wikilinks &&
			formattedMetadata[settings.contributors.propertyName]
		) {
			formattedMetadata[settings.contributors.propertyName] =
				this.formatAsWikilinks(
					formattedMetadata[settings.contributors.propertyName],
					"contributors"
				);
		}

		if (
			settings.series.wikilinks &&
			formattedMetadata[settings.series.propertyName]
		) {
			formattedMetadata[settings.series.propertyName] = this.formatAsWikilinks(
				formattedMetadata[settings.series.propertyName],
				"series"
			);
		}

		if (
			settings.publisher.wikilinks &&
			formattedMetadata[settings.publisher.propertyName]
		) {
			const publisherValue = formattedMetadata[settings.publisher.propertyName];
			formattedMetadata[
				settings.publisher.propertyName
			] = `[[${publisherValue}]]`;
		}

		if (
			settings.genres.wikilinks &&
			formattedMetadata[settings.genres.propertyName]
		) {
			formattedMetadata[settings.genres.propertyName] = this.formatAsWikilinks(
				formattedMetadata[settings.genres.propertyName],
				"genres"
			);
		}

		if (
			settings.lists.wikilinks &&
			formattedMetadata[settings.lists.propertyName]
		) {
			formattedMetadata[settings.lists.propertyName] = this.formatAsWikilinks(
				formattedMetadata[settings.lists.propertyName],
				"lists"
			);
		}

		return formattedMetadata;
	}

	private formatNameAsLastFirst(name: string): string {
		name = name.trim();
		// if name already contains a comma, assume it's already in "Last, First" format
		if (name.includes(",")) {
			return name;
		}

		const parts = name.split(/\s+/).filter((p) => p.length > 0);

		if (parts.length === 1) {
			return name;
		}

		// check for generational suffixes
		const suffixes = [
			"jr.",
			"jr",
			"junior",
			"sr.",
			"sr",
			"senior",
			"ii",
			"iii",
			"iv",
			"v",
			"vi",
			"vii",
			"viii",
			"ix",
			"x",
		];

		let lastNameIndex = parts.length - 1;
		let suffix = "";

		// check if last part is a suffix
		if (suffixes.includes(parts[lastNameIndex].toLowerCase())) {
			suffix = parts[lastNameIndex];
			lastNameIndex--;

			// safety check
			if (lastNameIndex < 0) {
				return name; // malformed, return as-is
			}
		}

		const lastName = parts[lastNameIndex];
		const firstName = parts.slice(0, lastNameIndex).join(" ");

		return suffix
			? `${lastName} ${suffix}, ${firstName}`
			: `${lastName}, ${firstName}`;
	}

	private findFallbackAuthor(
		contributorsData: Record<any, any>[]
	): string | null {
		if (
			!contributorsData ||
			!Array.isArray(contributorsData) ||
			contributorsData.length === 0
		) {
			return null;
		}

		// try Writer
		const writers = contributorsData
			.filter((item) => item.contribution === "Writer")
			.map((item) => item.author?.name)
			.filter((name) => !!name);

		if (writers.length > 0) {
			return writers[0];
		}

		// try Editor
		const editors = contributorsData
			.filter((item) => item.contribution === "Editor")
			.map((item) => item.author?.name)
			.filter((name) => !!name);

		if (editors.length > 0) {
			return editors[0];
		}

		// use first contributor available
		const firstContributor = contributorsData
			.map((item) => item.author?.name)
			.filter((name) => !!name)[0];

		return firstContributor || null;
	}

	private getMarkdownFiles(folderPath: string): TFile[] {
		const folder = this.vault.getFolderByPath(folderPath);
		if (!folder) return [];

		const files: TFile[] = [];

		const traverse = (current: any) => {
			for (const child of current.children) {
				if ((child instanceof TFile || child?.extension === "md") && child.extension === "md") {
					files.push(child);
				} else if ((typeof TFolder !== "undefined" && child instanceof TFolder) || child?.children) {
					traverse(child);
				}
			}
		};

		traverse(folder);
		return files;
	}
}
