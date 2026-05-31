import { CONTENT_DELIMITER } from "src/config/constants";
import { BookMetadata } from "src/types";
import ObsidianHardcover from "src/main";
import { WikilinkFormatter } from "src/utils/WikilinkFormatter";

export class BodyTemplateRenderer {
	constructor(private plugin: ObsidianHardcover) {}

	render(bookMetadata: BookMetadata): string {
		const fullTemplate = this.plugin.settings.noteTemplate;
		const bodyTemplate = this.extractBodyFromTemplate(fullTemplate);
		const variables = this.getTemplateVariables(bookMetadata);

		// variable substitution
		let result = this.substituteVariables(bodyTemplate, variables);

		// conditionally remove empty headings
		if (!this.plugin.settings.keepEmptyHeadings) {
			result = this.removeEmptyHeadings(result, variables);
		}

		// clean up excessive blank lines
		result = result.replace(/\n{3,}/g, "\n\n").trim();

		// add delimiter at end
		result += `\n\n${CONTENT_DELIMITER}`;

		return result;
	}

	private getTemplateVariables(
		bookMetadata: BookMetadata,
	): Record<string, string> {
		const vars: Record<string, string> = {};

		// helper to format array fields (wikilinks already applied in TemplateDataBuilder)
		const formatArray = (arr: string[] | undefined): string => {
			if (!arr || arr.length === 0) return "";
			return arr.join(", ");
		};

		// helper to format number fields
		const formatNumber = (num: number | undefined): string => {
			return num !== undefined ? String(num) : "";
		};

		// book/edition split fields (strings)
		vars.bookTitle = bookMetadata.variables?.bookTitle || "";
		vars.editionTitle = bookMetadata.variables?.editionTitle || "";
		vars.bookCover = bookMetadata.variables?.bookCover || "";
		vars.editionCover = bookMetadata.variables?.editionCover || "";
		vars.bookReleaseDate = bookMetadata.variables?.bookReleaseDate || "";
		vars.editionReleaseDate = bookMetadata.variables?.editionReleaseDate || "";

		// authors (wikilinks already applied)
		vars.bookAuthors = formatArray(bookMetadata.variables?.bookAuthors);
		vars.editionAuthors = formatArray(bookMetadata.variables?.editionAuthors);

		// contributors (wikilinks already applied)
		vars.bookContributors = formatArray(
			bookMetadata.variables?.bookContributors,
		);
		vars.editionContributors = formatArray(
			bookMetadata.variables?.editionContributors,
		);

		// book only fields
		vars.description = bookMetadata.variables?.description || "";
		vars.url = bookMetadata.variables?.url || "";

		// series (wikilinks already applied)
		vars.series = formatArray(bookMetadata.variables?.series);

		// genres (wikilinks already applied)
		vars.genres = formatArray(bookMetadata.variables?.genres);

		// edition only fields
		vars.publisher = formatArray(bookMetadata.variables?.publisher);
		vars.isbn10 = bookMetadata.variables?.isbn10 || "";
		vars.isbn13 = bookMetadata.variables?.isbn13 || "";
		vars.bookId = formatNumber(bookMetadata.variables?.bookId);
		vars.editionId = formatNumber(bookMetadata.variables?.editionId);

		// user data fields
		vars.rating = formatNumber(bookMetadata.variables?.rating);
		vars.status = formatArray(bookMetadata.variables?.status);
		vars.review = bookMetadata.variables?.review || "";

		// quotes
		vars.quotes = this.formatQuotesSection(bookMetadata.variables?.quotes);

		// lists (wikilinks already applied)
		vars.lists = formatArray(bookMetadata.variables?.lists);

		// activity date fields
		vars.firstReadStart = bookMetadata.variables?.firstReadStart || "";
		vars.firstReadEnd = bookMetadata.variables?.firstReadEnd || "";
		vars.lastReadStart = bookMetadata.variables?.lastReadStart || "";
		vars.lastReadEnd = bookMetadata.variables?.lastReadEnd || "";
		vars.totalReads = formatNumber(bookMetadata.variables?.totalReads);
		vars.readYears = formatArray(
			bookMetadata.variables?.readYears?.map(String),
		);

		// apply wikilinks to fields for body template
		const wikilinkSettings = this.plugin.settings.wikilinkSettings;

		// authors
		if (wikilinkSettings.authors) {
			if (vars.bookAuthors) {
				vars.bookAuthors = WikilinkFormatter.formatAsWikilinks(
					vars.bookAuthors.split(", "),
					"authors",
				).join(", ");
			}
			if (vars.editionAuthors) {
				vars.editionAuthors = WikilinkFormatter.formatAsWikilinks(
					vars.editionAuthors.split(", "),
					"authors",
				).join(", ");
			}
		}

		// contributors
		if (wikilinkSettings.contributors) {
			if (vars.bookContributors) {
				vars.bookContributors = WikilinkFormatter.formatAsWikilinks(
					vars.bookContributors.split(", "),
					"contributors",
				).join(", ");
			}
			if (vars.editionContributors) {
				vars.editionContributors = WikilinkFormatter.formatAsWikilinks(
					vars.editionContributors.split(", "),
					"contributors",
				).join(", ");
			}
		}

		// series
		if (wikilinkSettings.series && vars.series) {
			vars.series = WikilinkFormatter.formatAsWikilinks(
				vars.series.split(", "),
				"series",
			).join(", ");
		}

		// publisher
		if (wikilinkSettings.publisher && vars.publisher) {
			vars.publisher = WikilinkFormatter.formatAsWikilinks(
				vars.publisher.split(", "),
				"publisher",
			).join(", ");
		}

		// genres
		if (wikilinkSettings.genres && vars.genres) {
			vars.genres = WikilinkFormatter.formatAsWikilinks(
				vars.genres.split(", "),
				"genres",
			).join(", ");
		}

		// lists
		if (wikilinkSettings.lists && vars.lists) {
			vars.lists = WikilinkFormatter.formatAsWikilinks(
				vars.lists.split(", "),
				"lists",
			).join(", ");
		}

		return vars;
	}

