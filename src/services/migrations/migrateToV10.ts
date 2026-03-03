import { PluginSettings } from "src/types";

export function migrateToV10(settings: PluginSettings): PluginSettings {
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

	return settings;
}
