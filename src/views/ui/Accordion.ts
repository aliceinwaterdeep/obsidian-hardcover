import { setIcon, Setting } from "obsidian";
import ObsidianHardcover from "src/main";
import { FieldDefinition } from "src/types";

export class Accordion {
	private plugin: ObsidianHardcover;
	private expandedSections: Map<string, boolean> = new Map();

	constructor(plugin: ObsidianHardcover) {
		this.plugin = plugin;
	}

	renderAccordionField(containerEl: HTMLElement, field: FieldDefinition) {
		const fieldSettings = this.plugin.settings.fieldsSettings[field.key];
		const isEnabled = fieldSettings.enabled;

		const accordionContainer = containerEl.createDiv({ cls: "obhc-accordion" });

		const header = accordionContainer.createDiv({
			cls: "obhc-accordion-header",
		});

		const icon = header.createSpan({ cls: "obhc-accordion-icon" });

		setIcon(icon, "chevron-right");

		header.createSpan({ text: field.name });

		if (field.key !== "title") {
			const toggleSetting = new Setting(header);
			toggleSetting.addToggle((toggle) => {
				toggle.setValue(isEnabled).onChange(async (value) => {
					this.plugin.settings.fieldsSettings[field.key].enabled = value;
					await this.plugin.saveSettings();

					if (content) {
						if (value) {
							content.removeClass("obhc-disabled-settings");
						} else {
							content.addClass("obhc-disabled-settings");
						}
					}
				});
			});

			toggleSetting.settingEl.addClass("obhc-field-toggle");
			toggleSetting.nameEl.remove();
			toggleSetting.descEl.remove();
		}

		const contentWrapper = accordionContainer.createDiv({
			cls: "obhc-accordion-content",
		});
		const content = contentWrapper.createDiv({
			cls: isEnabled ? "" : "obhc-disabled-settings",
		});

		// check if this section was previously expanded
		const isExpanded = this.expandedSections.get(field.key) || false;

		// set expanded state if needed
		if (isExpanded) {
			icon.classList.add("expanded");
			contentWrapper.classList.add("expanded");
		}

		header.addEventListener("click", (e) => {
			if (
				e.target &&
				(e.target as HTMLElement).closest(".checkbox-container")
			) {
				return;
			}

			const newExpandedState = !contentWrapper.classList.contains("expanded");
			icon.classList.toggle("expanded");
			contentWrapper.classList.toggle("expanded");

			// save the new state
			this.expandedSections.set(field.key, newExpandedState);
		});

		return content;
	}
}
