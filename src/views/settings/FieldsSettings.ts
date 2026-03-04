import { Setting } from "obsidian";
import { FRONTMATTER_FIELDS_DEFINITIONS } from "src/config/fieldDefinitions";
import ObsidianHardcover from "src/main";
import {
	ActivityDateFieldConfig,
	FieldDefinition,
	FrontmatterFieldsSettings,
} from "src/types";
import { Accordion } from "../ui/Accordion";
import { renderStatusMappingSettings } from "./StatusMappingSettings";

export function renderFrontmatterFieldsSettings(
	containerEl: HTMLElement,
	plugin: ObsidianHardcover,
	accordion: Accordion,
): void {
	// create field groups div for better spacing
	const fieldGroupsContainer = containerEl.createDiv({
		cls: "field-groups-container",
	});

	FRONTMATTER_FIELDS_DEFINITIONS.forEach((field) => {
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
	const fieldSettings = plugin.settings.frontmatterFields[field.key];

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
						plugin.settings.frontmatterFields[field.key].propertyName =
							value || field.key;
						await plugin.saveSettings();
					}),
			);
	}

	if (isBodyField) {
		containerEl.createEl("p", {
			text: `${field.name} content appears in the note body, not as a frontmatter property.`,
			cls: "setting-item-description",
		});
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
						(plugin.settings.frontmatterFields.quotes as any).format = value;
						await plugin.saveSettings();
					}),
			);
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
	fieldKey: keyof FrontmatterFieldsSettings,
	type: "start" | "end",
	fieldName: string,
	plugin: ObsidianHardcover,
): void {
	const fieldSettings = plugin.settings.frontmatterFields[
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
					(
						plugin.settings.frontmatterFields[
							fieldKey
						] as ActivityDateFieldConfig
					)[propName] = value || defaultValue;
					await plugin.saveSettings();
				});
		});
}
