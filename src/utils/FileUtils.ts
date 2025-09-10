export class FileUtils {
	sanitizeFilename(name: string): string {
		return name
			.replace(/[\\/:*?"<>|]/g, "") // remove illegal characters
			.replace(/\s+/g, " ") // replace multiple spaces with single space
			.trim(); // remove leading/trailing spaces
	}

	normalizePath(path: string): string {
		// remove leading and trailing slashes
		let normalized = path.replace(/^\/+|\/+$/g, "");
		// remove duplicate slashes
		normalized = normalized.replace(/\/+/g, "/");
		return normalized;
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
		const normalizedPath = this.normalizePath(path);
		return !normalizedPath || normalizedPath === "/";
	}

	processFilenameTemplate(template: string, metadata: any): string {
		let filename = template;

		if (metadata.title) {
			filename = filename.replace(/\${title}/g, metadata.title);
		}

		if (metadata.authors && Array.isArray(metadata.authors)) {
			const authorsString = metadata.authors.join(", ");
			filename = filename.replace(/\${authors}/g, authorsString);
		}

		if (metadata.releaseDate) {
			try {
				const year = new Date(metadata.releaseDate).getFullYear();
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
