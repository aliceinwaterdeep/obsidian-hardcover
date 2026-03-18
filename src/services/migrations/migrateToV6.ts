import { PluginSettings } from "src/types";
import { LegacySettings } from "src/types/migrations";

export function migrateToV6(settings: LegacySettings): PluginSettings {
	if (!settings.grouping) {
		settings.grouping = {};
	}

	if (!("noAuthorBehavior" in settings.grouping)) {
		(settings.grouping as any).noAuthorBehavior = "useFallbackPriority";
	}

	if (!("fallbackFolderName" in settings.grouping)) {
		(settings.grouping as any).fallbackFolderName = "Various";
	}

	if (!("multipleAuthorsBehavior" in settings.grouping)) {
		(settings.grouping as any).multipleAuthorsBehavior = "useFirst";
	}

	if (!("collectionsFolderName" in settings.grouping)) {
		(settings.grouping as any).collectionsFolderName = "Collections";
	}

	return settings as PluginSettings;
}
