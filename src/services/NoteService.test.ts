import { NoteService } from "./NoteService";
import { PluginSettings } from "../types";
import { DEFAULT_SETTINGS } from "../config/defaultSettings";
import { FileUtils } from "../utils/FileUtils";
import { CONTENT_DELIMITER } from "../config/constants";

jest.mock("obsidian", () => ({
	TFile: jest.fn(),
	Vault: jest.fn(),
	normalizePath: (p: string) => p,
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

	describe("frontmatter preservation", () => {
		const baseMetadata = {
			hardcoverBookId: 123,
			title: "New Title",
			releaseDate: "2020-01-01",
			authors: ["Author One"],
			status: "reading",
			bodyContent: {},
		};

		const existingContent = `---
customKey: keep-me
status: old-status
---

# Old Title

${CONTENT_DELIMITER}

User section
`;

		function buildNoteService(
			preserveCustomFrontmatter: boolean,
			existingFile: any
		) {
			const mockVault = {
				cachedRead: jest.fn().mockResolvedValue(existingContent),
				modify: jest.fn().mockResolvedValue(undefined),
				rename: jest.fn().mockResolvedValue(undefined),
				getFileByPath: jest.fn().mockReturnValue(existingFile),
				getFolderByPath: jest.fn().mockReturnValue({}),
				createFolder: jest.fn().mockResolvedValue(undefined),
			} as any;

			let lastFrontmatter = frontmatterObject;
			let processCalled = false;

			const mockPlugin = {
				settings: {
					...JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
					preserveCustomFrontmatter,
				},
				app: {
					fileManager: {
						processFrontMatter: jest.fn(async (_file: any, cb: any) => {
							processCalled = true;
							lastFrontmatter = { ...frontmatterObject };
							cb(lastFrontmatter);
							frontmatterObject = lastFrontmatter;
						}),
					},
				},
			} as any;

			const fileUtils = new FileUtils();
			const service = new NoteService(mockVault, fileUtils, mockPlugin);
			return {
				service,
				mockVault,
				mockPlugin,
				getFrontmatter: () => lastFrontmatter,
				wasProcessCalled: () => processCalled,
			};
		}

		let frontmatterObject: Record<string, any>;

		beforeEach(() => {
			frontmatterObject = {
				customKey: "keep-me",
				status: "old-status",
				"2025 TBR": true,
			};
		});

		test("keeps custom frontmatter keys when preservation is enabled", async () => {
			const existingFile = {
				path: "HardcoverBooks/New Title (2020).md",
			} as any;
			const { service, mockVault, getFrontmatter, wasProcessCalled } =
				buildNoteService(true, existingFile);

			await service.updateNote(baseMetadata as any, existingFile);

			const updatedFrontmatter = getFrontmatter();
			expect(updatedFrontmatter.customKey).toBe("keep-me");
			expect(updatedFrontmatter["2025 TBR"]).toBe(true);
			expect(updatedFrontmatter.status).toBe("reading");
			const keyOrder = Object.keys(updatedFrontmatter);
			expect(keyOrder.slice(0, 3)).toEqual([
				"customKey",
				"status",
				"2025 TBR",
			]);
			expect(mockVault.modify).toHaveBeenCalled();
			expect(wasProcessCalled()).toBe(true);
		});

		test("removes custom frontmatter keys when preservation is disabled", async () => {
			const existingFile = {
				path: "HardcoverBooks/New Title (2020).md",
			} as any;
			const { service, mockVault, getFrontmatter, wasProcessCalled } =
				buildNoteService(false, existingFile);

			await service.updateNote(baseMetadata as any, existingFile);

			const updatedFrontmatter = getFrontmatter();
			expect(updatedFrontmatter.customKey).toBeUndefined();
			expect(updatedFrontmatter["2025 TBR"]).toBeUndefined();
			expect(updatedFrontmatter.status).toBe("reading");
			expect(mockVault.modify).toHaveBeenCalled();
			expect(wasProcessCalled()).toBe(true);
		});
	});

	describe("findNoteByHardcoverId", () => {
		test("finds note in nested folders", async () => {
			const mockFile = {
				path: "HardcoverBooks/Author/Title.md",
				extension: "md",
			} as any;

			const mockFolder = {
				children: [
					{
						children: [mockFile],
					},
				],
			};

			const mockVault = {
				getFolderByPath: jest.fn().mockReturnValue(mockFolder),
			} as any;

			const mockPlugin = {
				settings: {
					targetFolder: "HardcoverBooks",
				},
				app: {
					metadataCache: {
						getFileCache: jest.fn().mockReturnValue({
							frontmatter: { hardcoverBookId: 440947 },
						}),
					},
				},
			} as any;

			const service = new NoteService(mockVault, {} as any, mockPlugin);

			const result = await service.findNoteByHardcoverId(440947);

			expect(result).toBe(mockFile);
		});
	});
});
