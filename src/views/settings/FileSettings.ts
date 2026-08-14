import { Setting, SettingDefinition } from "obsidian";
import { DEFAULT_FILENAME_FORMAT } from "src/config/defaultSettings";
import ObsidianHardcover from "src/main";
import { markSettingAsRequired } from "../ui/SettingsHelpers";

const FILENAME_TEMPLATE_DESC =
	"Pattern used to generate filenames. Available variables: {{bookId}}, {{editionId}}, {{bookTitle}}, {{editionTitle}}, {{bookAuthors}}, {{editionAuthors}}, {{bookYear}}, {{editionYear}}.";

function configureFilenameTemplateSetting(
	setting: Setting,
	plugin: ObsidianHardcover,
): void {
	setting
		.setName("Filename template")
		.setDesc(FILENAME_TEMPLATE_DESC)
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

export function getFilenameTemplateSettingDefinition(
	plugin: ObsidianHardcover,
): SettingDefinition {
	return {
		name: "Filename template",
		desc: FILENAME_TEMPLATE_DESC,
		render: (setting) => configureFilenameTemplateSetting(setting, plugin),
	};
}

const TARGET_FOLDER_BASE_DESC =
	"The folder where book notes will be stored (required, will be created if it doesn't exist)";

function configureFolderSetting(
	setting: Setting,
	plugin: ObsidianHardcover,
): void {
	setting.setName("Target folder").setDesc(TARGET_FOLDER_BASE_DESC);

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
						`${TARGET_FOLDER_BASE_DESC} - Please specify a subfolder. Using the vault root is not allowed.`,
					);
				} else {
					text.inputEl.removeClass("has-error");
					setting.setDesc(TARGET_FOLDER_BASE_DESC);
				}

				plugin.settings.targetFolder = value;
				await plugin.saveSettings();
			});
	});
}

export function getFolderSettingDefinition(
	plugin: ObsidianHardcover,
): SettingDefinition {
	return {
		name: "Target folder",
		render: (setting) => configureFolderSetting(setting, plugin),
	};
}
