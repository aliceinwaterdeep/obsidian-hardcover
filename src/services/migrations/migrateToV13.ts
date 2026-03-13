import { FrontmatterFieldsSettings, PluginSettings } from "src/types";

interface V12Settings extends Omit<
	PluginSettings,
	"noteTemplate" | "keepEmptyHeadings" // noteTemplate and keepEmptyHeadings don't exist in v12
> {
	frontmatterFields: FrontmatterFieldsSettings;
	bodyTemplate: string;
}

export function migrateToV13(settings: V12Settings): PluginSettings {
	if (IS_DEV) {
		console.debug("Migrating to v13: full note template");
	}

	// step 1: build YAML from enabled frontmatter fields
	const yamlLines: string[] = [];
	const frontmatterFields = settings.frontmatterFields;

	for (const [fieldKey, fieldConfig] of Object.entries(frontmatterFields)) {
		// skip if toggle not enabled
		if (!fieldConfig.enabled) continue;

		// skip body only fields (review and quotes, they're already body variables but old settings treated them as frontmatter)
		if (fieldKey === "review" || fieldKey === "quotes") continue;

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

	// step 3: build new v13 settings object
	const v13Settings: PluginSettings = {
		...settings,
		noteTemplate: noteTemplate,
		keepEmptyHeadings: false,
	};

	// step 4: cleanup obsolete settings
	delete (v13Settings as any).frontmatterFields;
	delete (v13Settings as any).bodyTemplate;

	return v13Settings;
}
