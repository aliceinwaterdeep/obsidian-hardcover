import { Setting } from "obsidian";

export function createSetting(
	containerEl: HTMLElement,
	name: string,
	description: string,
	settingClassName?: string,
): Setting {
	const setting = new Setting(containerEl).setName(name).setDesc(description);

	if (settingClassName) {
		setting.setClass(settingClassName);
	}

	return setting;
}

export function markSettingAsRequired(setting: Setting): Setting {
	const asterisk = createSpan({ text: " *", cls: "obhc-required" });
	setting.nameEl.appendChild(asterisk);

	return setting;
}
