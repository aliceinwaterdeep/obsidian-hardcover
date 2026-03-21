import { ButtonComponent, Setting } from "obsidian";
import { CONTENT_DELIMITER } from "src/config/constants";
import { HARDCOVER_STATUS_MAP } from "src/config/statusMapping";
import ObsidianHardcover from "src/main";

export interface SyncButtonConfig {
	containerEl: HTMLElement;
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

export function renderSyncSection(config: SyncButtonConfig) {
	const { containerEl } = config;

	renderSyncButton(config);

	new Setting(containerEl).setDesc(
		`⚠️ Content below the ${CONTENT_DELIMITER} delimiter in your notes will be preserved during syncs. Regular backups of your vault are still recommended.`,
	);

	new Setting(containerEl).setDesc(
		`For large libraries (500+ books), sync may take several minutes due to Hardcover's API rate limits (60 requests/minute). The plugin will automatically pace requests to respect these limits.`,
	);
}

export const renderSyncButton = (config: SyncButtonConfig): ButtonComponent => {
	const {
		containerEl,
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

	const setting = new Setting(containerEl).setName(name).setDesc(description);

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
};
