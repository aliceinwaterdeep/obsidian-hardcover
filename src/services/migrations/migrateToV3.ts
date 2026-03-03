import { PluginSettings } from "src/types";

export function migrateToV3(settings: PluginSettings): PluginSettings {
	if (!("grouping" in settings)) {
		(settings as any).grouping = {
			enabled: false,
			groupBy: "author",
		};
	}

	return settings;
}
