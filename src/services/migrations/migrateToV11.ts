import { PluginSettings } from "src/types";
import { App } from "obsidian";
import { LegacySettings } from "src/types/migrations";

export function migrateToV11(
	settings: LegacySettings,
	app?: App,
): PluginSettings {
	if (!app) {
		return settings as PluginSettings;
	}

	const apiKey = settings.apiKey?.trim();
	if (!apiKey) {
		return settings as PluginSettings;
	}

	const existingSecret = app.secretStorage.getSecret(apiKey);
	if (existingSecret !== null) {
		return settings as PluginSettings;
	}

	const secretName = "hardcover-api-key";
	app.secretStorage.setSecret(secretName, apiKey);
	settings.apiKey = secretName;

	if (IS_DEV) {
		console.debug("Migrated API key to SecretStorage");
	}

	return settings as PluginSettings;
}
