import { Setting, TextComponent } from "obsidian";
import { HARDCOVER_STATUS_MAP } from "src/config/statusMapping";
import ObsidianHardcover from "src/main";

const STATUS_FIELDS = Object.entries(HARDCOVER_STATUS_MAP).map(
	([id, label]) => ({
		id: Number(id),
		label,
	}),
);

export function renderStatusMappingSettings(
	containerEl: HTMLElement,
	plugin: ObsidianHardcover,
): void {
	const setting = new Setting(containerEl)
		.setName("Status mapping")
		.setDesc("Customize how Hardcover statuses appear in your notes")
		.setClass("obhc-section-status-mapping");

	const controlsContainer = setting.controlEl.createDiv({
		cls: "obhc-status-mapping-inputs",
	});

	for (const field of STATUS_FIELDS) {
		const inputContainer = controlsContainer.createDiv({
			cls: "obhc-status-mapping-item",
		});

		inputContainer.createSpan({
			text: field.label,
		});

		new TextComponent(inputContainer)
			.setPlaceholder(field.label)
			.setValue(plugin.settings.statusMapping[field.id] || "")
			.onChange(async (value) => {
				plugin.settings.statusMapping[field.id] = value || field.label;
				await plugin.saveSettings();
			});
	}
}
