import { PluginSettings } from "src/types";

export function migrateToV5(settings: PluginSettings): PluginSettings {
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
