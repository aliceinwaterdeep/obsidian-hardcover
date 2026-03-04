import { Setting } from "obsidian";
import ObsidianHardcover from "src/main";
import { DEFAULT_BODY_TEMPLATE } from "src/config/defaultSettings";

const TEMPLATE_VARIABLES = [
	{
		category: "Book/Edition fields",
		variables: [
			"{{bookTitle}}, {{editionTitle}}",
			"{{bookCover}}, {{editionCover}}",
			"{{bookReleaseDate}}, {{editionReleaseDate}}",
			"{{bookAuthors}}, {{editionAuthors}}",
			"{{bookContributors}}, {{editionContributors}}",
		],
	},
	{
		category: "Book only fields",
		variables: ["{{description}}, {{url}}, {{series}}, {{genres}}"],
	},
	{
		category: "Edition only fields",
		variables: ["{{publisher}}, {{isbn10}}, {{isbn13}}"],
	},
	{
		category: "User data fields",
		variables: ["{{rating}}, {{status}}, {{review}}, {{quotes}}, {{lists}}"],
	},
	{
		category: "Reading activity fields",
		variables: [
			"{{firstReadStart}}, {{firstReadEnd}}",
			"{{lastReadStart}}, {{lastReadEnd}}",
			"{{totalReads}}, {{readYears}}",
		],
	},
];

export function renderBodyTemplateSettings(
	containerEl: HTMLElement,
	plugin: ObsidianHardcover,
): void {
	new Setting(containerEl)
		.setName("Body content template")
		.setDesc("Customize the structure of your book notes using variables")
		.addTextArea((text) => {
			text
				.setPlaceholder(DEFAULT_BODY_TEMPLATE)
				.setValue(plugin.settings.bodyTemplate)
				.onChange(async (value) => {
					plugin.settings.bodyTemplate = value;
					await plugin.saveSettings();
				});

			text.inputEl.rows = 10;
			text.inputEl.cols = 50;
		});

	const helpContainer = containerEl.createDiv({
		cls: "obhc-template-help",
	});

	helpContainer.createEl("strong", {
		text: "Available variables:",
	});

	TEMPLATE_VARIABLES.forEach(({ category, variables }) => {
		helpContainer.createEl("div", {
			text: category,
			cls: "obhc-template-category",
		});
		variables.forEach((varList) => {
			helpContainer.createEl("div", {
				text: varList,
				cls: "obhc-template-variables",
			});
		});
	});

	new Setting(containerEl)
		.setName("Quotes format")
		.setDesc("How to format quotes in the note body")
		.addDropdown((dropdown) =>
			dropdown
				.addOption("blockquote", "Blockquote (> quote)")
				.addOption("callout", "Callout (> [!quote])")
				.setValue(plugin.settings.quotesFormat)
				.onChange(async (value: "blockquote" | "callout") => {
					plugin.settings.quotesFormat = value;
					await plugin.saveSettings();
				}),
		);
}
