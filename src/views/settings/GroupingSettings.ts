import { Setting } from "obsidian";
import { GroupingSettings } from "src/types";
import ObsidianHardcover from "src/main";

export function renderGroupingSettings(
	containerEl: HTMLElement,
	plugin: ObsidianHardcover,
	onSettingsChanged: () => void
): void {
	new Setting(containerEl)
		.setName("Organize into folders")
		.setDesc(
			"Group your book notes into subdirectories for better organization"
		)
		.addToggle((toggle) =>
			toggle
				.setValue(plugin.settings.grouping.enabled)
				.onChange(async (value) => {
					plugin.settings.grouping.enabled = value;
					await plugin.saveSettings();
					onSettingsChanged();
				})
		);

	if (plugin.settings.grouping.enabled) {
		const groupByDropdown = new Setting(containerEl)
			.setName("Group by")
			.setDesc("Choose how to organize your books into directories")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("author", "Author")
					.addOption("series", "Series")
					.addOption("author-series", "Author → Series")
					.setValue(plugin.settings.grouping.groupBy)
					.onChange(async (value: GroupingSettings["groupBy"]) => {
						plugin.settings.grouping.groupBy = value;
						await plugin.saveSettings();
					})
			);

		groupByDropdown.settingEl.style.borderTop = "none";
	}
}
