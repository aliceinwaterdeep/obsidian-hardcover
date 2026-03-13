import { PluginSettings } from "src/types";
import { DEFAULT_SETTINGS } from "src/config/defaultSettings";
import { App } from "obsidian";
import { migrateToV1 } from "./migrateToV1";
import { migrateToV2 } from "./migrateToV2";
import { migrateToV3 } from "./migrateToV3";
import { migrateToV4 } from "./migrateToV4";
import { migrateToV5 } from "./migrateToV5";
import { migrateToV6 } from "./migrateToV6";
import { migrateToV7 } from "./migrateToV7";
import { migrateToV8 } from "./migrateToV8";
import { migrateToV9 } from "./migrateToV9";
import { migrateToV10 } from "./migrateToV10";
import { migrateToV11 } from "./migrateToV11";
import { migrateToV12 } from "./migrateToV12";
import { migrateToV13 } from "./migrateToV13";

export class SettingsMigrationService {
	static migrateSettings(settings: PluginSettings, app?: App): PluginSettings {
		const currentVersion = settings.settingsVersion || 0;

		if (IS_DEV) {
			console.debug(
				`Migrating settings from version ${currentVersion} to ${DEFAULT_SETTINGS.settingsVersion}`,
			);
		}

		// apply migrations in sequence
		if (currentVersion < 1) {
			settings = migrateToV1(settings);
		}

		if (currentVersion < 2) {
			settings = migrateToV2(settings);
		}

		if (currentVersion < 3) {
			settings = migrateToV3(settings);
		}

		if (currentVersion < 4) {
			settings = migrateToV4(settings);
		}

		if (currentVersion < 5) {
			settings = migrateToV5(settings);
		}

		if (currentVersion < 6) {
			settings = migrateToV6(settings);
		}

		if (currentVersion < 7) {
			settings = migrateToV7(settings);
		}

		if (currentVersion < 8) {
			settings = migrateToV8(settings);
		}

		if (currentVersion < 9) {
			settings = migrateToV9(settings);
		}

		if (currentVersion < 10) {
			settings = migrateToV10(settings);
		}

		if (currentVersion < 11) {
			settings = migrateToV11(settings, app);
		}

		if (currentVersion < 12) {
			settings = migrateToV12(settings);
		}

		if (currentVersion < 13) {
			settings = migrateToV13(settings);
		}

		// update version number
		settings.settingsVersion = DEFAULT_SETTINGS.settingsVersion;
		return settings;
	}
}
