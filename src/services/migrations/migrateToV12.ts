import { PluginSettings } from "src/types";

export function migrateToV12(settings: PluginSettings): PluginSettings {
	if (IS_DEV) {
		console.debug("Migrating to v12: Template system overhaul");
	}

	// etep 1: extract wikilink settings from old field configs
	// in v11, the property was called fieldsSettings
	// we need to cast to any to access the old property name
	const oldFields =
		(settings as any).fieldsSettings || settings.frontmatterFields;

	settings.wikilinkSettings = {
		authors: oldFields.authors?.wikilinks || false,
		contributors: oldFields.contributors?.wikilinks || false,
		series: oldFields.series?.wikilinks || false,
		publisher: oldFields.publisher?.wikilinks || false,
		genres: oldFields.genres?.wikilinks || false,
		lists: oldFields.lists?.wikilinks || false,
	};

	// step 2: extract quotes format
	settings.quotesFormat = oldFields.quotes?.format || "blockquote";

	// step 3: get old data source preferences (or use edition as default)
	const oldPrefs = (settings as any).dataSourcePreferences || {
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
		(settings.frontmatterFields as any).bookTitle = {
			enabled: oldFields.title?.enabled || false,
			propertyName: oldFields.title?.propertyName || "title",
		};
		(settings.frontmatterFields as any).editionTitle = {
			enabled: false,
			propertyName: "editionTitle",
		};
	} else {
		(settings.frontmatterFields as any).bookTitle = {
			enabled: false,
			propertyName: "bookTitle",
		};
		(settings.frontmatterFields as any).editionTitle = {
			enabled: oldFields.title?.enabled || false,
			propertyName: oldFields.title?.propertyName || "title",
		};
	}

	// cover
	if (oldPrefs.coverSource === "book") {
		(settings.frontmatterFields as any).bookCover = {
			enabled: oldFields.cover?.enabled || false,
			propertyName: oldFields.cover?.propertyName || "cover",
		};
		(settings.frontmatterFields as any).editionCover = {
			enabled: false,
			propertyName: "editionCover",
		};
	} else {
		(settings.frontmatterFields as any).bookCover = {
			enabled: false,
			propertyName: "bookCover",
		};
		(settings.frontmatterFields as any).editionCover = {
			enabled: oldFields.cover?.enabled || false,
			propertyName: oldFields.cover?.propertyName || "cover",
		};
	}

	// release date
	if (oldPrefs.releaseDateSource === "book") {
		(settings.frontmatterFields as any).bookReleaseDate = {
			enabled: oldFields.releaseDate?.enabled || false,
			propertyName: oldFields.releaseDate?.propertyName || "releaseDate",
		};
		(settings.frontmatterFields as any).editionReleaseDate = {
			enabled: false,
			propertyName: "editionReleaseDate",
		};
	} else {
		(settings.frontmatterFields as any).bookReleaseDate = {
			enabled: false,
			propertyName: "bookReleaseDate",
		};
		(settings.frontmatterFields as any).editionReleaseDate = {
			enabled: oldFields.releaseDate?.enabled || false,
			propertyName: oldFields.releaseDate?.propertyName || "releaseDate",
		};
	}

	// authors
	if (oldPrefs.authorsSource === "book") {
		(settings.frontmatterFields as any).bookAuthors = {
			enabled: oldFields.authors?.enabled || false,
			propertyName: oldFields.authors?.propertyName || "authors",
		};
		(settings.frontmatterFields as any).editionAuthors = {
			enabled: false,
			propertyName: "editionAuthors",
		};
	} else {
		(settings.frontmatterFields as any).bookAuthors = {
			enabled: false,
			propertyName: "bookAuthors",
		};
		(settings.frontmatterFields as any).editionAuthors = {
			enabled: oldFields.authors?.enabled || false,
			propertyName: oldFields.authors?.propertyName || "authors",
		};
	}

	// contributors
	if (oldPrefs.contributorsSource === "book") {
		(settings.frontmatterFields as any).bookContributors = {
			enabled: oldFields.contributors?.enabled || false,
			propertyName: oldFields.contributors?.propertyName || "contributors",
		};
		(settings.frontmatterFields as any).editionContributors = {
			enabled: false,
			propertyName: "editionContributors",
		};
	} else {
		(settings.frontmatterFields as any).bookContributors = {
			enabled: false,
			propertyName: "bookContributors",
		};
		(settings.frontmatterFields as any).editionContributors = {
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
			(settings.frontmatterFields as any)[fieldKey] = {
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
	delete (settings.frontmatterFields as any).title;
	delete (settings.frontmatterFields as any).cover;
	delete (settings.frontmatterFields as any).releaseDate;
	delete (settings.frontmatterFields as any).authors;
	delete (settings.frontmatterFields as any).contributors;
	delete (settings as any).fieldsSettings;

	// remove wikilinks from all remaining field configs
	const allFieldKeys = Object.keys(settings.frontmatterFields);
	for (const key of allFieldKeys) {
		const field = (settings.frontmatterFields as any)[key];
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
	delete (settings as any).dataSourcePreferences;

	return settings;
}
