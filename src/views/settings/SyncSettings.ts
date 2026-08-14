import { ButtonComponent, Setting, SettingDefinition } from "obsidian";
import { CONTENT_DELIMITER } from "src/config/constants";
import ObsidianHardcover from "src/main";

export interface SyncButtonSettings {
	plugin: ObsidianHardcover;
	name?: string;
	description?: string;
	buttonText?: string;
	debugLimit?: number;
	showLimitInput?: boolean;
	onDebugLimitChanged?: (limit: number) => void;
	settingClassName?: string;
	isMainCTA?: boolean;
	onSyncComplete?: () => void;
}

function configureSyncButtonSetting(
	setting: Setting,
	config: SyncButtonSettings,
): ButtonComponent {
	const {
		plugin,
		name = "Sync",
		description = "Sync Hardcover books to your notes",
		buttonText = "Sync",
		debugLimit,
		showLimitInput = false,
		onDebugLimitChanged,
		settingClassName,
		isMainCTA = false,
		onSyncComplete,
	} = config;

	setting.setName(name).setDesc(description);
	setting.controlEl.empty();

	if (settingClassName) {
		setting.setClass(settingClassName);
	}

	let limitInputValue = debugLimit;
	if (showLimitInput) {
		setting.addText((text) => {
			text
				.setPlaceholder("1")
				.setValue(String(debugLimit || 1))
				.onChange((value) => {
					limitInputValue = parseInt(value) || 1;
					if (onDebugLimitChanged) {
						onDebugLimitChanged(limitInputValue);
					}
				});
		});
	}

	let button!: ButtonComponent;

	setting.addButton((btn) => {
		button = btn;
		btn.setButtonText(buttonText);
		btn.onClick(async () => {
			// Show loading state
			btn.setButtonText("Syncing...");
			btn.setDisabled(true);

			try {
				const options = limitInputValue ? { debugLimit: limitInputValue } : {};
				await plugin.triggerSync(options);
				if (onSyncComplete) {
					onSyncComplete();
				}
			} catch (error) {
				console.error("Sync failed:", error);
			} finally {
				// Reset button state
				btn.setButtonText(buttonText);
				btn.setDisabled(false);
			}
		});

		// turn main button into obsidian cta
		if (isMainCTA) {
			btn.setCta();
		}
	});

	return button;
}

function configureSyncInfoSetting(setting: Setting): void {
	setting.descEl.empty();
	setting.descEl.createSpan({
		text: `⚠️ Content below the ${CONTENT_DELIMITER} delimiter in your notes will be preserved during syncs. Regular backups of your vault are still recommended.`,
	});
	setting.descEl.createEl("br");
	setting.descEl.createEl("br");
	setting.descEl.createSpan({
		text: "For large libraries (500+ books), sync may take several minutes due to Hardcover's API rate limits (60 requests/minute). The plugin will automatically pace requests to respect these limits.",
	});
}

export function getSyncButtonSettingDefinition(
	config: SyncButtonSettings,
): SettingDefinition {
	return {
		name: config.name ?? "Sync",
		render: (setting) => {
			configureSyncButtonSetting(setting, config);
		},
	};
}

export function getSyncSectionDefinitions(
	config: SyncButtonSettings,
): SettingDefinition[] {
	return [
		getSyncButtonSettingDefinition(config),
		{
			name: "",
			render: (setting) => configureSyncInfoSetting(setting),
		},
	];
}
