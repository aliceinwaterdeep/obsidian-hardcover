import { PluginSettings } from "src/types";
import { DEFAULT_SETTINGS } from "src/config/defaultSettings";

export function migrateToV7(settings: PluginSettings): PluginSettings {
	if (!("preserveCustomFrontmatter" in settings)) {
		(settings as any).preserveCustomFrontmatter =
			DEFAULT_SETTINGS.preserveCustomFrontmatter;
	}

	return settings;
}
