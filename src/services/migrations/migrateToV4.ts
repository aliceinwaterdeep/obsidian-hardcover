import { PluginSettings } from "src/types";

export function migrateToV4(settings: PluginSettings): PluginSettings {
	if (!settings.frontmatterFields.lists) {
		(settings.frontmatterFields as any).lists = {
			enabled: false,
			propertyName: "lists",
			wikilinks: false,
		};
	}

	return settings;
}
