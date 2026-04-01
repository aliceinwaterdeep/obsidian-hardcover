import { Setting } from "obsidian";

import ObsidianHardcover from "src/main";

export function renderLastSyncTimestampSetting(
	containerEl: HTMLElement,
	plugin: ObsidianHardcover,
	onSettingsChanged: () => void,
): void {
	new Setting(containerEl)
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
