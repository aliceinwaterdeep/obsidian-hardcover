import { Setting, SecretComponent } from "obsidian";
import ObsidianHardcover from "src/main";
import { markSettingAsRequired } from "../ui/SettingsHelpers";
import { HARDCOVER_API_KEY_URL } from "src/config/constants";

export function renderApiTokenSetting(
	containerEl: HTMLElement,
	plugin: ObsidianHardcover,
	onSettingsChanged: () => void,
): void {
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
		"Store your API key in SecretStorage (recommended), or add it to a .env file in your vault root: HARDCOVER_API_KEY=your_key_here",
	);

	markSettingAsRequired(setting);

	const updateEnvMessage = async () => {
		const envApiKey = await plugin.envUtils.getHardcoverApiKey();

		const existingMessage =
			setting.controlEl.querySelector(".obhc-env-message");
		if (existingMessage) {
			existingMessage.remove();
		}

		// show message if .env is being used
		if (envApiKey) {
			const envMessageEl = setting.controlEl.createDiv({
				cls: "obhc-env-message",
			});
			envMessageEl.textContent =
				"✅ API key loaded from .env file (takes priority over SecretStorage)";
		}
	};

	setting.addComponent((component) => {
		return new SecretComponent(plugin.app, component)
			.setValue(plugin.settings.apiKey)
			.onChange(async (value) => {
				plugin.settings.apiKey = value;
				await plugin.saveSettings();
				onSettingsChanged();
			});
	});

	// initial state
	updateEnvMessage();
}
