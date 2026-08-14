import { App, PluginSettingTab, Setting, SettingDefinitionItem } from "obsidian";
import { REPO_ISSUES_URL, REPO_URL } from "src/config/constants";
import ObsidianHardcover from "src/main";
import { getByPath, setByPath } from "src/utils/ObjectPath";
import { getDebugSectionDefinitions } from "./settings/DebugSettings";
import { getApiTokenSettingDefinition } from "./settings/ApiSettings";
import {
	getFolderSettingDefinition,
	getFilenameTemplateSettingDefinition,
} from "./settings/FileSettings";
import { getSyncSectionDefinitions } from "./settings/SyncSettings";
import { getStatusFilterSettingDefinition } from "./settings/StatusFilterSettings";
import { getLastSyncTimestampSettingDefinition } from "./settings/LastSyncSettings";
import { getGroupingSettingDefinitions } from "./settings/GroupingSettings";
import { getNoteTemplateSettingDefinitions } from "./settings/NoteTemplateSettings";
import { getStatusMappingSettingDefinition } from "./settings/StatusMappingSettings";

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

	getControlValue(key: string): unknown {
		return getByPath(this.plugin.settings, key);
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		setByPath(this.plugin.settings, key, value);
		await this.plugin.saveSettings();
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		this.containerEl.addClass("obhc-settings");

		return [
			{
				type: "group",
				heading: "Setup",
				items: [
					getApiTokenSettingDefinition(this.plugin),
					getFolderSettingDefinition(this.plugin),
					getStatusFilterSettingDefinition(this.plugin),
					getLastSyncTimestampSettingDefinition(this.plugin, () =>
						this.update(),
					),
				],
			},
			{
				type: "group",
				heading: "File Organization",
				items: [
					...getGroupingSettingDefinitions(this.plugin, () => this.update()),
					getFilenameTemplateSettingDefinition(this.plugin),
				],
			},
			{
				type: "group",
				heading: "Note Template",
				items: [
					...getNoteTemplateSettingDefinitions(this.plugin),
					getStatusMappingSettingDefinition(this.plugin),
				],
			},
			{
				type: "group",
				items: getSyncSectionDefinitions({
					plugin: this.plugin,
					name: "Sync Hardcover library",
					description:
						"Sync your Hardcover books to your notes. For testing, you can sync a limited number of books in the Debug section below.",
					buttonText: this.SYNC_CTA_LABEL,
					isMainCTA: true,
					onSyncComplete: () => this.update(),
					settingClassName: "obhc-sync-cta",
				}),
			},
			{
				type: "group",
				heading: "Debug",
				items: getDebugSectionDefinitions(
					this.plugin,
					this.debugBookLimit,
					(limit) => (this.debugBookLimit = limit),
					() => this.update(),
				),
			},
			{
				name: "",
				render: (setting) => this.renderSourceSection(setting),
			},
		];
	}

	private renderSourceSection(setting: Setting): void {
		setting.setClass("obhc-section-source");
		setting.controlEl.empty();

		const helpContainer = setting.controlEl.createDiv({
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
