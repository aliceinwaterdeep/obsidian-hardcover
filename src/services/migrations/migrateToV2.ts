import { PluginSettings } from "src/types";
import { LegacySettings } from "src/types/migrations";

export function migrateToV2(settings: LegacySettings): PluginSettings {
	const wikilinkFields = [
		"authors",
		"contributors",
		"series",
		"publisher",
		"genres",
	] as const;

	if (!settings.frontmatterFields) {
		return settings as PluginSettings;
	}

	for (const fieldKey of wikilinkFields) {
		const fieldConfig = (settings.frontmatterFields as any)[fieldKey];
		if (fieldConfig && !("wikilinks" in fieldConfig)) {
			(fieldConfig as any).wikilinks = false;
		}
	}

	return settings as PluginSettings;
}
