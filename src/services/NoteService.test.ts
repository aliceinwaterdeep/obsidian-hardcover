import { NoteService } from "./NoteService";
import { PluginSettings } from "../types";
import { DEFAULT_SETTINGS } from "../config/defaultSettings";
import { FileUtils } from "../utils/FileUtils";
import { CONTENT_DELIMITER } from "../config/constants";

jest.mock("obsidian", () => ({
	TFile: jest.fn(),
	Vault: jest.fn(),
	normalizePath: (p: string) => p,
	MetadataCache: jest.fn(),
	Notice: jest.fn(),
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

	describe("frontmatter preservation", () => {
		const baseMetadata = {
			hardcoverBookId: 123,
			frontmatter: {
				title: "New Title",
				releaseDate: "2020-01-01",
				authors: ["Author One"],
				status: ["reading"],
			},
			variables: {
				editionTitle: "New Title",
				editionReleaseDate: "2020-01-01",
				editionAuthors: ["Author One"],
				status: ["reading"],
			},
		};

		const existingContent = `---
customKey: keep-me
status: old-status
2025 TBR: true
---

# Old Title

${CONTENT_DELIMITER}

User section
`;

		function buildNoteService(
			preserveCustomFrontmatter: boolean,
			existingFile: any,
		) {
			let frontmatterObject: Record<string, any> = {
				customKey: "keep-me",
				status: "old-status",
				"2025 TBR": true,
			};

			const mockVault = {
				cachedRead: jest.fn().mockResolvedValue(existingContent),
				modify: jest.fn().mockResolvedValue(undefined),
				rename: jest.fn().mockResolvedValue(undefined),
				getFileByPath: jest.fn().mockReturnValue(existingFile),
				getFolderByPath: jest.fn().mockReturnValue({}),
				createFolder: jest.fn().mockResolvedValue(undefined),
			} as any;

			let lastFrontmatter = { ...frontmatterObject };

			const mockPlugin = {
				settings: {
					...JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
					preserveCustomFrontmatter,
				},
				app: {
					metadataCache: {
						getFileCache: jest.fn().mockReturnValue({
							frontmatter: { ...frontmatterObject },
							frontmatterPosition: undefined,
						}),
					},
					fileManager: {
						processFrontMatter: jest.fn(async (_file: any, cb: any) => {
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
			};
		}

		test("keeps custom frontmatter keys when preservation is enabled", async () => {
			const existingFile = {
				path: "HardcoverBooks/New Title (2020).md",
			} as any;
			const { service, getFrontmatter } = buildNoteService(true, existingFile);

			await service.updateNote(baseMetadata as any, existingFile);

			const updatedFrontmatter = getFrontmatter();

			expect(updatedFrontmatter.customKey).toBe("keep-me");
			expect(updatedFrontmatter["2025 TBR"]).toBe(true);
			expect(updatedFrontmatter.status).toEqual(["reading"]);

			const keyOrder = Object.keys(updatedFrontmatter);
			const statusIndex = keyOrder.indexOf("status");
			const customKeyIndex = keyOrder.indexOf("customKey");
			const spacedKeyIndex = keyOrder.indexOf("2025 TBR");

			expect(statusIndex).toBeLessThan(customKeyIndex);
			expect(statusIndex).toBeLessThan(spacedKeyIndex);
			expect(keyOrder[0]).toBe("hardcoverBookId");
		});

		test("removes custom frontmatter keys when preservation is disabled", async () => {
			const existingFile = {
				path: "HardcoverBooks/New Title (2020).md",
			} as any;
			const { service, getFrontmatter } = buildNoteService(false, existingFile);

			await service.updateNote(baseMetadata as any, existingFile);

			const updatedFrontmatter = getFrontmatter();

			expect(updatedFrontmatter.customKey).toBeUndefined();
			expect(updatedFrontmatter["2025 TBR"]).toBeUndefined();
			expect(updatedFrontmatter.status).toEqual(["reading"]);
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

		test("returns null when note not found", async () => {
			const mockFolder = {
				children: [],
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
						getFileCache: jest.fn().mockReturnValue(null),
					},
				},
			} as any;

			const service = new NoteService(mockVault, {} as any, mockPlugin);

			const result = await service.findNoteByHardcoverId(999999);

			expect(result).toBeNull();
		});
	});
});
