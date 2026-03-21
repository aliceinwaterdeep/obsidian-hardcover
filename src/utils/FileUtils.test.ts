import { FileUtils } from "./FileUtils";

jest.mock("obsidian", () => ({
	normalizePath: (path: string) => {
		// simple normalization for tests
		if (!path) return "";
		return path.replace(/\\/g, "/").replace(/\/+/g, "/");
	},
}));

describe("FileUtils", () => {
	const MOCK_BOOK = {
		title: "All Systems Red",
		author: "Martha Wells",
		releaseDate: "2017-05-02",
	};

	let fileUtils: FileUtils;

	beforeEach(() => {
		fileUtils = new FileUtils();
	});

	describe("sanitizeFilename", () => {
		test("removes illegal characters", () => {
			expect(fileUtils.sanitizeFilename("Book\\Title:With*Bad?Chars")).toBe(
				"BookTitleWithBadChars",
			);
		});

		test("handles multiple spaces and trimming", () => {
			expect(fileUtils.sanitizeFilename("  Book   With    Spaces  ")).toBe(
				"Book With Spaces",
			);
		});
	});

	describe("processFilenameTemplate", () => {
		test("replaces edition variables correctly", () => {
			const metadata = {
				editionTitle: MOCK_BOOK.title,
				editionReleaseDate: MOCK_BOOK.releaseDate,
				editionAuthors: [MOCK_BOOK.author],
			};
			expect(
				fileUtils.processFilenameTemplate(
					"{{editionTitle}} by {{editionAuthors}} ({{editionYear}})",
					metadata,
				),
			).toBe("All Systems Red by Martha Wells (2017).md");
		});

		test("replaces book variables correctly", () => {
			const metadata = {
				bookTitle: "The Book Title",
				bookAuthors: ["Book Author"],
				bookReleaseDate: "2026-01-01",
			};
			expect(
				fileUtils.processFilenameTemplate(
					"{{bookTitle}} by {{bookAuthors}} ({{bookYear}})",
					metadata,
				),
			).toBe("The Book Title by Book Author (2026).md");
		});

		test("handles missing data gracefully", () => {
			const metadata = {
				editionTitle: MOCK_BOOK.title,
			};
			expect(
				fileUtils.processFilenameTemplate(
					"{{editionTitle}} ({{editionYear}})",
					metadata,
				),
			).toBe("All Systems Red.md");
		});

		test("handles invalid release date", () => {
			const metadata = {
				editionTitle: MOCK_BOOK.title,
				editionReleaseDate: "invalid",
			};
			expect(
				fileUtils.processFilenameTemplate(
					"{{editionTitle}} ({{editionYear}})",
					metadata,
				),
			).toBe("All Systems Red.md");
		});

		test("handles multiple authors", () => {
			const metadata = {
				editionAuthors: ["Author One", "Author Two", "Author Three"],
			};
			expect(
				fileUtils.processFilenameTemplate("{{editionAuthors}}", metadata),
			).toBe("Author One, Author Two, Author Three.md");
		});

		test("handles empty authors array", () => {
			const metadata = {
				editionTitle: "Test Book",
				editionAuthors: [],
			};
			expect(
				fileUtils.processFilenameTemplate(
					"{{editionTitle}} by {{editionAuthors}}",
					metadata,
				),
			).toBe("Test Book.md");
		});
	});

	describe("isRootOrEmpty", () => {
		test("identifies root/empty paths correctly", () => {
			expect(fileUtils.isRootOrEmpty("")).toBe(true);
			expect(fileUtils.isRootOrEmpty("/")).toBe(true);
			expect(fileUtils.isRootOrEmpty("HardcoverBooks")).toBe(false);
		});
	});
});