	private substituteVariables(
		template: string,
		variables: Record<string, string>,
	): string {
		let result = template;
		for (const [key, value] of Object.entries(variables)) {
			const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
			result = result.replace(regex, value);
		}
		return result;
	}

	private removeEmptyHeadings(
		content: string,
		variables: Record<string, string>,
	): string {
		// find empty variables
		const emptyVariables = new Set<string>();
		for (const [key, value] of Object.entries(variables)) {
			if (!value || value.trim() === "") {
				emptyVariables.add(`{{${key}}}`);
			}
		}

		// split into lines and filter headings
		const lines = content.split("\n");
		const processedLines: string[] = [];

		for (let i = 0; i < lines.length; i++) {
			const currentLine = lines[i];
			const trimmed = currentLine.trim();

			if (trimmed.startsWith("#")) {
				// check if heading should be kept
				if (this.shouldKeepHeading(lines, i, emptyVariables)) {
					processedLines.push(currentLine);
				}
			} else {
				processedLines.push(currentLine);
			}
		}

		return processedLines.join("\n");
	}

	private shouldKeepHeading(
		lines: string[],
		headingIndex: number,
		emptyVariables: Set<string>,
	): boolean {
		// look for next non-empty line
		for (let j = headingIndex + 1; j < lines.length; j++) {
			const nextLine = lines[j].trim();

			// skip empty lines
			if (nextLine === "") continue;

			// if next line is another heading, no content after this heading
			if (nextLine.startsWith("#")) {
				return false;
			}

			// check if this line contains only an empty variable
			const variableMatch = nextLine.match(/^\{\{(\w+)\}\}$/);
			if (variableMatch && emptyVariables.has(nextLine)) {
				return false;
			}

			// found actual content
			return true;
		}

		// reached end of template with no content
		return false;
	}

	private formatQuotesSection(quotes?: string[]): string {
		if (!quotes || quotes.length === 0) return "";

		const format = this.plugin.settings.quotesFormat;

		if (format === "callout") {
			return quotes.map((q) => `> [!quote]\n> ${q}`).join("\n\n");
		} else {
			// blockquote format
			return quotes.map((q) => `> ${q}`).join("\n\n");
		}
	}

	private extractBodyFromTemplate(template: string): string {
		// remove YAML frontmatter block
		const withoutYaml = template.replace(/^---\n[\s\S]*?\n---\n\n?/, "");
		return withoutYaml;
	}
}
