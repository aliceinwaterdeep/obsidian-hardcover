import { PluginSettings } from "src/types";
import { LegacySettings } from "src/types/migrations";

export function migrateToV12(settings: LegacySettings): PluginSettings {
	if (IS_DEV) {
		console.debug("Migrating to v12: Template system overhaul");
	}

	// initialize frontmatterFields if it doesn't exist
	if (!settings.frontmatterFields) {
		settings.frontmatterFields = {};
	}

	// etep 1: extract wikilink settings from old field configs
	// in v11, the property was called fieldsSettings
	const oldFields = settings.fieldsSettings || settings.frontmatterFields;

	settings.wikilinkSettings = {
		authors: oldFields.authors?.wikilinks || false,
		contributors: oldFields.contributors?.wikilinks || false,
		series: oldFields.series?.wikilinks || false,
		publisher: oldFields.publisher?.wikilinks || false,
		genres: oldFields.genres?.wikilinks || false,
		lists: oldFields.lists?.wikilinks || false,
	};

	// step 2: extract quotes format
	settings.quotesFormat =
		(oldFields.quotes?.format as "blockquote" | "callout") || "blockquote";

	// step 3: get old data source preferences (or use edition as default)
	const oldPrefs = settings.dataSourcePreferences || {
		titleSource: "edition",
		coverSource: "edition",
		releaseDateSource: "edition",
		authorsSource: "edition",
		contributorsSource: "edition",
	};

	// step 4: Split book/edition fields based on source preferences
	// for each pair, enable the selected source with user's custom property name
	// and disable the other source with default property name

	// title
	if (oldPrefs.titleSource === "book") {
		settings.frontmatterFields.bookTitle = {
			enabled: oldFields.title?.enabled || false,
			propertyName: oldFields.title?.propertyName || "title",
		};
		settings.frontmatterFields.editionTitle = {
			enabled: false,
			propertyName: "editionTitle",
		};
	} else {
		settings.frontmatterFields.bookTitle = {
			enabled: false,
			propertyName: "bookTitle",
		};
		settings.frontmatterFields.editionTitle = {
			enabled: oldFields.title?.enabled || false,
			propertyName: oldFields.title?.propertyName || "title",
		};
	}

	// cover
	if (oldPrefs.coverSource === "book") {
		settings.frontmatterFields.bookCover = {
			enabled: oldFields.cover?.enabled || false,
			propertyName: oldFields.cover?.propertyName || "cover",
		};
		settings.frontmatterFields.editionCover = {
			enabled: false,
			propertyName: "editionCover",
		};
	} else {
		settings.frontmatterFields.bookCover = {
			enabled: false,
			propertyName: "bookCover",
		};
		settings.frontmatterFields.editionCover = {
			enabled: oldFields.cover?.enabled || false,
			propertyName: oldFields.cover?.propertyName || "cover",
		};
	}

	// release date
	if (oldPrefs.releaseDateSource === "book") {
		settings.frontmatterFields.bookReleaseDate = {
			enabled: oldFields.releaseDate?.enabled || false,
			propertyName: oldFields.releaseDate?.propertyName || "releaseDate",
		};
		settings.frontmatterFields.editionReleaseDate = {
			enabled: false,
			propertyName: "editionReleaseDate",
		};
	} else {
		settings.frontmatterFields.bookReleaseDate = {
			enabled: false,
			propertyName: "bookReleaseDate",
		};
		settings.frontmatterFields.editionReleaseDate = {
			enabled: oldFields.releaseDate?.enabled || false,
			propertyName: oldFields.releaseDate?.propertyName || "releaseDate",
		};
	}

	// authors
	if (oldPrefs.authorsSource === "book") {
		settings.frontmatterFields.bookAuthors = {
			enabled: oldFields.authors?.enabled || false,
			propertyName: oldFields.authors?.propertyName || "authors",
		};
		settings.frontmatterFields.editionAuthors = {
			enabled: false,
			propertyName: "editionAuthors",
		};
	} else {
		settings.frontmatterFields.bookAuthors = {
			enabled: false,
			propertyName: "bookAuthors",
		};
		settings.frontmatterFields.editionAuthors = {
			enabled: oldFields.authors?.enabled || false,
			propertyName: oldFields.authors?.propertyName || "authors",
		};
	}

	// contributors
	if (oldPrefs.contributorsSource === "book") {
		settings.frontmatterFields.bookContributors = {
			enabled: oldFields.contributors?.enabled || false,
			propertyName: oldFields.contributors?.propertyName || "contributors",
		};
		settings.frontmatterFields.editionContributors = {
			enabled: false,
			propertyName: "editionContributors",
		};
	} else {
		settings.frontmatterFields.bookContributors = {
			enabled: false,
			propertyName: "bookContributors",
		};
		settings.frontmatterFields.editionContributors = {
			enabled: oldFields.contributors?.enabled || false,
			propertyName: oldFields.contributors?.propertyName || "contributors",
		};
	}

	// step 5: copy all non split fields from fieldsSettings to frontmatterFields
	const nonSplitFields = [
		"rating",
		"status",
		"description",
		"series",
		"genres",
		"publisher",
		"url",
		"isbn10",
		"isbn13",
		"firstRead",
		"lastRead",
		"totalReads",
		"readYears",
		"lists",
	];

	for (const fieldKey of nonSplitFields) {
		if (oldFields[fieldKey]) {
			settings.frontmatterFields[fieldKey] = {
				...oldFields[fieldKey],
			};
		}
	}

	// step 6: build body template from current enabled fields
	let template = "";

	// title, use the selected source
	const titleVar =
		oldPrefs.titleSource === "book" ? "{{bookTitle}}" : "{{editionTitle}}";
	template += `# ${titleVar}\n\n`;

	// cover
	if (oldFields.cover?.enabled) {
		const coverVar =
			oldPrefs.coverSource === "book" ? "{{bookCover}}" : "{{editionCover}}";
		template += `![${titleVar} Cover|300](${coverVar})\n\n`;
	}

	// description
	if (oldFields.description?.enabled) {
		const heading = oldFields.description?.bodyHeading || "";
		if (heading) {
			template += `${heading}\n`;
		}
		template += `{{description}}\n\n`;
	}

	// review
	if (oldFields.review?.enabled) {
		let heading = oldFields.review?.bodyHeading || "## Review";
		// ensure heading has ## prefix
		if (heading && !heading.trim().startsWith("#")) {
			heading = "## " + heading;
		}
		template += `${heading}\n{{review}}\n\n`;
	}

	// quotes
	if (oldFields.quotes?.enabled) {
		let heading = oldFields.quotes?.bodyHeading || "## Quotes";
		// ensure heading has ## prefix
		if (heading && !heading.trim().startsWith("#")) {
			heading = "## " + heading;
		}
		template += `${heading}\n{{quotes}}\n\n`;
	}

	settings.bodyTemplate = template.trim();

	// step 7: migrate filename template syntax from ${} to {{}}
	let newFilenameTemplate = settings.filenameTemplate || "{{editionTitle}}";

	if (oldPrefs.titleSource === "book") {
		newFilenameTemplate = newFilenameTemplate.replace(
			/\$\{title\}/g,
			"{{bookTitle}}",
		);
	} else {
		newFilenameTemplate = newFilenameTemplate.replace(
			/\$\{title\}/g,
			"{{editionTitle}}",
		);
	}

	if (oldPrefs.authorsSource === "book") {
		newFilenameTemplate = newFilenameTemplate.replace(
			/\$\{authors\}/g,
			"{{bookAuthors}}",
		);
	} else {
		newFilenameTemplate = newFilenameTemplate.replace(
			/\$\{authors\}/g,
			"{{editionAuthors}}",
		);
	}

	if (oldPrefs.releaseDateSource === "book") {
		newFilenameTemplate = newFilenameTemplate.replace(
			/\$\{year\}/g,
			"{{bookYear}}",
		);
	} else {
		newFilenameTemplate = newFilenameTemplate.replace(
			/\$\{year\}/g,
			"{{editionYear}}",
		);
	}

	settings.filenameTemplate = newFilenameTemplate;

	// step 8: clean up obsolete properties
	// remove old combined field configs
	delete settings.frontmatterFields.title;
	delete settings.frontmatterFields.cover;
	delete settings.frontmatterFields.releaseDate;
	delete settings.frontmatterFields.authors;
	delete settings.frontmatterFields.contributors;
	delete settings.fieldsSettings;

	if (!settings.frontmatterFields) {
		settings.frontmatterFields = {};
	}

	// remove wikilinks from all remaining field configs
	const allFieldKeys = Object.keys(settings.frontmatterFields);
	for (const key of allFieldKeys) {
		const field = settings.frontmatterFields[key];
		if (field && typeof field === "object") {
			delete field.wikilinks;
			delete field.bodyHeading;
		}
	}

	// remove format from quotes if it exists
	if (oldFields.quotes) {
		delete oldFields.quotes.format;
	}

	// remove dataSourcePreferences
	delete settings.dataSourcePreferences;

	return settings as PluginSettings;
}
