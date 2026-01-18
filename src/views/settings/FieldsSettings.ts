import { Setting } from "obsidian";
import { FIELD_DEFINITIONS } from "src/config/fieldDefinitions";
import ObsidianHardcover from "src/main";
import {
	ActivityDateFieldConfig,
	FieldDefinition,
	FieldsSettings,
} from "src/types";
import { Accordion } from "../ui/Accordion";
import { renderStatusMappingSettings } from "./StatusMappingSettings";

export function renderFieldSettings(
	containerEl: HTMLElement,
	plugin: ObsidianHardcover,
	accordion: Accordion,
): void {
	new Setting(containerEl)
		.setName("Configure the data to include in your book notes")
		.setHeading();

	new Setting(containerEl)
		.setName("Preserve custom frontmatter")
		.setDesc(
			"Keep any user-added frontmatter properties when syncing. Turn off to let Hardcover overwrite the entire frontmatter.",
		)
		.addToggle((toggle) =>
			toggle
				.setValue(plugin.settings.preserveCustomFrontmatter)
				.onChange(async (value) => {
					plugin.settings.preserveCustomFrontmatter = value;
					await plugin.saveSettings();
				}),
		);

	// create field groups div for better spacing
	const fieldGroupsContainer = containerEl.createDiv({
		cls: "field-groups-container",
	});

	FIELD_DEFINITIONS.forEach((field) => {
		const contentEl = accordion.renderAccordionField(
			fieldGroupsContainer,
			field,
		);
		addFieldSettings(contentEl, field, plugin);
	});
}

function addFieldSettings(
	containerEl: HTMLElement,
	field: FieldDefinition,
	plugin: ObsidianHardcover,
): void {
	const fieldSettings = plugin.settings.fieldsSettings[field.key];

	const isBodyField = field.key === "review" || field.key === "quotes";

	if (field.key !== "firstRead" && field.key !== "lastRead" && !isBodyField) {
		new Setting(containerEl)
			.setName("Property name")
			.setDesc(`Frontmatter property name for ${field.name.toLowerCase()}`)
			.addText((text) =>
				text
					.setPlaceholder(field.key)
					.setValue(fieldSettings.propertyName)
					.onChange(async (value) => {
						plugin.settings.fieldsSettings[field.key].propertyName =
							value || field.key;
						await plugin.saveSettings();
					}),
			);
	}

	if (field.supportsWikilinks) {
		new Setting(containerEl)
			.setName("Format as wikilinks")
			.setDesc(
				`Format ${field.name.toLowerCase()} as [[wikilinks]] for linked notes`,
			)
			.addToggle((toggle) =>
				toggle
					.setValue((fieldSettings as any).wikilinks || false)
					.onChange(async (value) => {
						(plugin.settings.fieldsSettings[field.key] as any).wikilinks =
							value;
						await plugin.saveSettings();
					}),
			);
	}

	if (isBodyField) {
		containerEl.createEl("p", {
			text: `${field.name} content appears in the note body, not as a frontmatter property.`,
			cls: "setting-item-description",
		});

		const defaultHeading = field.key === "review" ? "My Review" : "Quotes";
		new Setting(containerEl)
			.setName("Section heading")
			.setDesc(
				`Heading text for the ${field.name.toLowerCase()} section in your notes`,
			)
			.addText((text) =>
				text
					.setPlaceholder(defaultHeading)
					.setValue((fieldSettings as any).bodyHeading || defaultHeading)
					.onChange(async (value) => {
						(plugin.settings.fieldsSettings[field.key] as any).bodyHeading =
							value || defaultHeading;
						await plugin.saveSettings();
					}),
			);
	}

	// quotes specific format dropdown
	if (field.key === "quotes") {
		new Setting(containerEl)
			.setName("Quote format")
			.setDesc("Choose how quotes are displayed in your notes")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("blockquote", "Blockquote")
					.addOption("callout", "Callout")
					.setValue((fieldSettings as any).format || "blockquote")
					.onChange(async (value: "blockquote" | "callout") => {
						(plugin.settings.fieldsSettings.quotes as any).format = value;
						await plugin.saveSettings();
					}),
			);
	}

	if (field.hasDataSource) {
		const sourceKey =
			`${field.key}Source` as keyof typeof plugin.settings.dataSourcePreferences;
		const currentSource = plugin.settings.dataSourcePreferences[sourceKey];

		new Setting(containerEl)
			.setName("Data source")
			.setDesc(
				`Choose whether to use book-level or edition-level data for the ${field.name.toLowerCase()}.`,
			)
			.addDropdown((dropdown) => {
				dropdown
					.addOption("book", "Book")
					.addOption("edition", "Edition")
					.setValue(currentSource)
					.onChange(async (value: "book" | "edition") => {
						plugin.settings.dataSourcePreferences[sourceKey] = value;
						await plugin.saveSettings();
					});
			});
	}

	if (field.key === "firstRead" || field.key === "lastRead") {
		addActivityDatePropertyField(
			containerEl,
			field.key,
			"start",
			field.name,
			plugin,
		);
		addActivityDatePropertyField(
			containerEl,
			field.key,
			"end",
			field.name,
			plugin,
		);
	}

	if (field.key === "status") {
		renderStatusMappingSettings(containerEl, plugin);
	}
}

function addActivityDatePropertyField(
	containerEl: HTMLElement,
	fieldKey: keyof FieldsSettings,
	type: "start" | "end",
	fieldName: string,
	plugin: ObsidianHardcover,
): void {
	const fieldSettings = plugin.settings.fieldsSettings[
		fieldKey
	] as ActivityDateFieldConfig;
	const propName = type === "start" ? "startPropertyName" : "endPropertyName";
	const defaultValue = type === "start" ? `${fieldKey}Start` : `${fieldKey}End`;

	new Setting(containerEl)
		.setName(`${type.charAt(0).toUpperCase() + type.slice(1)} date property`)
		.setDesc(`Property name for ${fieldName.toLowerCase()} ${type} date`)
		.addText((text) => {
			text
				.setPlaceholder(defaultValue)
				.setValue(fieldSettings[propName])
				.onChange(async (value) => {
					(plugin.settings.fieldsSettings[fieldKey] as ActivityDateFieldConfig)[
						propName
					] = value || defaultValue;
					await plugin.saveSettings();
				});
		});
}
