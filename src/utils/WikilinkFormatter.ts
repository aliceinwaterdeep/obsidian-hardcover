export class WikilinkFormatter {
	static formatAsWikilinks(values: string[], fieldType: string): string[] {
		return values.map((value) => {
			// extract base name for contributors and series
			if (fieldType === "contributors") {
				const match = value.match(/^(.+?)\s*\((.+)\)$/);
				if (match) {
					return `[[${match[1].trim()}|${value}]]`;
				}
			} else if (fieldType === "series") {
				const match = value.match(/^(.+?)\s*#(\d+)$/);
				if (match) {
					return `[[${match[1].trim()}|${value}]]`;
				}
			}

			return `[[${value}]]`;
		});
	}

	static applyWikilinksIfNeeded(
		value: any,
		fieldName: string,
		settings: any,
	): any {
		if (!value) return value;

		// determine if this field should have wikilinks
		const shouldApplyWikilinks = this.shouldApplyWikilinks(
			fieldName,
			settings.wikilinkSettings,
		);

		if (!shouldApplyWikilinks) return value;

		// handle arrays
		if (Array.isArray(value)) {
			const fieldType = this.getFieldType(fieldName);
			return this.formatAsWikilinks(value, fieldType);
		}

		// handle single publisher value
		if (fieldName === "publisher") {
			return `[[${value}]]`;
		}

		return value;
	}

	private static shouldApplyWikilinks(
		fieldName: string,
		wikilinkSettings: any,
	): boolean {
		if (fieldName === "bookAuthors" || fieldName === "editionAuthors") {
			return wikilinkSettings.authors;
		}
		if (
			fieldName === "bookContributors" ||
			fieldName === "editionContributors"
		) {
			return wikilinkSettings.contributors;
		}
		if (fieldName === "series") {
			return wikilinkSettings.series;
		}
		if (fieldName === "publisher") {
			return wikilinkSettings.publisher;
		}
		if (fieldName === "genres") {
			return wikilinkSettings.genres;
		}
		if (fieldName === "lists") {
			return wikilinkSettings.lists;
		}
		return false;
	}

	private static getFieldType(fieldName: string): string {
		if (
			fieldName === "bookContributors" ||
			fieldName === "editionContributors"
		) {
			return "contributors";
		}
		if (fieldName === "series") {
			return "series";
		}
		// default for authors, genres, lists
		return "authors";
	}
}
