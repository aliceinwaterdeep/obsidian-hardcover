import { Setting, ToggleComponent } from "obsidian";
import ObsidianHardcover from "src/main";

const WIKILINK_FIELDS = [
	{
		key: "authors",
		label: "Authors",
	},
	{
		key: "contributors",
		label: "Contributors",
	},
	{
		key: "series",
		label: "Series",
	},
	{
		key: "publisher",
		label: "Publisher",
	},
	{
		key: "genres",
		label: "Genres",
	},
	{
		key: "lists",
		label: "Lists",
	},
] as const;

export function renderWikilinkSettings(
	containerEl: HTMLElement,
	plugin: ObsidianHardcover,
): void {
	const setting = new Setting(containerEl)
		.setName("Wikilinks")
		.setDesc(
			"Format these fields as [[wikilinks]] both in frontmatter and note body",
		)
		.setClass("obhc-section-wikilinks");

	const controlsContainer = setting.controlEl.createDiv({
		cls: "obhc-wikilink-toggles",
	});

	for (const field of WIKILINK_FIELDS) {
		const toggleContainer = controlsContainer.createDiv({
			cls: "obhc-wikilink-toggle-item",
		});

		toggleContainer.createSpan({
			text: field.label,
		});

		new ToggleComponent(toggleContainer)
			.setValue(plugin.settings.wikilinkSettings[field.key])
			.onChange(async (value) => {
				plugin.settings.wikilinkSettings[field.key] = value;
				await plugin.saveSettings();
			});
	}
}
