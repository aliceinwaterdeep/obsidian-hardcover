import { SettingDefinitionGroup } from "obsidian";

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

export function getWikilinkGroupDefinition(): SettingDefinitionGroup {
	return {
		type: "group",
		heading: "Wikilinks",
		items: [
			{
				name: "",
				desc: "Format these fields as [[wikilinks]] both in frontmatter and note body",
			},
			...WIKILINK_FIELDS.map((field) => ({
				name: field.label,
				control: {
					type: "toggle" as const,
					key: `wikilinkSettings.${field.key}`,
				},
			})),
		],
	};
}
