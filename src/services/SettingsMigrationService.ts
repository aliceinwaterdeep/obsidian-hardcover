import { PluginSettings } from "src/types";
import { DEFAULT_SETTINGS } from "src/config/defaultSettings";
import { App } from "obsidian";

export class SettingsMigrationService {
	static migrateSettings(settings: PluginSettings, app?: App): PluginSettings {
		const currentVersion = settings.settingsVersion || 0;

		if (IS_DEV) {
			console.debug(
				`Migrating settings from version ${currentVersion} to ${DEFAULT_SETTINGS.settingsVersion}`,
			);
		}

		// apply migrations in sequence
		if (currentVersion < 1) {
			settings = this.migrateToV1(settings);
		}

		if (currentVersion < 2) {
			settings = this.migrateToV2(settings);
		}

		if (currentVersion < 3) {
			settings = this.migrateToV3(settings);
		}

		if (currentVersion < 4) {
			settings = this.migrateToV4(settings);
		}

		if (currentVersion < 5) {
			settings = this.migrateToV5(settings);
		}

		if (currentVersion < 6) {
			settings = this.migrateToV6(settings);
		}

		if (currentVersion < 7) {
			settings = this.migrateToV7(settings);
		}

		if (currentVersion < 8) {
			settings = this.migrateToV8(settings);
		}

		if (currentVersion < 9) {
			settings = this.migrateToV9(settings);
		}

		if (currentVersion < 10) {
			settings = this.migrateToV10(settings);
		}

		if (currentVersion < 11) {
			settings = this.migrateToV11(settings, app);
		}

		if (currentVersion < 12) {
			settings = this.migrateToV12(settings);
		}

		// update version number
		settings.settingsVersion = DEFAULT_SETTINGS.settingsVersion;
		return settings;
	}

	private static migrateToV1(settings: PluginSettings): PluginSettings {
		// no real data migration needed for initial version
		return settings;
	}

	private static migrateToV2(settings: PluginSettings): PluginSettings {
		const wikilinkFields = [
			"authors",
			"contributors",
			"series",
			"publisher",
			"genres",
		] as const;

		if (!settings.frontmatterFields) {
			return settings;
		}

		for (const fieldKey of wikilinkFields) {
			const fieldConfig = settings.frontmatterFields[fieldKey];
			if (fieldConfig && !("wikilinks" in fieldConfig)) {
				(fieldConfig as any).wikilinks = false;
			}
		}

		return settings;
	}

	private static migrateToV3(settings: PluginSettings): PluginSettings {
		if (!("grouping" in settings)) {
			(settings as any).grouping = {
				enabled: false,
				groupBy: "author",
			};
		}

		return settings;
	}

	private static migrateToV4(settings: PluginSettings): PluginSettings {
		if (!settings.frontmatterFields.lists) {
			(settings.frontmatterFields as any).lists = {
				enabled: false,
				propertyName: "lists",
				wikilinks: false,
			};
		}

		return settings;
	}

	private static migrateToV5(settings: PluginSettings): PluginSettings {
		if (!("authorFormat" in settings.grouping)) {
			(settings.grouping as any).authorFormat = "firstLast";
		}

		if (!settings.frontmatterFields.isbn10) {
			(settings.frontmatterFields as any).isbn10 = {
				enabled: false,
				propertyName: "isbn10",
			};
		}

		if (!settings.frontmatterFields.isbn13) {
			(settings.frontmatterFields as any).isbn13 = {
				enabled: false,
				propertyName: "isbn13",
			};
		}

		return settings;
	}

	private static migrateToV6(settings: PluginSettings): PluginSettings {
		if (!("noAuthorBehavior" in settings.grouping)) {
			(settings.grouping as any).noAuthorBehavior = "useFallbackPriority";
		}

		if (!("fallbackFolderName" in settings.grouping)) {
			(settings.grouping as any).fallbackFolderName = "Various";
		}

		if (!("multipleAuthorsBehavior" in settings.grouping)) {
			(settings.grouping as any).multipleAuthorsBehavior = "useFirst";
		}

		if (!("collectionsFolderName" in settings.grouping)) {
			(settings.grouping as any).collectionsFolderName = "Collections";
		}

		return settings;
	}

	private static migrateToV7(settings: PluginSettings): PluginSettings {
		if (!("preserveCustomFrontmatter" in settings)) {
			(settings as any).preserveCustomFrontmatter =
				DEFAULT_SETTINGS.preserveCustomFrontmatter;
		}

		return settings;
	}

	private static migrateToV8(settings: PluginSettings): PluginSettings {
		if (!("statusFilter" in settings)) {
			(settings as any).statusFilter = DEFAULT_SETTINGS.statusFilter;
		}

		return settings;
	}

	private static migrateToV9(settings: PluginSettings): PluginSettings {
		if (!("autoOrganizeFolders" in settings.grouping)) {
			(settings.grouping as any).autoOrganizeFolders = true;
		}

		return settings;
	}

	private static migrateToV10(settings: PluginSettings): PluginSettings {
		if (!settings.frontmatterFields.quotes) {
			(settings.frontmatterFields as any).quotes = {
				enabled: false,
				propertyName: "quotes",
				format: "blockquote",
				bodyHeading: "Quotes",
			};
		}

		if (!("bodyHeading" in settings.frontmatterFields.review)) {
			(settings.frontmatterFields.review as any).bodyHeading = "Review";
		}

		return settings;
	}

	private static migrateToV11(
		settings: PluginSettings,
		app?: App,
	): PluginSettings {
		if (!app) {
			return settings;
		}

		const apiKey = settings.apiKey?.trim();
		if (!apiKey) {
			return settings;
		}

		const existingSecret = app.secretStorage.getSecret(apiKey);
		if (existingSecret !== null) {
			return settings;
		}

		const secretName = "hardcover-api-key";
		app.secretStorage.setSecret(secretName, apiKey);
		settings.apiKey = secretName;

		if (IS_DEV) {
			console.debug("Migrated API key to SecretStorage");
		}

		return settings;
	}

	private static migrateToV12(settings: PluginSettings): PluginSettings {
		if (IS_DEV) {
			console.debug("Migrating to v12: Template system overhaul");
		}

		// etep 1: extract wikilink settings from old field configs
		const oldFields = settings.frontmatterFields as any;
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

		// step 5: build body template from current enabled fields
		let template = "";

		// title, use the selected source
		const titleVar =
			oldPrefs.titleSource === "book" ? "{{bookTitle}}" : "{{editionTitle}}";
		template += `# ${titleVar}\n`;

		// cover
		if (oldFields.cover?.enabled) {
			const coverVar =
				oldPrefs.coverSource === "book" ? "{{bookCover}}" : "{{editionCover}}";
			template += `![${titleVar} Cover|300](${coverVar}})\n\n`;
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
			const heading = oldFields.review?.bodyHeading || "## Review";
			template += `${heading}\n{{review}}\n\n`;
		}

		// quotes
		if (oldFields.quotes?.enabled) {
			const heading = oldFields.quotes?.bodyHeading || "## Quotes";
			template += `${heading}\n{{quotes}}\n\n`;
		}

		settings.bodyTemplate = template.trim();

		// step 6: clean up obsolete properties
		// remove old combined field configs
		delete (settings.frontmatterFields as any).title;
		delete (settings.frontmatterFields as any).cover;
		delete (settings.frontmatterFields as any).releaseDate;
		delete (settings.frontmatterFields as any).authors;
		delete (settings.frontmatterFields as any).contributors;

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
}
