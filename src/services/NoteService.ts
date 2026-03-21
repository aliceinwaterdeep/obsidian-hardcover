import { normalizePath, TFile, TFolder, Vault } from "obsidian";
import { CONTENT_DELIMITER } from "src/config/constants";

import ObsidianHardcover from "src/main";
import { BookMetadata, GroupingSettings } from "src/types";
import { FileUtils } from "src/utils/FileUtils";
import { BodyTemplateRenderer } from "./note/BodyTemplateRenderer";

export class NoteService {
	private bodyTemplateRenderer: BodyTemplateRenderer;

	constructor(
		private vault: Vault,
		private fileUtils: FileUtils,
		private plugin: ObsidianHardcover,
	) {
		this.plugin = plugin;
		this.bodyTemplateRenderer = new BodyTemplateRenderer(plugin);
	}

	async createNote(
		bookMetadata: BookMetadata,
		rawContributors?: Record<any, any>[],
	): Promise<TFile | null> {
		try {
			const fullPath = this.generateNotePath(
				bookMetadata,
				this.plugin.settings.grouping,
				rawContributors,
			);

			const directoryPath = this.fileUtils.getDirectoryPath(fullPath);
			if (directoryPath) {
				await this.ensureFolderExists(directoryPath);
			}

			// prepare frontmatter with proper ordering and filtering
			const frontmatterData = this.prepareFrontmatter(bookMetadata);

			// create body content only
			const bodyContent = this.bodyTemplateRenderer.render(bookMetadata);

			// check if file exists
			const existingFile = this.vault.getFileByPath(fullPath);
			let file: TFile;

			if (existingFile) {
				await this.vault.modify(existingFile, bodyContent);
				file = existingFile;

				if (IS_DEV) {
					console.debug(`Updated note: ${fullPath}`);
				}
			} else {
				file = await this.vault.create(fullPath, bodyContent);
				if (IS_DEV) {
					console.debug(`Created note: ${fullPath}`);
				}
			}

			// add frontmatter using processFrontMatter
			await this.plugin.app.fileManager.processFrontMatter(
				file,
				(frontmatter) => {
					Object.assign(frontmatter, frontmatterData);
				},
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
		rawContributors?: Record<any, any>[],
	): Promise<TFile | null> {
		try {
			const originalPath = existingFile.path;
			const existingContent = await this.vault.cachedRead(existingFile);
			const { bodyText: existingBodyText } = this.extractFrontmatter(
				existingContent,
				existingFile,
			);

			// read existing frontmatter before modifications
			const existingFrontmatter: Record<string, any> = {};
			const fileCache =
				this.plugin.app.metadataCache.getFileCache(existingFile);
			if (fileCache?.frontmatter) {
				Object.assign(existingFrontmatter, fileCache.frontmatter);
			}

			const managedFrontmatterKeys = this.getManagedFrontmatterKeys();
			const preserveCustomFrontmatter =
				this.plugin.settings.preserveCustomFrontmatter !== false;

			// create new body content
			const newBodyContent = this.bodyTemplateRenderer.render(bookMetadata);

			// check if delimiter exists in the current content
			const delimiterIndex = existingBodyText.indexOf(CONTENT_DELIMITER);
			let updatedContent: string;

			if (delimiterIndex !== -1) {
				const userContent = existingBodyText.substring(
					delimiterIndex + CONTENT_DELIMITER.length,
				);
				updatedContent = newBodyContent + userContent;
			} else {
				updatedContent = newBodyContent;
			}

			const newPath = this.generateNotePath(
				bookMetadata,
				this.plugin.settings.grouping,
				rawContributors,
			);

			// determine if we should auto-organize (move/rename)
			const shouldAutoOrganize =
				!this.plugin.settings.grouping.enabled ||
				this.plugin.settings.grouping.autoOrganizeFolders;

			// get current file's directory and filename
			const currentDirectory = this.fileUtils.getDirectoryPath(originalPath);
			const currentFilename = originalPath.substring(
				currentDirectory ? currentDirectory.length + 1 : 0,
			);

			// get new directory and filename
			const newDirectory = this.fileUtils.getDirectoryPath(newPath);
			const newFilename = newPath.substring(
				newDirectory ? newDirectory.length + 1 : 0,
			);

			// determine the actual target path based on auto-organize setting
			let targetPath: string;
			if (shouldAutoOrganize) {
				// use the full new path (folder + filename)
				targetPath = newPath;

				// ensure target directory exists
				if (newDirectory) {
					await this.ensureFolderExists(newDirectory);
				}
			} else {
				// keep current folder, but update filename
				targetPath = currentDirectory
					? `${currentDirectory}/${newFilename}`
					: newFilename;
			}

			// prepare frontmatter data once
			const frontmatterDataToWrite = this.prepareFrontmatter(bookMetadata);

			// check if the file needs to be renamed/moved
			if (originalPath !== targetPath) {
				await this.vault.modify(existingFile, updatedContent);
				await this.vault.rename(existingFile, targetPath);

				if (IS_DEV) {
					console.debug(
						`Updated and renamed note: ${originalPath} -> ${targetPath}`,
					);
				}

				// get the new file reference after renaming
				const renamedFile = this.vault.getFileByPath(targetPath);
				if (!renamedFile) return null;

				// update frontmatter
				await this.plugin.app.fileManager.processFrontMatter(
					renamedFile,
					(frontmatter) => {
						// restore the existing frontmatter
						Object.assign(frontmatter, existingFrontmatter);
						// update with new data
						this.updateFrontmatterObject(
							frontmatter,
							frontmatterDataToWrite,
							managedFrontmatterKeys,
							preserveCustomFrontmatter,
							this.getManagedOrder(frontmatterDataToWrite),
						);
					},
				);

				return renamedFile;
			} else {
				// update content and frontmatter in place
				await this.vault.modify(existingFile, updatedContent);

				// update frontmatter - CHANGED
				await this.plugin.app.fileManager.processFrontMatter(
					existingFile,
					(frontmatter) => {
						// First restore the existing frontmatter
						Object.assign(frontmatter, existingFrontmatter);
						// Then update with new data
						this.updateFrontmatterObject(
							frontmatter,
							frontmatterDataToWrite,
							managedFrontmatterKeys,
							preserveCustomFrontmatter,
							this.getManagedOrder(frontmatterDataToWrite),
						);
					},
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
		rawContributors?: Record<any, any>[],
	): string {
		const filename = this.fileUtils.processFilenameTemplate(
			this.plugin.settings.filenameTemplate,
			bookMetadata.variables,
		);

		let basePath = normalizePath(this.plugin.settings.targetFolder);

		if (groupingSettings.enabled) {
			const directories = this.buildDirectoryPath(
				bookMetadata,
				groupingSettings,
				rawContributors,
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
		rawContributors?: Record<any, any>[],
	): string {
		const pathComponents: string[] = [];

		if (
			groupingSettings.groupBy === "author" ||
			groupingSettings.groupBy === "author-series"
		) {
			const authorDirectory = this.getAuthorDirectory(
				bookMetadata,
				rawContributors,
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
		rawContributors?: Record<any, any>[],
	): string | null {
		const authors = bookMetadata.variables.editionAuthors;

		// check if multiple authors and should use collections folder
		if (
			Array.isArray(authors) &&
			authors.length > 1 &&
			this.plugin.settings.grouping.multipleAuthorsBehavior ===
				"useCollectionsFolder"
		) {
			return this.fileUtils.sanitizeFolderName(
				this.plugin.settings.grouping.collectionsFolderName,
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
				this.plugin.settings.grouping.fallbackFolderName,
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
		const series = bookMetadata.variables.series;

		if (Array.isArray(series) && series.length > 0) {
			let seriesName = series[0];

			// extract series name from wikilink format: [[Series|Series #1]] -> Series
			const wikilinkMatch = seriesName.match(
				/^\[\[([^|\]]+)(?:\|[^\]]+)?\]\]$/,
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

	private async ensureFolderExists(folderPath: string): Promise<void> {
		if (!folderPath) return;

		const folder = this.vault.getFolderByPath(folderPath);
		if (!folder) {
			if (IS_DEV) {
				console.debug(`Creating folder: ${folderPath}`);
			}
			await this.vault.createFolder(folderPath);
		}
	}

	private prepareFrontmatter(metadata: BookMetadata): Record<string, any> {
		const frontmatterData: Record<string, any> = {
			hardcoverBookId: metadata.hardcoverBookId,
			...metadata.frontmatter,
		};
		const prepared: Record<string, any> = {};

		// get managed order from template
		const managedOrder = this.getManagedOrder(frontmatterData);

		// add properties in the order they appear in the template
		for (const propName of managedOrder) {
			if (!frontmatterData.hasOwnProperty(propName)) continue;

			const value = frontmatterData[propName];

			// skip undefined/null values
			if (value === undefined || value === null) continue;

			// remove all \n sequences and replace with spaces to avoid frontmatter issues
			if (propName === "description" && typeof value === "string") {
				const cleanValue = value.replace(/\\n/g, " ").trim();
				// remove any multiple spaces that might result
				const finalValue = cleanValue.replace(/\s+/g, " ");
				prepared[propName] = finalValue;
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
		managedOrder: string[],
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

		// add all managed keys in their defined order (from FRONTMATTER_FIELDS_DEFINITIONS)
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

		// parse the noteTemplate to extract YAML property names
		const template = this.plugin.settings.noteTemplate;

		// extract YAML block (between --- delimiters)
		const yamlMatch = template.match(/^---\n([\s\S]*?)\n---/);

		if (yamlMatch && yamlMatch[1]) {
			const yamlContent = yamlMatch[1];

			// extract property names (everything before the first : on each line)
			const lines = yamlContent.split("\n");
			for (const line of lines) {
				const trimmed = line.trim();
				if (trimmed && !trimmed.startsWith("#")) {
					const colonIndex = trimmed.indexOf(":");
					if (colonIndex > 0) {
						const propName = trimmed.substring(0, colonIndex).trim();
						keys.add(propName);
					}
				}
			}
		}

		return keys;
	}

	private getManagedOrder(frontmatterData: Record<string, any>): string[] {
		const order: string[] = [];

		// hardcoverBookId always comes first
		if ("hardcoverBookId" in frontmatterData) {
			order.push("hardcoverBookId");
		}

		// parse the noteTemplate to get the order from YAML block
		const template = this.plugin.settings.noteTemplate;

		// extract YAML block
		const yamlMatch = template.match(/^---\n([\s\S]*?)\n---/);

		if (yamlMatch && yamlMatch[1]) {
			const yamlContent = yamlMatch[1];

			// extract property names in order
			const lines = yamlContent.split("\n");
			for (const line of lines) {
				const trimmed = line.trim();
				if (trimmed && !trimmed.startsWith("#")) {
					const colonIndex = trimmed.indexOf(":");
					if (colonIndex > 0) {
						const propName = trimmed.substring(0, colonIndex).trim();
						// add to order if it exists in the data and isn't already added
						if (propName in frontmatterData && !order.includes(propName)) {
							order.push(propName);
						}
					}
				}
			}
		}

		return order;
	}

	private extractFrontmatter(
		content: string,
		file: TFile,
	): {
		bodyText: string;
	} {
		const cache = this.plugin.app.metadataCache.getFileCache(file);
		const frontmatterEnd = cache?.frontmatterPosition?.end;

		if (frontmatterEnd !== undefined) {
			const endOffset = frontmatterEnd.offset;
			const bodyText = content.slice(endOffset);
			return { bodyText };
		}

		return { bodyText: content };
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
				error,
			);
			return null;
		}
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
		contributorsData: Record<any, any>[],
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
