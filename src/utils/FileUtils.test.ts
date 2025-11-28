import { FileUtils } from "./FileUtils";
import { DEFAULT_FIELDS_SETTINGS } from "../config/defaultSettings";

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
				"BookTitleWithBadChars"
			);
		});

		test("handles multiple spaces and trimming", () => {
			expect(fileUtils.sanitizeFilename("  Book   With    Spaces  ")).toBe(
				"Book With Spaces"
			);
		});
	});

	describe("processFilenameTemplate", () => {
		test("replaces all variables correctly", () => {
			const metadata = {
				title: MOCK_BOOK.title,
				releaseDate: MOCK_BOOK.releaseDate,
				authors: [MOCK_BOOK.author],
			};
			expect(
				fileUtils.processFilenameTemplate(
					"${title} by ${authors} (${year})",
					metadata,
					DEFAULT_FIELDS_SETTINGS
				)
			).toBe("All Systems Red by Martha Wells (2017).md");
		});

		test("handles missing data gracefully", () => {
			const metadata = { title: MOCK_BOOK.title };
			expect(
				fileUtils.processFilenameTemplate(
					"${title} (${year})",
					metadata,
					DEFAULT_FIELDS_SETTINGS
				)
			).toBe("All Systems Red.md");
		});

		test("handles invalid release date", () => {
			const metadata = { title: MOCK_BOOK.title, releaseDate: "invalid" };
			expect(
				fileUtils.processFilenameTemplate(
					"${title} (${year})",
					metadata,
					DEFAULT_FIELDS_SETTINGS
				)
			).toBe("All Systems Red.md");
		});

		test("handles custom property names", () => {
			const customSettings = {
				...DEFAULT_FIELDS_SETTINGS,
				title: { enabled: true, propertyName: "bookTitle" },
				authors: { enabled: true, propertyName: "bookAuthors" },
				releaseDate: { enabled: true, propertyName: "publicationDate" },
			};

			const metadata = {
				bookTitle: "All Systems Red",
				publicationDate: "2017-05-02",
				bookAuthors: ["Martha Wells"],
			};

			expect(
				fileUtils.processFilenameTemplate(
					"${title} by ${authors} (${year})",
					metadata,
					customSettings
				)
			).toBe("All Systems Red by Martha Wells (2017).md");
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
