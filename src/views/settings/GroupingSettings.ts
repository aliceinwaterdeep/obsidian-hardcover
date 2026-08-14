import { SettingDefinition } from "obsidian";
import { GroupingSettings } from "src/types";
import ObsidianHardcover from "src/main";

export function getGroupingSettingDefinitions(
	plugin: ObsidianHardcover,
	onSettingsChanged: () => void,
): SettingDefinition[] {
	const authorGroupingVisible = () =>
		plugin.settings.grouping.enabled &&
		(plugin.settings.grouping.groupBy === "author" ||
			plugin.settings.grouping.groupBy === "author-series");

	return [
		{
			name: "Group into subfolders",
			desc: "Group your book notes into subdirectories for better organization",
			render: (setting) => {
				setting.settingEl.addClass("obhc-no-border-top");
				setting.addToggle((toggle) =>
					toggle
						.setValue(plugin.settings.grouping.enabled)
						.onChange(async (value) => {
							plugin.settings.grouping.enabled = value;
							await plugin.saveSettings();
							onSettingsChanged();
						}),
				);
			},
		},
		{
			name: "Group by",
			desc: "Choose how to organize your books into directories",
			visible: () => plugin.settings.grouping.enabled,
			render: (setting) => {
				setting.addDropdown((dropdown) =>
					dropdown
						.addOption("author", "Author")
						.addOption("series", "Series")
						.addOption("author-series", "Author → Series")
						.setValue(plugin.settings.grouping.groupBy)
						.onChange(async (value: GroupingSettings["groupBy"]) => {
							plugin.settings.grouping.groupBy = value;
							await plugin.saveSettings();
							onSettingsChanged();
						}),
				);
			},
		},
		{
			name: "Use 'Last Name, First Name' format for author folders",
			desc: "(default is First Name Last Name)",
			visible: authorGroupingVisible,
			render: (setting) => {
				setting.settingEl.addClass("obhc-no-border-top");
				setting.addToggle((toggle) =>
					toggle
						.setValue(plugin.settings.grouping.authorFormat === "lastFirst")
						.onChange(async (value) => {
							plugin.settings.grouping.authorFormat = value
								? "lastFirst"
								: "firstLast";
							await plugin.saveSettings();
						}),
				);
			},
		},
		{
			name: "Missing author handling",
			desc: "How to organize books with no 'Author' role",
			visible: authorGroupingVisible,
			render: (setting) => {
				setting.addDropdown((dropdown) =>
					dropdown
						.addOption(
							"useFallbackPriority",
							"Use fallback priority (Writer → Editor → first contributor)",
						)
						.addOption("useFallbackFolder", "Use fallback folder")
						.setValue(plugin.settings.grouping.noAuthorBehavior)
						.onChange(
							async (value: "useFallbackPriority" | "useFallbackFolder") => {
								plugin.settings.grouping.noAuthorBehavior = value;
								await plugin.saveSettings();
								onSettingsChanged();
							},
						),
				);
			},
		},
		{
			name: "Fallback folder name",
			desc: "Name for books with missing authors",
			visible: () =>
				authorGroupingVisible() &&
				plugin.settings.grouping.noAuthorBehavior === "useFallbackFolder",
			render: (setting) => {
				setting.settingEl.addClass("obhc-no-border-top");
				setting.addText((text) =>
					text
						.setPlaceholder("Various")
						.setValue(plugin.settings.grouping.fallbackFolderName)
						.onChange(async (value) => {
							plugin.settings.grouping.fallbackFolderName = value || "Various";
							await plugin.saveSettings();
						}),
				);
			},
		},
		{
			name: "Multiple authors handling",
			desc: "How to organize books with multiple 'Author' roles",
			visible: authorGroupingVisible,
			render: (setting) => {
				setting.addDropdown((dropdown) =>
					dropdown
						.addOption("useFirst", "Use first author")
						.addOption("useCollectionsFolder", "Use collections folder")
						.setValue(plugin.settings.grouping.multipleAuthorsBehavior)
						.onChange(async (value: "useFirst" | "useCollectionsFolder") => {
							plugin.settings.grouping.multipleAuthorsBehavior = value;
							await plugin.saveSettings();
							onSettingsChanged();
						}),
				);
			},
		},
		{
			name: "Collections folder name",
			desc: "Name for books with multiple 'Author' roles",
			visible: () =>
				authorGroupingVisible() &&
				plugin.settings.grouping.multipleAuthorsBehavior ===
					"useCollectionsFolder",
			render: (setting) => {
				setting.settingEl.addClass("obhc-no-border-top");
				setting.addText((text) =>
					text
						.setPlaceholder("Collections")
						.setValue(plugin.settings.grouping.collectionsFolderName)
						.onChange(async (value) => {
							plugin.settings.grouping.collectionsFolderName =
								value || "Collections";
							await plugin.saveSettings();
						}),
				);
			},
		},
		{
			name: "Auto-organize notes",
			desc: "Automatically move notes to match your grouping settings on every sync (default behavior). Disable to keep notes where you've manually placed them. Note: manually renamed folders may result in split collections when new books are added.",
			visible: () => plugin.settings.grouping.enabled,
			render: (setting) => {
				setting.addToggle((toggle) =>
					toggle
						.setValue(plugin.settings.grouping.autoOrganizeFolders)
						.onChange(async (value) => {
							plugin.settings.grouping.autoOrganizeFolders = value;
							await plugin.saveSettings();
						}),
				);
			},
		},
	];
}
