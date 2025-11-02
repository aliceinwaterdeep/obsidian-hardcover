import { PluginSettings } from "src/types";
import { DEFAULT_SETTINGS } from "src/config/defaultSettings";

export class SettingsMigrationService {
	static migrateSettings(settings: PluginSettings): PluginSettings {
		const currentVersion = settings.settingsVersion || 0;

		if (IS_DEV) {
			// console.log(
			// 	`Migrating settings from version ${currentVersion} to ${DEFAULT_SETTINGS.settingsVersion}`
			// );
		}

		// apply migrations in sequence
		if (currentVersion < 1) {
			settings = this.migrateToV1(settings);
		}

		if (currentVersion < 2) {
			settings = this.migrateToV2(settings);
		}

		if (currentVersion < 3) {
			settings = this.migrateToV3(settings);
		}

		if (currentVersion < 4) {
			settings = this.migrateToV4(settings);
		}

		if (currentVersion < 5) {
			settings = this.migrateToV5(settings);
		}

		// update version number
		settings.settingsVersion = DEFAULT_SETTINGS.settingsVersion;
		return settings;
	}

	private static migrateToV1(settings: PluginSettings): PluginSettings {
		// no real data migration needed for initial version
		return settings;
	}

	private static migrateToV2(settings: PluginSettings): PluginSettings {
		const wikilinkFields = [
			"authors",
			"contributors",
			"series",
			"publisher",
			"genres",
		] as const;

		if (!settings.fieldsSettings) {
			return settings;
		}

		for (const fieldKey of wikilinkFields) {
			const fieldConfig = settings.fieldsSettings[fieldKey];
			if (fieldConfig && !("wikilinks" in fieldConfig)) {
				(fieldConfig as any).wikilinks = false;
			}
		}

		return settings;
	}

	private static migrateToV3(settings: PluginSettings): PluginSettings {
		if (!("grouping" in settings)) {
			(settings as any).grouping = {
				enabled: false,
				groupBy: "author",
			};
		}

		return settings;
	}

	private static migrateToV4(settings: PluginSettings): PluginSettings {
		if (!settings.fieldsSettings.lists) {
			(settings.fieldsSettings as any).lists = {
				enabled: false,
				propertyName: "lists",
				wikilinks: false,
			};
		}

		return settings;
	}

	private static migrateToV5(settings: PluginSettings): PluginSettings {
		if (!("authorFormat" in settings.grouping)) {
			(settings.grouping as any).authorFormat = "firstLast";
		}

		return settings;
	}

	/**
	 * Example function for future migrations
	 * Can be used as a template when adding version 2
	 */
	/* 
  private static migrateToV2(settings: PluginSettings): PluginSettings {
    // Example: Add a new field with a default value
    if (!('newSetting' in settings)) {
      settings.newSetting = DEFAULT_SETTINGS.newSetting;
    }
    
    // Example: Rename a field
    if ('oldFieldName' in settings) {
      settings.newFieldName = settings.oldFieldName;
      delete settings.oldFieldName;
    }
    
    return settings;
  }
  */
}
