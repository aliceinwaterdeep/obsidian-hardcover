import { PluginSettings } from "src/types";

export function migrateToV9(settings: PluginSettings): PluginSettings {
	if (!("autoOrganizeFolders" in settings.grouping)) {
		(settings.grouping as any).autoOrganizeFolders = true;
	}

	return settings;
}
