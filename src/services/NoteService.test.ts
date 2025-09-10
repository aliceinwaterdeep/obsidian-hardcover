import { NoteService } from "./NoteService";
import { PluginSettings } from "../types";
import { DEFAULT_SETTINGS } from "../config/defaultSettings";
import { FileUtils } from "../utils/FileUtils";

jest.mock("obsidian", () => ({
	TFile: jest.fn(),
	Vault: jest.fn(),
}));

describe("NoteService", () => {
	let noteService: NoteService;
	let mockSettings: PluginSettings;

	beforeEach(() => {
		mockSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); // deep clone
		const fileUtils = new FileUtils();

		const mockVault = {} as any;
		const mockPlugin = { settings: mockSettings } as any;

		noteService = new NoteService(mockVault, fileUtils, mockPlugin);
	});

	describe("wikilink formatting", () => {
		const formatAsWikilinks = (values: string[], fieldKey: any) =>
			(noteService as any).formatAsWikilinks(values, fieldKey);

		test("formats authors as simple wikilinks", () => {
			const authors = ["Martha Wells", "Agatha Christie"];
			const result = formatAsWikilinks(authors, "authors");

			expect(result).toEqual(["[[Martha Wells]]", "[[Agatha Christie]]"]);
		});

		test("formats contributors with role", () => {
			const contributors = [
				"Stefano Cresti (Translator)",
				"John Smith (Narrator)",
			];
			const result = formatAsWikilinks(contributors, "contributors");

			expect(result).toEqual([
				"[[Stefano Cresti|Stefano Cresti (Translator)]]",
				"[[John Smith|John Smith (Narrator)]]",
			]);
		});

		test("handles contributors without roles", () => {
			const contributors = ["Stefano Cresti", "John Smith"];
			const result = formatAsWikilinks(contributors, "contributors");

			expect(result).toEqual(["[[Stefano Cresti]]", "[[John Smith]]"]);
		});

		test("formats series with position", () => {
			const series = ["The Murderbot Diaries #3", "Hercule Poirot #1"];
			const result = formatAsWikilinks(series, "series");

			expect(result).toEqual([
				"[[The Murderbot Diaries|The Murderbot Diaries #3]]",
				"[[Hercule Poirot|Hercule Poirot #1]]",
			]);
		});

		test("handles series without position", () => {
			const series = ["The Hunger Games", "Hercule Poirot"];
			const result = formatAsWikilinks(series, "series");

			expect(result).toEqual(["[[The Hunger Games]]", "[[Hercule Poirot]]"]);
		});
	});
});
