import { Setting } from "obsidian";
import { GroupingSettings } from "src/types";
import ObsidianHardcover from "src/main";

export function renderGroupingSettings(
	containerEl: HTMLElement,
	plugin: ObsidianHardcover,
	onSettingsChanged: () => void
): void {
	const groupSetting = new Setting(containerEl)
		.setName("Group into subfolders")
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

	groupSetting.settingEl.style.borderTop = "none";

	if (plugin.settings.grouping.enabled) {
		new Setting(containerEl)
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
						onSettingsChanged();
					})
			);
	}

	// add author format and missing author settings, only show when grouping includes authors
	if (
		plugin.settings.grouping.enabled &&
		(plugin.settings.grouping.groupBy === "author" ||
			plugin.settings.grouping.groupBy === "author-series")
	) {
		const authorFormatSetting = new Setting(containerEl)
			.setName("Use 'Last Name, First Name' format for author folders")
			.setDesc("(default is First Name Last Name)")
			.addToggle((toggle) =>
				toggle
					.setValue(plugin.settings.grouping.authorFormat === "lastFirst")
					.onChange(async (value) => {
						plugin.settings.grouping.authorFormat = value
							? "lastFirst"
							: "firstLast";
						await plugin.saveSettings();
					})
			);

		authorFormatSetting.settingEl.style.borderTop = "none";

		new Setting(containerEl)
			.setName("Missing author handling")
			.setDesc("How to organize books with no 'Author' role")
			.addDropdown((dropdown) =>
				dropdown
					.addOption(
						"useFallbackPriority",
						"Use fallback priority (Writer → Editor → first contributor)"
					)
					.addOption("useFallbackFolder", "Use fallback folder")
					.setValue(plugin.settings.grouping.noAuthorBehavior)
					.onChange(
						async (value: "useFallbackPriority" | "useFallbackFolder") => {
							plugin.settings.grouping.noAuthorBehavior = value;
							await plugin.saveSettings();
							onSettingsChanged();
						}
					)
			);

		// show folder name input only if useFallbackFolder is selected
		if (plugin.settings.grouping.noAuthorBehavior === "useFallbackFolder") {
			const fallbackFolderSetting = new Setting(containerEl)
				.setName("Fallback folder name")
				.setDesc("Name for books with missing authors")
				.addText((text) =>
					text
						.setPlaceholder("Various")
						.setValue(plugin.settings.grouping.fallbackFolderName)
						.onChange(async (value) => {
							plugin.settings.grouping.fallbackFolderName = value || "Various";
							await plugin.saveSettings();
						})
				);

			fallbackFolderSetting.settingEl.style.borderTop = "none";
		}

		new Setting(containerEl)
			.setName("Multiple authors handling")
			.setDesc("How to organize books with multiple 'Author' roles")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("useFirst", "Use first author")
					.addOption("useCollectionsFolder", "Use collections folder")
					.setValue(plugin.settings.grouping.multipleAuthorsBehavior)
					.onChange(async (value: "useFirst" | "useCollectionsFolder") => {
						plugin.settings.grouping.multipleAuthorsBehavior = value;
						await plugin.saveSettings();
						onSettingsChanged();
					})
			);

		if (
			plugin.settings.grouping.multipleAuthorsBehavior ===
			"useCollectionsFolder"
		) {
			const collectionsFolderSetting = new Setting(containerEl)
				.setName("Collections folder name")
				.setDesc("Name for books with multiple 'Author' roles")
				.addText((text) =>
					text
						.setPlaceholder("Collections")
						.setValue(plugin.settings.grouping.collectionsFolderName)
						.onChange(async (value) => {
							plugin.settings.grouping.collectionsFolderName =
								value || "Collections";
							await plugin.saveSettings();
						})
				);

			collectionsFolderSetting.settingEl.style.borderTop = "none";
		}
	}

	if (plugin.settings.grouping.enabled) {
		new Setting(containerEl)
			.setName("Auto-organize notes")
			.setDesc(
				"Automatically move notes to match your grouping settings on every sync (default behavior). Disable to keep notes where you've manually placed them. Note: manually renamed folders may result in split collections when new books are added."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(plugin.settings.grouping.autoOrganizeFolders)
					.onChange(async (value) => {
						plugin.settings.grouping.autoOrganizeFolders = value;
						await plugin.saveSettings();
					})
			);
	}
}
