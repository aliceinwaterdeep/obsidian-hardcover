import { SyncService } from "./SyncService";
import { DEFAULT_SETTINGS } from "../config/defaultSettings";

jest.mock("obsidian", () => ({
	Notice: jest.fn().mockImplementation(() => ({
		hide: jest.fn(),
		setMessage: jest.fn(),
	})),
	TFile: jest.fn(),
}));

describe("SyncService", () => {
	describe("syncBooksByIds", () => {
		let mockPlugin: any;
		let syncService: SyncService;
		let noteIndex: Map<number, any>;

		beforeEach(() => {
			noteIndex = new Map();

			mockPlugin = {
				settings: {
					...JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
					userId: 42,
					lastSyncTimestamp: "2024-01-01T00:00:00.000Z",
				},
				fileUtils: {
					isRootOrEmpty: jest.fn().mockReturnValue(false),
					normalizeText: (t: string) => t,
				},
				hardcoverAPI: {
					fetchUserId: jest.fn(),
					fetchUserLists: jest.fn().mockResolvedValue([]),
					fetchBooksByIds: jest.fn().mockResolvedValue([
						{ book_id: 1, book: { title: "Book One" } },
						{ book_id: 2, book: { title: "Book Two" } },
					]),
				},
				noteService: {
					buildNoteIndex: jest.fn().mockReturnValue(noteIndex),
					createNote: jest.fn().mockResolvedValue(undefined),
					updateNote: jest.fn().mockResolvedValue(undefined),
				},
				metadataService: {
					buildMetadata: jest.fn().mockReturnValue({
						metadata: { hardcoverBookId: 1, frontmatter: {} },
						rawContributors: [],
					}),
				},
				saveSettings: jest.fn().mockResolvedValue(undefined),
			};

			syncService = new SyncService(mockPlugin);
		});

		test("does not sync when target folder is root/empty", async () => {
			mockPlugin.fileUtils.isRootOrEmpty.mockReturnValue(true);

			await syncService.syncBooksByIds("1, 2");

			expect(mockPlugin.hardcoverAPI.fetchBooksByIds).not.toHaveBeenCalled();
		});

		test("does not call the API when no valid IDs are provided", async () => {
			await syncService.syncBooksByIds("abc, , notanumber");

			expect(mockPlugin.hardcoverAPI.fetchBooksByIds).not.toHaveBeenCalled();
		});

		test("parses, trims, and dedupes comma-separated IDs before fetching", async () => {
			await syncService.syncBooksByIds(" 1, 2, 2, 1 ");

			expect(mockPlugin.hardcoverAPI.fetchBooksByIds).toHaveBeenCalledWith(
				42,
				[1, 2],
			);
		});

		test("creates a note for a book not already in the index, updates one that is", async () => {
			noteIndex.set(2, { path: "existing.md" });

			await syncService.syncBooksByIds("1, 2");

			expect(mockPlugin.noteService.createNote).toHaveBeenCalledTimes(1);
			expect(mockPlugin.noteService.updateNote).toHaveBeenCalledTimes(1);
		});

		test("does not update lastSyncTimestamp after syncing by id", async () => {
			await syncService.syncBooksByIds("1, 2");

			expect(mockPlugin.settings.lastSyncTimestamp).toBe(
				"2024-01-01T00:00:00.000Z",
			);
			expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
		});

		test("fetches books without a status filter, regardless of settings.statusFilter", async () => {
			mockPlugin.settings.statusFilter = [1];

			await syncService.syncBooksByIds("1, 2");

			// fetchBooksByIds only ever receives (userId, bookIds) - no status arg
			expect(mockPlugin.hardcoverAPI.fetchBooksByIds).toHaveBeenCalledWith(
				42,
				[1, 2],
			);
		});
	});
});
