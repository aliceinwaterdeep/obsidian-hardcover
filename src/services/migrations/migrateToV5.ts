import { PluginSettings } from "src/types";
import { LegacySettings } from "src/types/migrations";

export function migrateToV5(settings: LegacySettings): PluginSettings {
	if (!settings.grouping) {
		settings.grouping = {};
	}

	if (!("authorFormat" in settings.grouping)) {
		settings.grouping.authorFormat = "firstLast";
	}

	if (!settings.frontmatterFields) {
		settings.frontmatterFields = {};
	}

	if (!settings.frontmatterFields.isbn10) {
		settings.frontmatterFields.isbn10 = {
			enabled: false,
			propertyName: "isbn10",
		};
	}

	if (!settings.frontmatterFields.isbn13) {
		settings.frontmatterFields.isbn13 = {
			enabled: false,
			propertyName: "isbn13",
		};
	}

	return settings as PluginSettings;
}
