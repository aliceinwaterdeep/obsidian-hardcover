import { Setting } from "obsidian";
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
	const { wikilinkSettings } = plugin.settings;

	WIKILINK_FIELDS.forEach(({ key, label }) => {
		new Setting(containerEl)
			.setName(label)
			.setDesc(`Format ${key} as [[wikilinks]]`)
			.addToggle((toggle) =>
				toggle.setValue(wikilinkSettings[key]).onChange(async (value) => {
					plugin.settings.wikilinkSettings[key] = value;
					await plugin.saveSettings();
				}),
			);
	});
}
