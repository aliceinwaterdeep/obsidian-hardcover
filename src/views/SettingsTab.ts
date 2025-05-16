import { App, ButtonComponent, PluginSettingTab } from "obsidian";
import { IS_DEV } from "src/config/constants";
import ObsidianHardcover from "src/main";
import { Accordion } from "./ui/Accordion";
import { renderDebugInfo, renderDevOptions } from "./settings/DebugSettings";
import { renderApiTokenSetting } from "./settings/ApiSettings";
import { renderFieldSettings } from "./settings/FieldsSettings";
import {
	renderFolderSetting,
	renderFilenameTemplateSetting,
} from "./settings/FileSettings";
import {
	addSyncButton,
	renderLastSyncTimestampSetting,
	renderSyncDelimiterNote,
} from "./settings/SyncSettings";

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

		containerEl.createEl("h2", { text: "Obsidian Hardcover Plugin" });

		// sync button
		this.addMainSyncButton(containerEl);

		renderSyncDelimiterNote(containerEl);

		// API section
		renderApiTokenSetting(containerEl, this.plugin, () =>
			this.updateSyncButtonsState()
		);

		// files section
		renderFolderSetting(containerEl, this.plugin, () =>
			this.updateSyncButtonsState()
		);
		renderFilenameTemplateSetting(containerEl, this.plugin);

		// sync section
		renderLastSyncTimestampSetting(containerEl, this.plugin, () =>
			this.display()
		);

		containerEl.createEl("hr");

		// fields section
		renderFieldSettings(containerEl, this.plugin, this.accordion);

		containerEl.createEl("hr");

		// debug section
		this.addDebugSection(containerEl);

		// show developer options in dev mode
		if (IS_DEV) {
			containerEl.createEl("h2", { text: "Developer Options" });
			renderDevOptions(containerEl, this.plugin);
		}
	}

	private addMainSyncButton(containerEl: HTMLElement): void {
		const button = addSyncButton({
			containerEl: containerEl,
			plugin: this.plugin,
			name: "Sync Hardcover library",
			description:
				"Sync your Hardcover books to Obsidian notes. For testing, you can sync a limited number of books in the Debug section below.",
			buttonText: this.SYNC_CTA_LABEL,
			isMainCTA: true,
			updateSyncButtonsState: () => this.updateSyncButtonsState(),
			onSyncComplete: () => this.display(),
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
			() => this.display()
		);

		this.syncButtons.push(button);
	}

	updateSyncButtonsState(): void {
		const targetFolder = this.plugin.settings.targetFolder;
		const isRootOrEmpty = this.plugin.fileUtils.isRootOrEmpty(targetFolder);

		const apiKey = this.plugin.settings.apiKey;
		const isApiKeyMissing = !apiKey || apiKey.trim() === "";

		const isDisabled = isRootOrEmpty || isApiKeyMissing;
		let tooltipText = "";

		if (isRootOrEmpty) {
			tooltipText =
				"Please specify a target folder. Using the vault root is not allowed";
		}

		if (isApiKeyMissing) {
			tooltipText = tooltipText
				? `${tooltipText}. Please enter your Hardcover API key`
				: "Please enter your Hardcover API key";
		}

		for (const button of this.syncButtons) {
			button.setDisabled(isDisabled);
			button.setTooltip(tooltipText);
		}
	}
}
