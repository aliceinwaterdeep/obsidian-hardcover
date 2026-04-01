import { PluginSettings } from "src/types";
import { LegacySettings } from "src/types/migrations";

export function migrateToV1(settings: LegacySettings): PluginSettings {
	// no real data migration needed for initial version
	return settings as PluginSettings;
}
