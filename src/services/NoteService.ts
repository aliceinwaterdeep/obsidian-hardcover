import { normalizePath, TFile, TFolder, Vault } from "obsidian";
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

			// check if file exists
			const existingFile = this.vault.getFileByPath(fullPath);
			let file: TFile;

			if (existingFile) {
				await this.vault.modify(existingFile, bodyContent);
				file = existingFile;

				if (IS_DEV) {
					// console.log(`Updated note: ${fullPath}`);
				}
			} else {
				file = await this.vault.create(fullPath, bodyContent);
				if (IS_DEV) {
					// console.log(`Created note: ${fullPath}`);
				}
			}

			// add frontmatter using processFrontMatter
			await this.plugin.app.fileManager.processFrontMatter(
				file,
				(frontmatter) => {
					Object.assign(frontmatter, frontmatterData);
				}
			);

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
			const { frontmatterText, bodyText: existingBodyText } =
				this.extractFrontmatter(existingContent);

			const formattedMetadata = this.applyWikilinkFormatting(bookMetadata);
			const { bodyContent, ...frontmatterData } = formattedMetadata;
			const managedFrontmatterKeys = this.getManagedFrontmatterKeys();
			const preserveCustomFrontmatter =
				this.plugin.settings.preserveCustomFrontmatter !== false;

			// create new body content
			const newBodyContent = this.createBodyContent(formattedMetadata);

			// check if delimiter exists in the current content
			const delimiterIndex = existingBodyText.indexOf(CONTENT_DELIMITER);
			let updatedContent: string;

			if (delimiterIndex !== -1) {
				const userContent = existingBodyText.substring(
					delimiterIndex + CONTENT_DELIMITER.length
				);
				const updatedBody = newBodyContent.replace(
					`${CONTENT_DELIMITER}\n\n`,
					`${CONTENT_DELIMITER}${userContent}`
				);
				updatedContent = `${frontmatterText}${updatedBody}`;
			} else {
				updatedContent = `${frontmatterText}${newBodyContent}`;
			}

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
				await this.vault.modify(existingFile, updatedContent);
				await this.vault.rename(existingFile, newPath);

				if (IS_DEV) {
					// console.log(
					// 	`Updated and renamed note: ${originalPath} -> ${newPath}`
					// );
				}

				// get the new file reference after renaming
				const renamedFile = this.vault.getFileByPath(newPath);
				if (!renamedFile) return null;

				// update frontmatter
				const frontmatterData = this.prepareFrontmatter(formattedMetadata);

				await this.plugin.app.fileManager.processFrontMatter(
					renamedFile,
					(frontmatter) => {
						this.updateFrontmatterObject(
							frontmatter,
							frontmatterData,
							managedFrontmatterKeys,
							preserveCustomFrontmatter,
							this.getManagedOrder(frontmatterData)
						);
					}
				);

				return renamedFile;
			} else {
				// update content and frontmatter
				await this.vault.modify(existingFile, updatedContent);

				await this.plugin.app.fileManager.processFrontMatter(
					existingFile,
					(frontmatter) => {
						this.updateFrontmatterObject(
							frontmatter,
							frontmatterData,
							managedFrontmatterKeys,
							preserveCustomFrontmatter,
							this.getManagedOrder(frontmatterData)
						);
					}
				);

				return existingFile;
			}
		} catch (error) {
			console.error("Error updating note:", error);
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
			return this.fileUtils.sanitizeFilename(
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
			if (IS_DEV) {
				// console.log(`Creating folder: ${folderPath}`);
			}
			await this.vault.createFolder(folderPath);
		}
	}

	private prepareFrontmatter(
		metadata: Record<string, any>
	): Record<string, any> {
		const { bodyContent, ...frontmatterData } = metadata;
		const prepared: Record<string, any> = {};

		// first add hardcoverBookId as the first property
		if (frontmatterData.hardcoverBookId !== undefined) {
			prepared.hardcoverBookId = frontmatterData.hardcoverBookId;
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
			// skip hardcoverBookId as we already added it
			if (propName === "hardcoverBookId") continue;

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

		// build map for rename detection: if an old key's value matches a new managed key's value,
		// it's likely a renamed property and shouldn't be preserved as custom
		const newManagedValues = new Map<string, string>();
		for (const key of managedKeys) {
			if (key in newData) {
				newManagedValues.set(JSON.stringify(newData[key]), key);
			}
		}

		// clear frontmatter to rebuild it with proper ordering
		for (const key of originalKeys) {
			delete frontmatter[key];
		}

		// add all managed keys in their defined order (from FIELD_DEFINITIONS)
		for (const key of managedOrderToUse) {
			if (key in newData) {
				frontmatter[key] = newData[key];
				added.add(key);
			}
		}

		// append custom keys at the end, skipping any that appear to be renamed managed keys
		if (preserveCustomFrontmatter) {
			for (const key of originalKeys) {
				if (!managedKeys.has(key) && !added.has(key)) {
					const oldValue = original[key];
					const serialized = JSON.stringify(oldValue);

					if (newManagedValues.has(serialized)) {
						// value matches a managed key = likely a rename, skip it
					} else {
						frontmatter[key] = oldValue;
					}
				}
			}
		}
	}

	private getManagedFrontmatterKeys(): Set<string> {
		const keys = new Set<string>();

		// hardcoverBookId is always managed by the plugin
		keys.add("hardcoverBookId");

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
		const order: string[] = [];

		// always start with hardcoverBookId
		if ("hardcoverBookId" in frontmatterData) {
			order.push("hardcoverBookId");
		}

		// follow the order defined in FIELD_DEFINITIONS to ensure consistent ordering
		// even when fields are enabled/disabled/renamed in settings
		for (const field of FIELD_DEFINITIONS) {
			const fieldSettings = this.plugin.settings.fieldsSettings[field.key];
			const propName = fieldSettings.propertyName;

			if (propName in frontmatterData) {
				order.push(propName);
			}

			// activity date fields have separate start/end properties
			if (field.isActivityDateField) {
				const activityField = fieldSettings as ActivityDateFieldConfig;
				if (activityField.startPropertyName in frontmatterData) {
					order.push(activityField.startPropertyName);
				}
				if (activityField.endPropertyName in frontmatterData) {
					order.push(activityField.endPropertyName);
				}
			}
		}

		return order;
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
				if (
					(child instanceof TFile || child?.extension === "md") &&
					child.extension === "md"
				) {
					files.push(child);
				} else if (
					(typeof TFolder !== "undefined" && child instanceof TFolder) ||
					child?.children
				) {
					traverse(child);
				}
			}
		};

		traverse(folder);
		return files;
	}
}
