import { PluginSettings } from "src/types";
import { App } from "obsidian";

export function migrateToV11(
	settings: PluginSettings,
	app?: App,
): PluginSettings {
	if (!app) {
		return settings;
	}

	const apiKey = settings.apiKey?.trim();
	if (!apiKey) {
		return settings;
	}

	const existingSecret = app.secretStorage.getSecret(apiKey);
	if (existingSecret !== null) {
		return settings;
	}

	const secretName = "hardcover-api-key";
	app.secretStorage.setSecret(secretName, apiKey);
	settings.apiKey = secretName;

	if (IS_DEV) {
		console.debug("Migrated API key to SecretStorage");
	}

	return settings;
}
