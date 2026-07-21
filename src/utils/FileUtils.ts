import { normalizePath } from "obsidian";

export class FileUtils {
	sanitizeFilename(name: string): string {
		return name
			.replace(/[\\/:*?"<>|]/g, "") // remove illegal characters
			.replace(/\s+/g, " ") // replace multiple spaces with single space
			.trim() // remove leading/trailing spaces
			.replace(/\.+$/, "") // remove trailing dots (Obsidian doesn't allow them)
			.replace(/\s+$/, ""); // remove any trailing spaces left after dot removal
	}

	/**
	 * Sanitize a folder name (same rules as filenames - no trailing dots/spaces)
	 */
	sanitizeFolderName(name: string): string {
		return name
			.replace(/[\\/:*?"<>|]/g, "") // remove illegal characters
			.replace(/\s+/g, " ") // replace multiple spaces with single space
			.trim() // remove leading/trailing spaces
			.replace(/\.+$/, "") // remove trailing dots
			.replace(/\s+$/, ""); // remove any trailing spaces left after dot removal
	}

	normalizeText(text: string): string {
		return text
			.replace(/’/g, "'") // normalize curly apostrophe to straight
			.replace(/“/g, '"') // normalize curly quotes to straight
			.replace(/”/g, '"') // normalize other curly quote
			.replace(/–/g, "-") // normalize en dash to hyphen
			.replace(/—/g, "-"); // normalize em dash to hyphen
	}

	isRootOrEmpty(path: string): boolean {
		const normalizedPath = normalizePath(path);
		return !normalizedPath || normalizedPath === "/";
	}

	processFilenameTemplate(template: string, availableData: any): string {
		let filename = template;

		// {{editionTitle}}
		const editionTitleValue = availableData.editionTitle;
		if (editionTitleValue) {
			filename = filename.replace(/\{\{editionTitle\}\}/g, editionTitleValue);
		}

		// {{bookTitle}}
		const bookTitleValue = availableData.bookTitle;
		if (bookTitleValue) {
			filename = filename.replace(/\{\{bookTitle\}\}/g, bookTitleValue);
		}

		// {{editionAuthors}}
		const editionAuthorsValue = availableData.editionAuthors;
		if (editionAuthorsValue && Array.isArray(editionAuthorsValue)) {
			const authorsString = editionAuthorsValue.join(", ");
			filename = filename.replace(/\{\{editionAuthors\}\}/g, authorsString);
		}

		// {{bookAuthors}}
		const bookAuthorsValue = availableData.bookAuthors;
		if (bookAuthorsValue && Array.isArray(bookAuthorsValue)) {
			const authorsString = bookAuthorsValue.join(", ");
			filename = filename.replace(/\{\{bookAuthors\}\}/g, authorsString);
		}

		// {{editionYear}}
		const editionReleaseDateValue = availableData.editionReleaseDate;
		if (editionReleaseDateValue) {
			try {
				const year = new Date(editionReleaseDateValue).getFullYear();
				if (!isNaN(year)) {
					filename = filename.replace(/\{\{editionYear\}\}/g, year.toString());
				} else {
					filename = filename.replace(/\{\{editionYear\}\}/g, "");
				}
			} catch (error) {
				console.error(
					"Error extracting year from edition release date:",
					error,
				);
				filename = filename.replace(/\{\{editionYear\}\}/g, "");
			}
		} else {
			filename = filename.replace(/\{\{editionYear\}\}/g, "");
		}

		// {{bookYear}}
		const bookReleaseDateValue = availableData.bookReleaseDate;

		if (bookReleaseDateValue) {
			try {
				const year = new Date(bookReleaseDateValue).getFullYear();
				if (!isNaN(year)) {
					filename = filename.replace(/\{\{bookYear\}\}/g, year.toString());
				} else {
					filename = filename.replace(/\{\{bookYear\}\}/g, "");
				}
			} catch (error) {
				console.error("Error extracting year from book release date:", error);
				filename = filename.replace(/\{\{bookYear\}\}/g, "");
			}
		} else {
			filename = filename.replace(/\{\{bookYear\}\}/g, "");
		}

		// {{bookId}}
		const bookIdValue = availableData.bookId;
		if (bookIdValue) {
			filename = filename.replace(/\{\{bookId\}\}/g, String(bookIdValue));
		}

		// {{editionId}}
		const editionIdValue = availableData.editionId;
		if (editionIdValue) {
			filename = filename.replace(/\{\{editionId\}\}/g, String(editionIdValue));
		}

		// clean up empty brackets and extra spacing
		filename = filename
			.replace(/\(\s*\)/g, "")
			.replace(/\[\s*\]/g, "")
			.replace(/\{\s*\}/g, "")
			.replace(/\s+-\s*$/g, "")
			.replace(/\s+/g, " ")
			.trim();

		// replace any unsupported template variables with empty string
		filename = filename.replace(/\{\{[^}]+\}\}/g, "");

		return this.sanitizeFilename(filename) + ".md";
	}

	escapeMarkdownCharacters(text: string): string {
		return (
			text
				// brackets used for links in obsidian
				.replace(/\[/g, "\\[")
				.replace(/\]/g, "\\]")
				// obsidian formatting chars
				.replace(/\*/g, "\\*")
				.replace(/_/g, "\\_")
				.replace(/`/g, "\\`")
				// headings and tags
				.replace(/#/g, "\\#")
				// HTML tags
				.replace(/</g, "\\<")
		);
	}

	getDirectoryPath(fullPath: string): string | null {
		const pathSeparatorIndex = fullPath.lastIndexOf("/");
		return pathSeparatorIndex > 0
			? fullPath.substring(0, pathSeparatorIndex)
			: null;
	}
}
