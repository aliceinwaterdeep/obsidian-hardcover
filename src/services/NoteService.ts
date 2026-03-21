import { normalizePath, TFile, TFolder, Vault } from "obsidian";
import { CONTENT_DELIMITER } from "src/config/constants";

import ObsidianHardcover from "src/main";
import { BookMetadata, GroupingSettings } from "src/types";
import { FileUtils } from "src/utils/FileUtils";
import { BodyTemplateRenderer } from "./note/BodyTemplateRenderer";
import { FrontmatterManager } from "./note/FrontmatterManager";
import { NotePathBuilder } from "./note/NotePathBuilder";

export class NoteService {
	private bodyTemplateRenderer: BodyTemplateRenderer;
	private frontmatterManager: FrontmatterManager;
	private notePathBuilder: NotePathBuilder;

	constructor(
		private vault: Vault,
		private fileUtils: FileUtils,
		private plugin: ObsidianHardcover,
	) {
		this.plugin = plugin;
		this.bodyTemplateRenderer = new BodyTemplateRenderer(plugin);
		this.frontmatterManager = new FrontmatterManager(plugin);
		this.notePathBuilder = new NotePathBuilder(fileUtils, plugin);
	}

	async createNote(
		bookMetadata: BookMetadata,
		rawContributors?: Record<any, any>[],
	): Promise<TFile | null> {
		try {
			const fullPath = this.notePathBuilder.generateNotePath(
				bookMetadata,
				this.plugin.settings.grouping,
				rawContributors,
			);

			const directoryPath = this.fileUtils.getDirectoryPath(fullPath);
			if (directoryPath) {
				await this.ensureFolderExists(directoryPath);
			}

			// prepare frontmatter with proper ordering and filtering
			const frontmatterData =
				this.frontmatterManager.prepareFrontmatter(bookMetadata);

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
			const { bodyText: existingBodyText } =
				this.frontmatterManager.extractFrontmatter(
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

			const managedFrontmatterKeys =
				this.frontmatterManager.getManagedFrontmatterKeys();
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

			const newPath = this.notePathBuilder.generateNotePath(
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
			const frontmatterDataToWrite =
				this.frontmatterManager.prepareFrontmatter(bookMetadata);

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
						this.frontmatterManager.updateFrontmatterObject(
							frontmatter,
							frontmatterDataToWrite,
							managedFrontmatterKeys,
							preserveCustomFrontmatter,
							this.frontmatterManager.getManagedOrder(frontmatterDataToWrite),
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
						this.frontmatterManager.updateFrontmatterObject(
							frontmatter,
							frontmatterDataToWrite,
							managedFrontmatterKeys,
							preserveCustomFrontmatter,
							this.frontmatterManager.getManagedOrder(frontmatterDataToWrite),
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
