import { SettingDefinition, SettingDefinitionGroup } from "obsidian";
import { HARDCOVER_STATUS_MAP } from "src/config/statusMapping";
import ObsidianHardcover from "src/main";

const STATUS_FIELDS = Object.entries(HARDCOVER_STATUS_MAP).map(
	([id, label]) => ({
		id: Number(id),
		label,
	}),
);

export function getStatusMappingGroupDefinition(
	plugin: ObsidianHardcover,
): SettingDefinitionGroup {
	return {
		type: "group",
		heading: "Status mapping",
		items: [
			{
				name: "",
				desc: "Customize how Hardcover statuses appear in your notes",
			},
			...STATUS_FIELDS.map(
				(field): SettingDefinition => ({
					name: field.label,
					render: (setting) => {
						setting.setClass("obhc-status-mapping-row");
						setting.controlEl.empty();
						setting.addText((text) =>
							text
								.setPlaceholder(field.label)
								.setValue(plugin.settings.statusMapping[field.id] || "")
								.onChange(async (value) => {
									plugin.settings.statusMapping[field.id] =
										value || field.label;
									await plugin.saveSettings();
								}),
						);
					},
				}),
			),
		],
	};
}
