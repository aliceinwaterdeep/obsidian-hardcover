import { PluginSettings } from "src/types";
import { LegacySettings } from "src/types/migrations";

export function migrateToV9(settings: LegacySettings): PluginSettings {
	if (!settings.grouping) {
		settings.grouping = {};
	}

	if (!("autoOrganizeFolders" in settings.grouping)) {
		settings.grouping.autoOrganizeFolders = true;
	}

	return settings as PluginSettings;
}
