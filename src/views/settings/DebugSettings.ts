import { ButtonComponent, Setting, SettingDefinition } from "obsidian";
import ObsidianHardcover from "src/main";
import { renderSyncButton, getSyncButtonSettingDefinition } from "./SyncSettings";

function configureDebugInfoSetting(
	setting: Setting,
	plugin: ObsidianHardcover,
): void {
	setting.setDesc(
		`Hardcover User ID: ${plugin.settings.userId || "Not set"} - Total Hardcover Books Count: ${plugin.settings.booksCount || "Unknown"}`,
	);
}

function configureSyncByIdSetting(
	setting: Setting,
	plugin: ObsidianHardcover,
): void {
	let idsInputValue = "";

	setting
		.setName("Sync specific books")
		.setDesc(
			"Sync one or more books by their Hardcover book ID, regardless of your status filter. Doesn't affect the last sync timestamp used for regular syncs. Enter a comma-separated list (e.g. 12345, 67890).",
		);

	setting.addText((text) => {
		text.setPlaceholder("12345, 67890").onChange((value) => {
			idsInputValue = value;
		});
	});

	setting.addButton((btn) => {
		btn.setButtonText("Sync").onClick(async () => {
			if (!idsInputValue.trim()) {
				return;
			}

			btn.setButtonText("Syncing...");
			btn.setDisabled(true);

			try {
				await plugin.syncService.syncBooksByIds(idsInputValue);
			} finally {
				btn.setButtonText("Sync");
				btn.setDisabled(false);
			}
		});
	});
}

export function renderDebugSection(
	containerEl: HTMLElement,
	plugin: ObsidianHardcover,
	debugBookLimit: number,
	onDebugLimitChanged: (limit: number) => void,
	onSyncComplete: () => void,
): ButtonComponent {
	configureDebugInfoSetting(new Setting(containerEl), plugin);

	const testSyncButton = renderSyncButton({
		containerEl: containerEl,
		plugin: plugin,
		name: "Test sync",
		description:
			"Sync a limited number of books to test the plugin before doing a full sync. Remember to change or reset the timestamp accordingly, if set.",
		buttonText: "Run",
		debugLimit: debugBookLimit,
		showLimitInput: true,
		settingClassName: "obhc-test-sync",
		onDebugLimitChanged: onDebugLimitChanged,
		onSyncComplete: onSyncComplete,
	});

	configureSyncByIdSetting(new Setting(containerEl), plugin);

	return testSyncButton;
}

export function getDebugSectionDefinitions(
	plugin: ObsidianHardcover,
	debugBookLimit: number,
	onDebugLimitChanged: (limit: number) => void,
	onSyncComplete: () => void,
): SettingDefinition[] {
	return [
		{
			name: "",
			render: (setting) => configureDebugInfoSetting(setting, plugin),
		},
		getSyncButtonSettingDefinition({
			plugin,
			name: "Test sync",
			description:
				"Sync a limited number of books to test the plugin before doing a full sync. Remember to change or reset the timestamp accordingly, if set.",
			buttonText: "Run",
			debugLimit: debugBookLimit,
			showLimitInput: true,
			settingClassName: "obhc-test-sync",
			onDebugLimitChanged,
			onSyncComplete,
		}),
		{
			name: "Sync specific books",
			render: (setting) => configureSyncByIdSetting(setting, plugin),
		},
	];
}
