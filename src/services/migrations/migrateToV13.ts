import { FrontmatterFieldsSettings, PluginSettings } from "src/types";
import { LegacySettings } from "src/types/migrations";

export function migrateToV13(settings: LegacySettings): PluginSettings {
	if (IS_DEV) {
		console.debug("Migrating to v13: full note template");
	}

	if (!settings.frontmatterFields) {
		settings.frontmatterFields = {};
	}
	if (!settings.bodyTemplate) {
		settings.bodyTemplate = "";
	}

	// define the order fields should appear, matching old toggles order
	const fieldOrder = [
		"bookTitle",
		"editionTitle",
		"bookCover",
		"editionCover",
		"bookReleaseDate",
		"editionReleaseDate",
		"bookAuthors",
		"editionAuthors",
		"bookContributors",
		"editionContributors",
		"description",
		"series",
		"publisher",
		"isbn10",
		"isbn13",
		"url",
		"genres",
		"lists",
		"status",
		"rating",
		"firstRead",
		"lastRead",
		"totalReads",
		"readYears",
	];

	// step 1: build YAML from enabled frontmatter fields
	const yamlLines: string[] = [];
	const frontmatterFields = settings.frontmatterFields;

	for (const fieldKey of fieldOrder) {
		const fieldConfig = frontmatterFields[fieldKey];

		// skip if field doesn't exist or toggle not enabled
		if (!fieldConfig || !fieldConfig.enabled) continue;

		// handle activity date fields since they creatw two properties each
		if (fieldKey === "firstRead" || fieldKey === "lastRead") {
			const activityConfig = fieldConfig as any;
			yamlLines.push(
				`${activityConfig.startPropertyName}: {{${fieldKey}Start}}`,
			);
			yamlLines.push(`${activityConfig.endPropertyName}: {{${fieldKey}End}}`);
		} else {
			// regular field, use custom property name and field key as variable
			yamlLines.push(`${fieldConfig.propertyName}: {{${fieldKey}}}`);
		}
	}

	// step 2: build complete noteTemplate
	const yamlBlock =
		yamlLines.length > 0
			? `---\n${yamlLines.join("\n")}\n---\n\n`
			: `---\n---\n\n`;

	const bodyContent = settings.bodyTemplate || "";

	const noteTemplate = yamlBlock + bodyContent;

	// step 3: update new settings
	settings.noteTemplate = noteTemplate;
	settings.keepEmptyHeadings = false;

	// step 4: cleanup obsolete settings

	delete settings.frontmatterFields;
	delete settings.bodyTemplate;

	return settings as PluginSettings;
}
