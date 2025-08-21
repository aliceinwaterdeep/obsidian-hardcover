import { App, ButtonComponent, PluginSettingTab } from "obsidian";
import { IS_DEV, REPO_ISSUES_URL, REPO_URL } from "src/config/constants";
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
	renderSyncInfoMessages,
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

		// config section
		renderApiTokenSetting(containerEl, this.plugin, () =>
			this.updateSyncButtonsState()
		);
		renderFolderSetting(containerEl, this.plugin, () =>
			this.updateSyncButtonsState()
		);
		renderFilenameTemplateSetting(containerEl, this.plugin);
		renderLastSyncTimestampSetting(containerEl, this.plugin, () =>
			this.display()
		);

		containerEl.createEl("hr");

		// fields section
		renderFieldSettings(containerEl, this.plugin, this.accordion);

		containerEl.createEl("hr");

		// sync button
		this.addMainSyncButton(containerEl);

		renderSyncInfoMessages(containerEl);

		containerEl.createEl("hr");

		// debug section
		this.addDebugSection(containerEl);

		// show developer options in dev mode
		if (IS_DEV) {
			containerEl.createEl("h2", { text: "Developer Options" });
			renderDevOptions(containerEl, this.plugin);
		}

		containerEl.createEl("hr");

		this.addSourceSection(containerEl);
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
			() => this.display()
		);

		this.syncButtons.push(button);
		this.updateSyncButtonsState();
	}

	private addSourceSection(containerEl: HTMLElement): void {
		const helpContainer = containerEl.createDiv({
			cls: "obhc-source-container",
		});

		helpContainer.createEl("a", {
			text: "👩🏻‍💻 Source Code",
			href: REPO_URL,
			cls: "obhc-source-link",
		});

		helpContainer.createEl("a", {
			text: "🐛 Report Issue",
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
