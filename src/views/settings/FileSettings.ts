import { Setting } from "obsidian";
import { DEFAULT_FILENAME_FORMAT } from "src/config/defaultSettings";
import ObsidianHardcover from "src/main";
import { markSettingAsRequired } from "../ui/SettingsHelpers";

export function renderFilenameTemplateSetting(
	containerEl: HTMLElement,
	plugin: ObsidianHardcover,
): void {
	new Setting(containerEl)
		.setName("Filename template")
		.setDesc(
			"Pattern used to generate filenames. Available variables: {{bookId}}, {{editionId}}, {{bookTitle}}, {{editionTitle}}, {{bookAuthors}}, {{editionAuthors}}, {{bookYear}}, {{editionYear}}.",
		)
		.addText((text) =>
			text
				.setPlaceholder(DEFAULT_FILENAME_FORMAT)
				.setValue(plugin.settings.filenameTemplate)
				.onChange(async (value) => {
					plugin.settings.filenameTemplate = value || DEFAULT_FILENAME_FORMAT;
					await plugin.saveSettings();
				}),
		);
}

export function renderFolderSetting(
	containerEl: HTMLElement,
	plugin: ObsidianHardcover,
): Setting {
	const baseDesc =
		"The folder where book notes will be stored (required, will be created if it doesn't exist)";

	const setting = new Setting(containerEl)
		.setName("Target folder")
		.setDesc(baseDesc);

	markSettingAsRequired(setting);

	setting.addText((text) => {
		text
			.setPlaceholder("HardcoverBooks")
			.setValue(plugin.settings.targetFolder)
			.onChange(async (value) => {
				const isRootOrEmpty = plugin.fileUtils.isRootOrEmpty(value);

				if (isRootOrEmpty) {
					text.inputEl.addClass("has-error");
					setting.setDesc(
						`${baseDesc} - Please specify a subfolder. Using the vault root is not allowed.`,
					);
				} else {
					text.inputEl.removeClass("has-error");
					setting.setDesc(baseDesc);
				}

				plugin.settings.targetFolder = value;
				await plugin.saveSettings();
			});
	});

	return setting;
}
