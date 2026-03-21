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

	return renderSyncButton({
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
}
