import { ButtonComponent, Setting } from "obsidian";
import ObsidianHardcover from "src/main";
import { renderSyncButton } from "./SyncSettings";

export function renderDebugSection(
	containerEl: HTMLElement,
	plugin: ObsidianHardcover,
	debugBookLimit: number,
	onDebugLimitChanged: (limit: number) => void,
	onSyncComplete: () => void,
): ButtonComponent {
	new Setting(containerEl).setDesc(
		`Hardcover User ID: ${plugin.settings.userId || "Not set"} - Total Hardcover Books Count: ${plugin.settings.booksCount || "Unknown"}`,
	);

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

	renderSyncByIdSetting(containerEl, plugin);

	return testSyncButton;
}

function renderSyncByIdSetting(
	containerEl: HTMLElement,
	plugin: ObsidianHardcover,
): void {
	let idsInputValue = "";

	const setting = new Setting(containerEl)
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
