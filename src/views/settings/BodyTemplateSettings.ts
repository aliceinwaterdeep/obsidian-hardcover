import { Setting } from "obsidian";
import ObsidianHardcover from "src/main";
import { DEFAULT_BODY_TEMPLATE } from "src/config/defaultSettings";

export function renderBodyTemplateSettings(
	containerEl: HTMLElement,
	plugin: ObsidianHardcover,
): void {
	new Setting(containerEl).setDesc(
		"Customize the structure of your notes using variables. ⚠️ Note: Template content is regenerated on each sync, use this only for book data coming from Hardcover; add your personal notes below the --- delimiter in each note file.",
	);

	const editorContainer = containerEl.createDiv({
		cls: "obhc-template-editor",
	});

	const helpContainer = editorContainer.createDiv({
		cls: "obhc-template-variables-help",
	});

	helpContainer.createEl("p", {
		text: "Available variables:",
	});

	helpContainer.createEl("div", {
		text: "Book/Edition: {{bookTitle}}, {{editionTitle}}, {{bookCover}}, {{editionCover}}, {{bookReleaseDate}}, {{editionReleaseDate}}, {{bookAuthors}}, {{editionAuthors}}, {{bookContributors}}, {{editionContributors}}",
	});
	helpContainer.createEl("div", {
		text: "Book data: {{description}}, {{url}}, {{series}}, {{genres}}",
	});
	helpContainer.createEl("div", {
		text: "Edition data: {{publisher}}, {{isbn10}}, {{isbn13}}",
	});
	helpContainer.createEl("div", {
		text: "Your data: {{rating}}, {{status}}, {{review}}, {{quotes}}, {{lists}}",
	});
	helpContainer.createEl("div", {
		text: "Reading activity: {{firstReadStart}}, {{firstReadEnd}}, {{lastReadStart}}, {{lastReadEnd}}, {{totalReads}}, {{readYears}}",
	});

	const textareaContainer = editorContainer.createDiv({
		cls: "obhc-template-textarea",
	});
	const textarea = textareaContainer.createEl("textarea", {
		placeholder: DEFAULT_BODY_TEMPLATE,
		value: plugin.settings.bodyTemplate,
	});
	textarea.value = plugin.settings.bodyTemplate || DEFAULT_BODY_TEMPLATE;
	textarea.rows = 15;
	textarea.addEventListener("input", async () => {
		plugin.settings.bodyTemplate = textarea.value;
		await plugin.saveSettings();
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
