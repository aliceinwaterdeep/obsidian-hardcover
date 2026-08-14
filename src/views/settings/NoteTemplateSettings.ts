import { SettingDefinition } from "obsidian";
import ObsidianHardcover from "src/main";
import { DEFAULT_NOTE_TEMPLATE } from "src/config/defaultSettings";
import { getWikilinkSettingDefinition } from "./WikilinkSettings";

export function getNoteTemplateSettingDefinitions(
	plugin: ObsidianHardcover,
): SettingDefinition[] {
	return [
		{
			name: "",
			render: (setting) => {
				setting.descEl.createSpan({
					text: "Customize the structure of your notes including YAML frontmatter and body content. Do not remove the enclosing `---` from the frontmatter or the template will be invalid.",
				});
				setting.descEl.createEl("br");
				setting.descEl.createEl("br");
				setting.descEl.createSpan({
					text: "⚠️ On each sync, the plugin regenerates note content using fresh data from Hardcover. Values in {{ }} placeholders are updated automatically. Custom properties you add to this template will appear in all notes. Personal notes added below the delimiter in individual note files are never modified.",
				});
			},
		},
		{
			name: "",
			render: (setting) => {
				setting.setClass("obhc-section-template-editor");

				const editorContainer = setting.controlEl.createDiv({
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
				textarea.addEventListener("input", () => {
					void (async () => {
						plugin.settings.noteTemplate = textarea.value;
						await plugin.saveSettings();
					})();
				});
			},
		},
		{
			name: "Available variables",
			render: (setting) => {
				setting.descEl.createSpan({
					text: "Book/Edition: {{bookTitle}}, {{editionTitle}}, {{bookCover}}, {{editionCover}}, {{bookReleaseDate}}, {{editionReleaseDate}}, {{bookAuthors}}, {{editionAuthors}}, {{bookContributors}}, {{editionContributors}}",
				});
				setting.descEl.createEl("br");
				setting.descEl.createEl("br");
				setting.descEl.createSpan({
					text: "Book data: {{description}}, {{url}}, {{series}}, {{genres}}",
				});
				setting.descEl.createEl("br");
				setting.descEl.createEl("br");
				setting.descEl.createSpan({
					text: "Edition data: {{publisher}}, {{isbn10}}, {{isbn13}}",
				});
				setting.descEl.createEl("br");
				setting.descEl.createEl("br");
				setting.descEl.createSpan({
					text: "Your data: {{rating}}, {{status}}, {{review}}, {{quotes}}, {{lists}}",
				});
				setting.descEl.createEl("br");
				setting.descEl.createEl("br");
				setting.descEl.createSpan({
					text: "Reading activity: {{firstReadStart}}, {{firstReadEnd}}, {{lastReadStart}}, {{lastReadEnd}}, {{totalReads}}, {{readYears}}",
				});
			},
		},
		{
			name: "",
			desc: "⚠️ For array fields like {{authors}}, {{contributors}}, {{series}}, {{publisher}}, {{genres}} and {{lists}}, use the Wikilinks settings below to enable [[wikilinks]] formatting. Writing [[{{authors}}]] in the template won't work as expected as they may contain multiple values.",
		},
		{
			name: "Preserve additional custom properties",
			desc: "Keep any additional properties you manually add to your notes (not in the template above).",
			control: {
				type: "toggle",
				key: "preserveCustomFrontmatter",
			},
		},
		{
			name: "Keep empty headings",
			desc: "Keep headings in the note even when the content below them is empty",
			control: {
				type: "toggle",
				key: "keepEmptyHeadings",
			},
		},
		{
			name: "Quotes format",
			desc: "How to format quotes in the note body",
			control: {
				type: "dropdown",
				key: "quotesFormat",
				options: {
					blockquote: "Blockquote (> quote)",
					callout: "Callout (> [!quote])",
				},
			},
		},
		getWikilinkSettingDefinition(plugin),
	];
}
