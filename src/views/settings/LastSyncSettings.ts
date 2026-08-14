import { Setting, SettingDefinition } from "obsidian";

import ObsidianHardcover from "src/main";

function configureLastSyncTimestampSetting(
	setting: Setting,
	plugin: ObsidianHardcover,
	onSettingsChanged: () => void,
): void {
	setting.controlEl.empty();

	setting
		.setName("Last sync timestamp")
		.setDesc(
			"When provided, only books updated on Hardcover after this timestamp will be synced. Leave empty to sync your entire library. Example format: 2025-01-01T18:30:35.519934+00:00",
		)
		.addExtraButton((button) => {
			button
				.setIcon("refresh-cw")
				.setTooltip("Reset timestamp (will force full sync)")
				.onClick(async () => {
					plugin.settings.lastSyncTimestamp = "";
					await plugin.saveSettings();
					onSettingsChanged();
				});
		})
		.addText((text) =>
			text
				.setPlaceholder("YYYY-MM-DD'T'HH:mm:ss.SSSSSSXXX")
				.setValue(plugin.settings.lastSyncTimestamp || "")
				.onChange(async (value) => {
					plugin.settings.lastSyncTimestamp = value;
					await plugin.saveSettings();
				}),
		);
}

export function getLastSyncTimestampSettingDefinition(
	plugin: ObsidianHardcover,
	onSettingsChanged: () => void,
): SettingDefinition {
	return {
		name: "Last sync timestamp",
		render: (setting) =>
			configureLastSyncTimestampSetting(setting, plugin, onSettingsChanged),
	};
}
