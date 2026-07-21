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

	// check if review exists first
	if (
		settings.frontmatterFields.review &&
		!("bodyHeading" in settings.frontmatterFields.review)
	) {
		settings.frontmatterFields.review.bodyHeading = "Review";
	}

	return settings as PluginSettings;
}
