import { PluginSettings } from "src/types";
import { DEFAULT_SETTINGS } from "src/config/defaultSettings";
import { LegacySettings } from "src/types/migrations";

export function migrateToV7(settings: LegacySettings): PluginSettings {
	if (!("preserveCustomFrontmatter" in settings)) {
		settings.preserveCustomFrontmatter =
			DEFAULT_SETTINGS.preserveCustomFrontmatter;
	}

	return settings as PluginSettings;
}
