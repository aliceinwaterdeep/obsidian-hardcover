import { Setting } from "obsidian";
import ObsidianHardcover from "src/main";
import { markSettingAsRequired } from "../ui/SettingsHelpers";
import { HARDCOVER_API_KEY_URL } from "src/config/constants";

export function renderApiTokenSetting(
	containerEl: HTMLElement,
	plugin: ObsidianHardcover,
	onSettingsChanged: () => void
): void {
	let textComponent: any;
	let envMessageEl: HTMLElement | null = null;
	let clearButton: HTMLElement | null = null;

	const setting = new Setting(containerEl).setName("Hardcover API key");

	setting.descEl.empty();

	const apiKeyInfo = setting.descEl.createDiv();
	apiKeyInfo.appendText("Get your API key from ");
	apiKeyInfo.createEl("a", {
		text: HARDCOVER_API_KEY_URL,
		href: HARDCOVER_API_KEY_URL,
		attr: { target: "_blank" },
	});

	setting.descEl.appendText(
		"If you prefer, you can also add the key to a .env file in your vault root: HARDCOVER_API_KEY=your_key_here"
	);

	markSettingAsRequired(setting);

	const updateSettingState = async () => {
		const envApiKey = await plugin.envUtils.getHardcoverApiKey();

		if (envApiKey) {
			// hide input field and clear button
			if (textComponent) {
				textComponent.inputEl.addClass("obhc-hidden");
			}
			if (clearButton) {
				clearButton.addClass("obhc-hidden");
			}

			// show env message
			if (!envMessageEl) {
				envMessageEl = setting.controlEl.createDiv({ cls: "obhc-env-message" });
				envMessageEl.textContent = "✅ API key loaded from .env file";
			}
			envMessageEl.removeClass("obhc-hidden");
		} else {
			// show input field and clear button
			if (textComponent) {
				textComponent.inputEl.removeClass("obhc-hidden");
			}
			if (clearButton) {
				clearButton.removeClass("obhc-hidden");
			}

			// hide env message
			if (envMessageEl) {
				envMessageEl.addClass("obhc-hidden");
			}
		}
	};

	setting
		.addExtraButton((button) => {
			clearButton = button.extraSettingsEl;
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
					await updateSettingState();
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

	// initial state
	updateSettingState();
}
