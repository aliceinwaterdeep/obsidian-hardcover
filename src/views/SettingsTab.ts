import { App, PluginSettingTab, Setting } from "obsidian";
import { REPO_ISSUES_URL, REPO_URL } from "src/config/constants";
import ObsidianHardcover from "src/main";
import { renderDebugSection } from "./settings/DebugSettings";
import { renderApiTokenSetting } from "./settings/ApiSettings";
import {
	renderFolderSetting,
	renderFilenameTemplateSetting,
} from "./settings/FileSettings";
import { renderSyncSection } from "./settings/SyncSettings";
import { renderStatusFilterSetting } from "./settings/StatusFilterSettings";
import { renderLastSyncTimestampSetting } from "./settings/LastSyncSettings";
import { renderGroupingSettings } from "./settings/GroupingSettings";
import { renderNoteTemplateSettings } from "./settings/NoteTemplateSettings";
import { renderStatusMappingSettings } from "./settings/StatusMappingSettings";

export default class SettingsTab extends PluginSettingTab {
	plugin: ObsidianHardcover;
	SYNC_CTA_LABEL: string;
	debugBookLimit: number;

	constructor(app: App, plugin: ObsidianHardcover) {
		super(app, plugin);
		this.plugin = plugin;
		this.SYNC_CTA_LABEL = "Sync now";
		this.debugBookLimit = 1;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("obhc-settings");

		//  SECTION 1: GENERAL
		new Setting(containerEl).setName("Setup").setHeading();

		renderApiTokenSetting(containerEl, this.plugin);
		renderFolderSetting(containerEl, this.plugin);
		renderStatusFilterSetting(containerEl, this.plugin);
		renderLastSyncTimestampSetting(containerEl, this.plugin, () =>
			this.display(),
		);

		containerEl.createEl("hr");

		//  SECTION 2: FILE ORGANIZATION
		new Setting(containerEl).setName("File Organization").setHeading();

		renderGroupingSettings(containerEl, this.plugin, () => this.display());
		renderFilenameTemplateSetting(containerEl, this.plugin);

		containerEl.createEl("hr");

		//  SECTION 3: NOTE TEMPLATE
		new Setting(containerEl).setName("Note Template").setHeading();

		renderNoteTemplateSettings(containerEl, this.plugin);
		renderStatusMappingSettings(containerEl, this.plugin);

		containerEl.createEl("hr");

		//  SECTION 4: SYNC
		renderSyncSection({
			containerEl: containerEl,
			plugin: this.plugin,
			name: "Sync Hardcover library",
			description:
				"Sync your Hardcover books to your notes. For testing, you can sync a limited number of books in the Debug section below.",
			buttonText: this.SYNC_CTA_LABEL,
			isMainCTA: true,
			onSyncComplete: () => this.display(),
			settingClassName: "obhc-sync-cta",
		});

		containerEl.createEl("hr");

		//  SECTION 5: DEBUG
		new Setting(containerEl).setName("Debug").setHeading();

		renderDebugSection(
			containerEl,
			this.plugin,
			this.debugBookLimit,
			(limit) => (this.debugBookLimit = limit),
			() => this.display(),
		);

		containerEl.createEl("hr");

		//  SECTION 7: SOURCE
		this.addSourceSection(containerEl);
	}

	private addSourceSection(containerEl: HTMLElement): void {
		const helpContainer = containerEl.createDiv({
			cls: "obhc-source-container",
		});

		helpContainer.createEl("a", {
			text: "👩🏻‍💻 Source code",
			href: REPO_URL,
			cls: "obhc-source-link",
		});

		helpContainer.createEl("a", {
			text: "🐛 Report issue",
			href: REPO_ISSUES_URL,
			cls: "obhc-source-link",
		});
	}
}
