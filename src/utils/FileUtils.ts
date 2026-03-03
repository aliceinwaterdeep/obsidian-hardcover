import { normalizePath } from "obsidian";
import { FrontmatterFieldsSettings } from "src/types";

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

	processFilenameTemplate(
		template: string,
		metadata: any,
		fieldsSettings: FrontmatterFieldsSettings,
	): string {
		let filename = template;

		const frontmatter = metadata.frontmatter ?? metadata;

		const titleProperty = fieldsSettings.editionTitle.propertyName;
		const titleValue =
			frontmatter[titleProperty] ??
			frontmatter[fieldsSettings.bookTitle?.propertyName];
		if (titleValue) {
			filename = filename.replace(/\${title}/g, titleValue);
		}

		const authorsProperty = fieldsSettings.editionAuthors.propertyName;
		const authorsValue = frontmatter[authorsProperty];
		if (authorsValue && Array.isArray(authorsValue)) {
			const authorsString = authorsValue.join(", ");
			filename = filename.replace(/\${authors}/g, authorsString);
		}

		const releaseDateProperty = fieldsSettings.editionReleaseDate.propertyName;
		const releaseDateValue = frontmatter[releaseDateProperty];
		if (releaseDateValue) {
			try {
				const year = new Date(releaseDateValue).getFullYear();

				if (!isNaN(year)) {
					filename = filename.replace(/\${year}/g, year.toString());
				} else {
					filename = filename.replace(/\${year}/g, "");
				}
			} catch (error) {
				console.error("Error extracting year from release date:", error);
				filename = filename.replace(/\${year}/g, "");
			}
		} else {
			filename = filename.replace(/\${year}/g, "");
		}

		// only clean up empty brackets and extra spacing, but preserve user's intentional formatting
		filename = filename
			.replace(/\(\s*\)/g, "")
			.replace(/\[\s*\]/g, "")
			.replace(/\{\s*\}/g, "")
			.replace(/\s+-\s*$/g, "")
			.replace(/\s+/g, " ")
			.trim();

		// replace any unsupported template variables with empty string
		filename = filename.replace(/\${[^}]+}/g, "");
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
				.replace(/\_/g, "\\_")
				.replace(/\`/g, "\\`")
				// headings and tags
				.replace(/\#/g, "\\#")
				// HTML tags
				.replace(/\</g, "\\<")
		);
	}

	getDirectoryPath(fullPath: string): string | null {
		const pathSeparatorIndex = fullPath.lastIndexOf("/");
		return pathSeparatorIndex > 0
			? fullPath.substring(0, pathSeparatorIndex)
			: null;
	}
}
