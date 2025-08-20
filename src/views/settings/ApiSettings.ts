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

	setting.descEl.innerHTML = `
    Get your API key from <a href="${HARDCOVER_API_KEY_URL}" target="_blank">${HARDCOVER_API_KEY_URL}</a>
    <br><br>
    If you prefer, you can also add the key to a <code>.env</code> file in your vault root:<br>
    <code>HARDCOVER_API_KEY=your_key_here</code>
`;

	markSettingAsRequired(setting);

	const updateSettingState = async () => {
		const envApiKey = await plugin.envUtils.getHardcoverApiKey();

		if (envApiKey) {
			// hide input field and clear button
			if (textComponent) {
				textComponent.inputEl.style.display = "none";
			}
			if (clearButton) {
				clearButton.style.display = "none";
			}

			// show env message
			if (!envMessageEl) {
				envMessageEl = setting.controlEl.createDiv();
				envMessageEl.textContent = "✅ API key loaded from .env file";
				envMessageEl.style.color = "var(--text-muted)";
				envMessageEl.style.fontSize = "0.9em";
			}
			envMessageEl.style.display = "block";
		} else {
			// show input field and clear button
			if (textComponent) {
				textComponent.inputEl.style.display = "block";
			}
			if (clearButton) {
				clearButton.style.display = "block";
			}

			// hide env message
			if (envMessageEl) {
				envMessageEl.style.display = "none";
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
