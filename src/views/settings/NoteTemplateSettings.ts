import { setIcon, Setting } from "obsidian";
import ObsidianHardcover from "src/main";
import { DEFAULT_NOTE_TEMPLATE } from "src/config/defaultSettings";
import { renderWikilinkSettings } from "./WikilinkSettings";

export function renderNoteTemplateSettings(
	containerEl: HTMLElement,
	plugin: ObsidianHardcover,
): void {
	const setting = new Setting(containerEl);
	setting.descEl.innerHTML =
		"Customize the structure of your notes including YAML frontmatter and body content. Do not remove the enclosing `---` from the frontmatter or the template will be invalid.<br><br> ⚠️ Template content is regenerated on each sync, use this only for book data coming from Hardcover; add your personal notes below the <!-- obsidian-hardcover-plugin-end --> delimiter in each note file.";

	const editorContainer = containerEl.createDiv({
		cls: "obhc-template-editor",
	});

	const textareaContainer = editorContainer.createDiv({
		cls: "obhc-template-textarea",
	});

	const textarea = textareaContainer.createEl("textarea", {
		placeholder: DEFAULT_NOTE_TEMPLATE,
		value: plugin.settings.noteTemplate,
	});
	textarea.value = plugin.settings.noteTemplate || DEFAULT_NOTE_TEMPLATE;
	textarea.rows = 20;
	textarea.addEventListener("input", async () => {
		plugin.settings.noteTemplate = textarea.value;
		await plugin.saveSettings();
	});

	const hsetting = new Setting(containerEl);
	hsetting.setName("Available variables");
	hsetting.descEl.innerHTML =
		"Book/Edition: {{bookTitle}}, {{editionTitle}}, {{bookCover}}, {{editionCover}}, {{bookReleaseDate}}, {{editionReleaseDate}}, {{bookAuthors}}, {{editionAuthors}}, {{bookContributors}}, {{editionContributors}}" +
		"<br><br>" +
		"Book data: {{description}}, {{url}}, {{series}}, {{genres}}" +
		"<br><br>" +
		"Edition data: {{publisher}}, {{isbn10}}, {{isbn13}}" +
		"<br><br>" +
		"Your data: {{rating}}, {{status}}, {{review}}, {{quotes}}, {{lists}}" +
		"<br><br>" +
		"Reading activity: {{firstReadStart}}, {{firstReadEnd}}, {{lastReadStart}}, {{lastReadEnd}}, {{totalReads}}, {{readYears}}";

	new Setting(containerEl).setDesc(
		"⚠️ For array fields like {{authors}}, {{contributors}}, {{series}}, {{publisher}}, {{genres}} and {{lists}}, " +
			"use the Wikilinks settings below to enable [[wikilinks]] formatting. " +
			"Writing [[{{authors}}]] in the template won't work as expected as they may contain multiple values.",
	);

	new Setting(containerEl)
		.setName("Preserve additional custom properties")
		.setDesc("Keep any additional properties you manually add to your notes.")
		.addToggle((toggle) =>
			toggle
				.setValue(plugin.settings.preserveCustomFrontmatter)
				.onChange(async (value) => {
					plugin.settings.preserveCustomFrontmatter = value;
					await plugin.saveSettings();
				}),
		);

	new Setting(containerEl)
		.setName("Keep empty headings")
		.setDesc(
			"Keep headings in the note even when the content below them is empty",
		)
		.addToggle((toggle) =>
			toggle
				.setValue(plugin.settings.keepEmptyHeadings)
				.onChange(async (value) => {
					plugin.settings.keepEmptyHeadings = value;
					await plugin.saveSettings();
				}),
		);

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

	renderWikilinkSettings(containerEl, plugin);
}
