import { Setting } from "obsidian";
import ObsidianHardcover from "src/main";
import { markSettingAsRequired } from "../ui/SettingsHelpers";

export function renderApiTokenSetting(
	containerEl: HTMLElement,
	plugin: ObsidianHardcover,
	onSettingsChanged: () => void
): void {
	let textComponent: any;

	const setting = new Setting(containerEl)
		.setName("Hardcover API key")
		.setDesc("Get your API key from https://hardcover.app/account/api");

	markSettingAsRequired(setting);

	setting
		.addExtraButton((button) => {
			button
				.setIcon("refresh-cw")
				.setTooltip("Clear API key")
				.onClick(async () => {
					plugin.settings.apiKey = "";
					await plugin.saveSettings();

					// update the text field value
					if (textComponent) {
						textComponent.setValue("");
					}

					onSettingsChanged();
				});
		})
		.addText((text) => {
			textComponent = text;

			text
				.setPlaceholder("Enter your API key")
				.setValue(plugin.settings.apiKey)
				.onChange(async (value) => {
					plugin.settings.apiKey = value;
					await plugin.saveSettings();
					onSettingsChanged();
				});
		});
}
