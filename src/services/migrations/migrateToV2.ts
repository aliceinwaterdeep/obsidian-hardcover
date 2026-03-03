import { PluginSettings } from "src/types";

export function migrateToV2(settings: PluginSettings): PluginSettings {
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
