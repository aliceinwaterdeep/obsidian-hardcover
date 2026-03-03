import { PluginSettings } from "src/types";
import { DEFAULT_SETTINGS } from "src/config/defaultSettings";

export function migrateToV8(settings: PluginSettings): PluginSettings {
	if (!("statusFilter" in settings)) {
		(settings as any).statusFilter = DEFAULT_SETTINGS.statusFilter;
	}

	return settings;
}
