import { SettingsMigrationService } from "./SettingsMigrationService";
import { PluginSettings } from "../types";
import { DEFAULT_SETTINGS } from "../config/defaultSettings";

describe("SettingsMigrationService", () => {
	describe("migrateSettings", () => {
		test("does not modify settings that are already current version", () => {
			const currentSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

			const result = SettingsMigrationService.migrateSettings(currentSettings);

			expect(result.settingsVersion).toBe(DEFAULT_SETTINGS.settingsVersion);
			expect(result).toEqual(DEFAULT_SETTINGS);
		});

		test("applies migration to settings without version field", () => {
			const oldSettings = {
				apiKey: "test-key",
				lastSyncTimestamp: "2023-01-01T00:00:00Z",
				userId: 123,
				fieldsSettings: DEFAULT_SETTINGS.fieldsSettings,
				// missing settingsVersion field
			};

			const result = SettingsMigrationService.migrateSettings(oldSettings);

			expect(result.settingsVersion).toBe(DEFAULT_SETTINGS.settingsVersion);
			expect(result.apiKey).toBe("test-key");
			expect(result.lastSyncTimestamp).toBe("2023-01-01T00:00:00Z");
			expect(result.userId).toBe(123);
		});

		test("applies migration to version 0 settings", () => {
			const v0Settings = {
				settingsVersion: 0,
				apiKey: "test-key",
				fieldsSettings: DEFAULT_SETTINGS.fieldsSettings,
				dataSourcePreferences: DEFAULT_SETTINGS.dataSourcePreferences,
				preserveCustomFrontmatter: true,
			} as PluginSettings;

			const result = SettingsMigrationService.migrateSettings(v0Settings);

			expect(result.settingsVersion).toBe(DEFAULT_SETTINGS.settingsVersion);
			expect(result.apiKey).toBe("test-key");
		});

		test("preserves user data during migration", () => {
			const userSettings = {
				settingsVersion: 0,
				apiKey: "user-api-key",
				lastSyncTimestamp: "2023-06-15T12:00:00Z",
				userId: 456,
				booksCount: 150,
				targetFolder: "MyBooks",
				fieldsSettings: {
					...DEFAULT_SETTINGS.fieldsSettings,
					rating: { enabled: false, propertyName: "myRating" },
				},
				dataSourcePreferences: DEFAULT_SETTINGS.dataSourcePreferences,
				statusMapping: { 1: "Want to Read", 3: "Finished" },
				filenameTemplate: "${title} by ${authors}",
				preserveCustomFrontmatter: true,
			} as PluginSettings;

			const result = SettingsMigrationService.migrateSettings(userSettings);

			// version should be updated
			expect(result.settingsVersion).toBe(DEFAULT_SETTINGS.settingsVersion);

			// user data should be preserved
			expect(result.apiKey).toBe("user-api-key");
			expect(result.lastSyncTimestamp).toBe("2023-06-15T12:00:00Z");
			expect(result.userId).toBe(456);
			expect(result.targetFolder).toBe("MyBooks");
			expect(result.fieldsSettings.rating.enabled).toBe(false);
			expect(result.fieldsSettings.rating.propertyName).toBe("myRating");
			expect(result.statusMapping).toEqual({
				1: "Want to Read",
				3: "Finished",
			});
			expect(result.filenameTemplate).toBe("${title} by ${authors}");
			expect(result.preserveCustomFrontmatter).toBe(true);
		});

		test("adds preserveCustomFrontmatter with default when missing (v6 -> v7)", () => {
			const v6Settings = {
				settingsVersion: 6,
				apiKey: "abc",
				fieldsSettings: DEFAULT_SETTINGS.fieldsSettings,
				dataSourcePreferences: DEFAULT_SETTINGS.dataSourcePreferences,
			} as PluginSettings;

			const result = SettingsMigrationService.migrateSettings(v6Settings);

			expect(result.settingsVersion).toBe(DEFAULT_SETTINGS.settingsVersion);
			expect(result.preserveCustomFrontmatter).toBe(true);
		});

		test("retains existing preserveCustomFrontmatter value during migration", () => {
			const v6Settings = {
				settingsVersion: 6,
				apiKey: "abc",
				fieldsSettings: DEFAULT_SETTINGS.fieldsSettings,
				dataSourcePreferences: DEFAULT_SETTINGS.dataSourcePreferences,
				preserveCustomFrontmatter: false,
			} as PluginSettings;

			const result = SettingsMigrationService.migrateSettings(v6Settings);

			expect(result.preserveCustomFrontmatter).toBe(false);
		});
	});
});
