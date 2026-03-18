import { PluginSettings } from "src/types";
import { LegacySettings } from "src/types/migrations";

export function migrateToV10(settings: LegacySettings): PluginSettings {
	if (!settings.frontmatterFields) {
		settings.frontmatterFields = {};
	}

	if (!settings.frontmatterFields.quotes) {
		(settings.frontmatterFields as any).quotes = {
			enabled: false,
			propertyName: "quotes",
			format: "blockquote",
			bodyHeading: "Quotes",
		};
	}

	if (!("bodyHeading" in settings.frontmatterFields.review)) {
		(settings.frontmatterFields.review as any).bodyHeading = "Review";
	}

	return settings as PluginSettings;
}
