import { PluginSettings } from "src/types";
import { LegacySettings } from "src/types/migrations";

export function migrateToV3(settings: LegacySettings): PluginSettings {
	if (!("grouping" in settings)) {
		settings.grouping = {
			enabled: false,
			groupBy: "author",
		};
	}

	return settings as PluginSettings;
}
