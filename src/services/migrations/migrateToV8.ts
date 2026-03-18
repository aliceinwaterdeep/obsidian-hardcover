import { PluginSettings } from "src/types";
import { DEFAULT_SETTINGS } from "src/config/defaultSettings";
import { LegacySettings } from "src/types/migrations";

export function migrateToV8(settings: LegacySettings): PluginSettings {
	if (!("statusFilter" in settings)) {
		(settings as any).statusFilter = DEFAULT_SETTINGS.statusFilter;
	}

	return settings as PluginSettings;
}
