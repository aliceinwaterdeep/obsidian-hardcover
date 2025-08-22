import { PluginSettings } from "src/types";
import { DEFAULT_SETTINGS } from "src/config/defaultSettings";

export class SettingsMigrationService {
	static migrateSettings(settings: PluginSettings): PluginSettings {
		const currentVersion = settings.settingsVersion || 0;

		if (IS_DEV) {
			console.log(
				`Migrating settings from version ${currentVersion} to ${DEFAULT_SETTINGS.settingsVersion}`
			);
		}

		// apply migrations in sequence
		if (currentVersion < 1) {
			settings = this.migrateToV1(settings);
		}

		// update version number
		settings.settingsVersion = DEFAULT_SETTINGS.settingsVersion;
		return settings;
	}

	private static migrateToV1(settings: PluginSettings): PluginSettings {
		// no real data migration needed for initial version
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
