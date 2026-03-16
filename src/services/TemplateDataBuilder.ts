import { parseYaml } from "obsidian";
import { HARDCOVER_BOOKS_ROUTE, HARDCOVER_URL } from "src/config/constants";
import { HardcoverUserBook, PluginSettings } from "src/types";
import { FileUtils } from "src/utils/FileUtils";
import {
	extractAuthors,
	extractContributors,
	extractReadingActivity,
	extractSeriesInfo,
} from "./metadata/MetadataHelpers";

export class TemplateDataBuilder {
	private settings: PluginSettings;
	private fileUtils: FileUtils;

	constructor(settings: PluginSettings, fileUtils: FileUtils) {
		this.settings = settings;
		this.fileUtils = fileUtils;
	}

	updateSettings(settings: PluginSettings): void {
		this.settings = settings;
	}

	build(
		userBook: HardcoverUserBook,
		bookToListsMap?: Map<number, string[]> | null,
	): {
		frontmatter: Record<string, any>; // parsed YAML template with variables substituted (for processFrontMatter)
		variables: Record<string, any>; // all extracted variables (for body template rendering)
		rawContributors?: Record<any, any>[];
	} {
		const template = this.settings.noteTemplate;
		const parsedTemplate = this.parseTemplateYAML(template);

		const frontmatter: Record<string, any> = {};
		let rawContributors: Record<any, any>[] | undefined;

		const { book, edition, user_book_reads: readingActivity } = userBook;

		// build a map of all available variables
		const variables: Record<string, any> = {};

		// always add hardcoverBookId (even if not in template)
		frontmatter.hardcoverBookId = userBook.book_id;

		// book/edition titles
		if (book?.title) {
			variables.bookTitle = this.fileUtils.normalizeText(book.title);
		}
		if (edition?.title) {
			variables.editionTitle = this.fileUtils.normalizeText(edition.title);
		}

		// covers
		if (book?.cached_image?.url) {
			variables.bookCover = book.cached_image.url;
		}
		if (edition?.cached_image?.url) {
			variables.editionCover = edition.cached_image.url;
		}

		// release dates
		if (book?.release_date) {
			variables.bookReleaseDate = book.release_date;
		}
		if (edition?.release_date) {
			variables.editionReleaseDate = edition.release_date;
		}

		// authors
		if (book?.cached_contributors) {
			const authors = extractAuthors(book.cached_contributors);
			rawContributors = book.cached_contributors;
			if (authors.length) {
				variables.bookAuthors = authors;
			}
		}
		if (edition?.cached_contributors) {
			const authors = extractAuthors(edition.cached_contributors);
			if (!rawContributors) {
				rawContributors = edition.cached_contributors;
			}
			if (authors.length) {
				variables.editionAuthors = authors;
			}
		}

		// contributors
		if (book?.cached_contributors) {
			const otherContributors = extractContributors(
				book.cached_contributors,
				this.fileUtils,
			);
			if (otherContributors.length) {
				variables.bookContributors = otherContributors.map(
					(c) => `${c.name} (${c.role})`,
				);
			}
		}
		if (edition?.cached_contributors) {
			const otherContributors = extractContributors(
				edition.cached_contributors,
				this.fileUtils,
			);
			if (otherContributors.length) {
				variables.editionContributors = otherContributors.map(
					(c) => `${c.name} (${c.role})`,
				);
			}
		}

		// description
		if (book?.description) {
			variables.description = book.description;
		}

		// URL
		if (book?.slug) {
			variables.url = `${HARDCOVER_URL}${HARDCOVER_BOOKS_ROUTE}${book.slug}`;
		}

		// series
		if (book?.book_series?.length) {
			const seriesInfo = extractSeriesInfo(book.book_series);
			if (seriesInfo.length) {
				variables.series = seriesInfo;
			}
		}

		// publisher
		if (edition?.publisher?.name) {
			variables.publisher = [edition.publisher.name];
		}

		// ISBNs
		if (edition?.isbn_10) {
			variables.isbn10 = edition.isbn_10;
		}
		if (edition?.isbn_13) {
			variables.isbn13 = edition.isbn_13;
		}

		// genres
		if (book?.cached_tags?.Genre) {
			const genres = book.cached_tags.Genre.map((t: any) => t.tag).filter(
				(genre: string) => !!genre,
			);
			if (genres.length > 0) {
				variables.genres = genres;
			}
		}

		// lists
		if (bookToListsMap) {
			const lists = bookToListsMap.get(userBook.book_id);
			if (lists && lists.length > 0) {
				variables.lists = lists;
			}
		}

		// rating
		if (userBook.rating !== null) {
			variables.rating = userBook.rating;
		}

		// status
		if (userBook.status_id !== null) {
			variables.status = this.mapStatus(userBook.status_id);
		}

		// reading activity
		if (readingActivity && readingActivity.length > 0) {
			const activity = extractReadingActivity(readingActivity);

			if (activity.firstRead) {
				variables.firstReadStart = activity.firstRead.start;
				variables.firstReadEnd = activity.firstRead.end;
			}

			if (activity.lastRead) {
				variables.lastReadStart = activity.lastRead.start;
				variables.lastReadEnd = activity.lastRead.end;
			}

			if (activity.totalReads) {
				variables.totalReads = activity.totalReads;
			}

			if (activity.readYears.length > 0) {
				variables.readYears = activity.readYears;
			}
		}

		//  substitute variables in the parsed template
		for (const [key, value] of Object.entries(parsedTemplate)) {
			frontmatter[key] = this.substituteValue(value, variables);
		}

		// frontmatter: parsed template YAML with variables already substituted
		// variables: raw extracted data for body template
		return { frontmatter, variables, rawContributors };
	}

