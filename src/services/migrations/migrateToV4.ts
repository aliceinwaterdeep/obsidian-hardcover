import { PluginSettings } from "src/types";
import { LegacySettings } from "src/types/migrations";

export function migrateToV4(settings: LegacySettings): PluginSettings {
	if (!settings.frontmatterFields) {
		settings.frontmatterFields = {};
	}

	if (!settings.frontmatterFields.lists) {
		(settings.frontmatterFields as any).lists = {
			enabled: false,
			propertyName: "lists",
			wikilinks: false,
		};
	}

	return settings as PluginSettings;
}
