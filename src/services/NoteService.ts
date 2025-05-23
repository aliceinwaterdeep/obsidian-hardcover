import { TFile, Vault } from "obsidian";
import { CONTENT_DELIMITER } from "src/config/constants";
import { FIELD_DEFINITIONS } from "src/config/fieldDefinitions";

import ObsidianHardcover from "src/main";
import { ActivityDateFieldConfig, BookMetadata } from "src/types";
import { FileUtils } from "src/utils/FileUtils";

export class NoteService {
	constructor(
		private vault: Vault,
		private fileUtils: FileUtils,
		private plugin: ObsidianHardcover
	) {
		this.plugin = plugin;
	}

	async createNote(bookMetadata: BookMetadata): Promise<TFile | null> {
		try {
			const filename = this.fileUtils.processFilenameTemplate(
				this.plugin.settings.filenameTemplate,
				bookMetadata
			);

			const targetFolder = this.fileUtils.normalizePath(
				this.plugin.settings.targetFolder
			);
			await this.ensureFolderExists(targetFolder);
			const fullPath = targetFolder ? `${targetFolder}/${filename}` : filename;

			// create frontmatter and full note content with delimiter
			const frontmatter = this.createFrontmatter(bookMetadata);
			const noteContent = this.createNoteContent(frontmatter, bookMetadata);

			let file;
			if (await this.vault.adapter.exists(fullPath)) {
				// if file exists, write to it and then get the file reference
				await this.vault.adapter.write(fullPath, noteContent);
				file = this.vault.getAbstractFileByPath(fullPath) as TFile;
				console.log(`Updated note: ${fullPath}`);
			} else {
				// create new file
				file = await this.vault.create(fullPath, noteContent);
				console.log(`Created note: ${fullPath}`);
			}

			return file;
		} catch (error) {
			console.error("Error creating note:", error);
			return null;
		}
	}

	async updateNote(
		bookMetadata: BookMetadata,
		existingFile: TFile
	): Promise<TFile | null> {
		try {
			const originalPath = existingFile.path;
			const existingContent = await this.vault.read(existingFile);

			const frontmatter = this.createFrontmatter(bookMetadata);
			const newContent = this.createNoteContent(frontmatter, bookMetadata);
			// check if the delimiter exists in the current content
			const delimiterIndex = existingContent.indexOf(CONTENT_DELIMITER);

			let updatedContent: string;
			if (delimiterIndex !== -1) {
				// preserve original content after it
				const userContent = existingContent.substring(
					delimiterIndex + CONTENT_DELIMITER.length
				);

				updatedContent = newContent.replace(
					`${CONTENT_DELIMITER}\n\n`,
					`${CONTENT_DELIMITER}${userContent}`
				);
			} else {
				updatedContent = newContent;
			}

			// generate the new filename based on current template
			const newFilename = this.fileUtils.processFilenameTemplate(
				this.plugin.settings.filenameTemplate,
				bookMetadata
			);

			const targetFolder = this.fileUtils.normalizePath(
				this.plugin.settings.targetFolder
			);
			const newPath = targetFolder
				? `${targetFolder}/${newFilename}`
				: newFilename;

			// check if the file needs to be renamed
			if (originalPath !== newPath) {
				await this.vault.modify(existingFile, updatedContent);
				await this.vault.rename(existingFile, newPath);

				console.log(`Updated and renamed note: ${originalPath} -> ${newPath}`);

				// get the new file reference after renaming
				return this.vault.getAbstractFileByPath(newPath) as TFile;
			} else {
				await this.vault.modify(existingFile, updatedContent);
				console.log(`Updated note: ${originalPath}`);

				return existingFile;
			}
		} catch (error) {
			console.error("Error updating note:", error);
			return null;
		}
	}

	private createNoteContent(frontmatter: string, bookMetadata: any): string {
		let content = this.getFrontmatterString(frontmatter);

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

		const exists = await this.vault.adapter.exists(folderPath);
		if (!exists) {
			console.log(`Creating folder: ${folderPath}`);
			await this.vault.createFolder(folderPath);
		}
	}

	private getFrontmatterString(frontmatter: string) {
		return `---\n${frontmatter}\n---\n\n`;
	}

	private createFrontmatter(metadata: Record<string, any>): string {
		// exclude bodyContent from frontmatter
		const { bodyContent, ...frontmatterData } = metadata;

		const frontmatterEntries: string[] = [];

		// first add hardcoverBookId as the first property
		if (frontmatterData.hardcoverBookId !== undefined) {
			frontmatterEntries.push(
				`hardcoverBookId: ${frontmatterData.hardcoverBookId}`
			);
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

			if (Array.isArray(value)) {
				frontmatterEntries.push(`${propName}: ${JSON.stringify(value)}`);
			} else if (typeof value === "string") {
				if (
					propName ===
					this.plugin.settings.fieldsSettings.description.propertyName
				) {
					// remove all \n sequences and replace with spaces to avoid frontmatter issues
					const cleanValue = value.replace(/\\n/g, " ").trim();
					// remove any multiple spaces that might result
					const finalValue = cleanValue.replace(/\s+/g, " ");
					frontmatterEntries.push(
						`${propName}: "${finalValue.replace(/"/g, '\\"')}"`
					);
				} else {
					// for other string fields, just escape quotes
					frontmatterEntries.push(
						`${propName}: "${value.replace(/"/g, '\\"')}"`
					);
				}
			} else {
				frontmatterEntries.push(`${propName}: ${value}`);
			}
		}

		return frontmatterEntries.join("\n");
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

	async findNoteByHardcoverId(hardcoverBookId: number): Promise<TFile | null> {
		try {
			const folderPath = this.plugin.settings.targetFolder;

			const folderExists = await this.vault.adapter.exists(folderPath);
			if (!folderExists) {
				console.log(`Specified target folder doesn't exist: ${folderPath}`);
				return null;
			}

			// get all markdown files in the folder
			const folder = this.vault.getFolderByPath(folderPath);
			if (!folder) {
				console.log(`Couldn't get folder object for: ${folderPath}`);
				return null;
			}

			// search through files in the folder
			for (const file of folder.children) {
				// only check markdown files
				if (file instanceof TFile && file.extension === "md") {
					const content = await this.vault.read(file);

					// check if it has frontmatter
					const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
					if (frontmatterMatch) {
						const frontmatter = frontmatterMatch[1];

						// check if hardcoverBookId matches
						const idMatch = frontmatter.match(/hardcoverBookId:\s*(\d+)/);
						if (idMatch && parseInt(idMatch[1]) === hardcoverBookId) {
							return file;
						}
					}
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
}
