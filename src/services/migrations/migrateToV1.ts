import { PluginSettings } from "src/types";

export function migrateToV1(settings: PluginSettings): PluginSettings {
	// no real data migration needed for initial version
	return settings;
}