	private substituteValue(value: any, variables: Record<string, any>): any {
		if (typeof value === "string") {
			// check if it's a variable like {{editionTitle}}
			const variableMatch = value.match(/^\{\{(\w+)\}\}$/);
			if (variableMatch) {
				const varName = variableMatch[1];
				return variables[varName] !== undefined ? variables[varName] : "";
			}
			// if it contains variables but isn't only a variable, do replacement
			if (value.includes("{{")) {
				let result = value;
				for (const [varName, varValue] of Object.entries(variables)) {
					const regex = new RegExp(`\\{\\{${varName}\\}\\}`, "g");
					const replacement = Array.isArray(varValue)
						? varValue.join(", ")
						: String(varValue || "");
					result = result.replace(regex, replacement);
				}
				return result;
			}
			// no variables, return as-is
			return value;
		} else if (Array.isArray(value)) {
			// recursively substitute in arrays
			return value.map((item) => this.substituteValue(item, variables));
		} else if (typeof value === "object" && value !== null) {
			// recursivly substitute in objects
			const result: Record<string, any> = {};
			for (const [k, v] of Object.entries(value)) {
				result[k] = this.substituteValue(v, variables);
			}
			return result;
		}
		// numbers, booleans, null get returned as is
		return value;
	}

	private mapStatus(statusId: number): string[] {
		const statusText =
			this.settings.statusMapping[statusId] || `Unknown (${statusId})`;
		// return as array so obsidian property is a list
		return [statusText];
	}

	private parseTemplateYAML(template: string): Record<string, any> {
		// extract YAML block from template (between --- delimiters)
		const yamlMatch = template.match(/^---\n([\s\S]*?)\n---/);

		if (!yamlMatch || !yamlMatch[1]) {
			// no YAML block found, return empty object
			return {};
		}

		const yamlContent = yamlMatch[1];

		try {
			const parsed = parseYaml(yamlContent);
			return parsed || {};
		} catch (error) {
			console.error("Failed to parse template YAML:", error);
			return {};
		}
	}
}
