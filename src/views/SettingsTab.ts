import { App, ButtonComponent, PluginSettingTab, Setting } from "obsidian";
import { REPO_ISSUES_URL, REPO_URL } from "src/config/constants";
import ObsidianHardcover from "src/main";
import { Accordion } from "./ui/Accordion";
import { renderDebugInfo, renderDevOptions } from "./settings/DebugSettings";
import { renderApiTokenSetting } from "./settings/ApiSettings";
import { renderFrontmatterFieldsSettings } from "./settings/FieldsSettings";
import {
	renderFolderSetting,
	renderFilenameTemplateSetting,
} from "./settings/FileSettings";
import {
	addSyncButton,
	renderLastSyncTimestampSetting,
	renderStatusFilterSetting,
	renderSyncInfoMessages,
} from "./settings/SyncSettings";
import { renderGroupingSettings } from "./settings/GroupingSettings";
import { renderWikilinkSettings } from "./settings/WikilinkSettings";
import { renderBodyTemplateSettings } from "./settings/BodyTemplateSettings";

export default class SettingsTab extends PluginSettingTab {
	plugin: ObsidianHardcover;
	SYNC_CTA_LABEL: string;
	debugBookLimit: number;
	accordion: Accordion;
	private syncButtons: ButtonComponent[] = [];

	constructor(app: App, plugin: ObsidianHardcover) {
		super(app, plugin);
		this.plugin = plugin;
		this.SYNC_CTA_LABEL = "Sync now";
		this.debugBookLimit = 1;
		this.accordion = new Accordion(plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("obhc-settings");

		this.syncButtons = [];

		//  SECTION 1: GENERAL
		new Setting(containerEl).setName("General").setHeading();

		renderApiTokenSetting(containerEl, this.plugin, () =>
			this.updateSyncButtonsState(),
		);
		renderFolderSetting(containerEl, this.plugin, () =>
			this.updateSyncButtonsState(),
		);
		renderStatusFilterSetting(containerEl, this.plugin);
		renderLastSyncTimestampSetting(containerEl, this.plugin, () =>
			this.display(),
		);

		containerEl.createEl("hr");

		//  SECTION 2: FRONTMATTER FIELDS
		new Setting(containerEl).setName("Frontmatter Fields").setHeading();

		new Setting(containerEl)
			.setName("Preserve custom frontmatter")
			.setDesc(
				"Keep any user-added frontmatter properties when syncing. Turn off to let Hardcover overwrite the entire frontmatter.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.preserveCustomFrontmatter)
					.onChange(async (value) => {
						this.plugin.settings.preserveCustomFrontmatter = value;
						await this.plugin.saveSettings();
					}),
			);

		renderFrontmatterFieldsSettings(containerEl, this.plugin, this.accordion);

		containerEl.createEl("hr");

		//  SECTION 3: WIKILINKS
		new Setting(containerEl).setName("Wikilinks").setHeading();
		new Setting(containerEl)
			.setDesc(
				"Format these fields as [[wikilinks]] both in frontmatter and note body,",
			)
			.setClass("obhc-section-description");

		renderWikilinkSettings(containerEl, this.plugin);

		containerEl.createEl("hr");

		//  SECTION 4: NOTE BODY TEMPLATE
		new Setting(containerEl).setName("Note Body Template").setHeading();

		renderBodyTemplateSettings(containerEl, this.plugin);

		containerEl.createEl("hr");

		//  SECTION 5: FILE ORGANIZATION
		new Setting(containerEl).setName("File Organization").setHeading();

		renderGroupingSettings(containerEl, this.plugin, () => this.display());
		renderFilenameTemplateSetting(containerEl, this.plugin);

		containerEl.createEl("hr");

		//  SECTION 6: SYNC
		this.addMainSyncButton(containerEl);
		renderSyncInfoMessages(containerEl);

		containerEl.createEl("hr");

		//  SECTION 7: DEBUG
		this.addDebugSection(containerEl);

		//  SECTION 8: DEV OPTIONS
		if (IS_DEV) {
			new Setting(containerEl).setName("Developer options").setHeading();
			renderDevOptions(containerEl, this.plugin);
		}

		containerEl.createEl("hr");

		//  SECTION 9: SOURCE
		this.addSourceSection(containerEl);
	}

	private addMainSyncButton(containerEl: HTMLElement): void {
		const button = addSyncButton({
			containerEl: containerEl,
			plugin: this.plugin,
			name: "Sync Hardcover library",
			description:
				"Sync your Hardcover books to your notes. For testing, you can sync a limited number of books in the Debug section below.",
			buttonText: this.SYNC_CTA_LABEL,
			isMainCTA: true,
			updateSyncButtonsState: () => this.updateSyncButtonsState(),
			onSyncComplete: () => this.display(),
			settingClassName: "obhc-sync-cta",
		});

		this.syncButtons.push(button);
	}

	private addDebugSection(containerEl: HTMLElement): void {
		const button = renderDebugInfo(
			containerEl,
			this.plugin,
			this.debugBookLimit,
			() => this.updateSyncButtonsState(),
			(limit) => (this.debugBookLimit = limit),
			() => this.display(),
		);

		this.syncButtons.push(button);
		this.updateSyncButtonsState();
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

	async updateSyncButtonsState(): Promise<void> {
		const validation = await this.plugin.validateSyncConstraints();
		const isDisabled = !validation.isValid;
		const tooltipText = validation.errorMessage || "";

		for (const button of this.syncButtons) {
			button.setDisabled(isDisabled);
			button.setTooltip(tooltipText);
		}
	}
}
