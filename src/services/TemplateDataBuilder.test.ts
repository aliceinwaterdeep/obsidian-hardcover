import { TemplateDataBuilder } from "./TemplateDataBuilder";
import { FileUtils } from "../utils/FileUtils";
import { DEFAULT_SETTINGS } from "../config/defaultSettings";
import { HardcoverUserBook } from "../types";

jest.mock("obsidian", () => ({
	Notice: jest.fn(),
	parseYaml: (yamlString: string) => {
		return {
			title: "{{editionTitle}}",
			authors: "{{editionAuthors}}",
			rating: "{{rating}}",
			status: "{{status}}",
		};
	},
}));

describe("TemplateDataBuilder", () => {
	let builder: TemplateDataBuilder;
	let mockSettings: any;
	let fileUtils: FileUtils;

	const MOCK_USER_BOOK: HardcoverUserBook = {
		book_id: 12345,
		status_id: 3,
		rating: 5,
		review_markdown: "Great book",
		review_raw: null,
		updated_at: "2023-01-15T00:00:00Z",
		book: {
			title: "Book Title",
			slug: "book-title",
			release_date: "2020-01-01",
			description: "A book description.",
			cached_image: { url: "https://example.com/book-cover.jpg" },
			cached_contributors: [
				{ author: { name: "Book Author" }, contribution: "Author" },
			],
			book_series: [],
			cached_tags: {
				Genre: [{ tag: "Fiction", count: 1 }],
			},
		},
		edition: {
			title: "Edition Title",
			release_date: "2021-01-01",
			cached_image: { url: "https://example.com/edition-cover.jpg" },
			cached_contributors: [
				{ author: { name: "Edition Author" }, contribution: "Author" },
				{ author: { name: "Translator Name" }, contribution: "Translator" },
			],
			publisher: { name: "Publisher Name" },
			isbn_10: "1234567890",
			isbn_13: "9781234567890",
		},
		user_book_reads: [
			{
				started_at: "2023-01-01T00:00:00Z",
				finished_at: "2023-01-15T00:00:00Z",
			},
		],
		reading_journals: [{ entry: "Quote one" }, { entry: "Quote two" }],
	} as any;

	beforeEach(() => {
		mockSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
		fileUtils = new FileUtils();
		builder = new TemplateDataBuilder(mockSettings, fileUtils);
	});

	describe("variable extraction", () => {
		test("extracts book and edition titles", () => {
			const { variables } = builder.build(MOCK_USER_BOOK);

			expect(variables.bookTitle).toBe("Book Title");
			expect(variables.editionTitle).toBe("Edition Title");
		});

		test("extracts book and edition covers", () => {
			const { variables } = builder.build(MOCK_USER_BOOK);

			expect(variables.bookCover).toBe("https://example.com/book-cover.jpg");
			expect(variables.editionCover).toBe(
				"https://example.com/edition-cover.jpg",
			);
		});

		test("extracts book and edition authors as arrays", () => {
			const { variables } = builder.build(MOCK_USER_BOOK);

			expect(variables.bookAuthors).toEqual(["Book Author"]);
			expect(variables.editionAuthors).toEqual(["Edition Author"]);
		});

		test("extracts contributors with roles", () => {
			const { variables } = builder.build(MOCK_USER_BOOK);

			expect(variables.editionContributors).toEqual([
				"Translator Name (Translator)",
			]);
		});

		test("extracts rating with /5", () => {
			const { variables } = builder.build(MOCK_USER_BOOK);

			expect(variables.rating).toBe("5/5");
		});

		test("extracts status as array", () => {
			const { variables } = builder.build(MOCK_USER_BOOK);

			expect(variables.status).toEqual(["Read"]);
		});

		test("extracts paused status as array", () => {
			const pausedBook = { ...MOCK_USER_BOOK, status_id: 4 };
			const { variables } = builder.build(pausedBook);

			expect(variables.status).toEqual(["Paused"]);
		});

		test("extracts review from review_markdown, stripping spoiler markers", () => {
			const bookWithReview = {
				...MOCK_USER_BOOK,
				review_markdown:
					"I loved [First Lie Wins](https://hardcover.app/id/book/880916) but ||the ending was predictable||.",
				review_raw: null,
			};
			const { variables } = builder.build(bookWithReview);

			expect(variables.review).toBe(
				"I loved [First Lie Wins](https://hardcover.app/id/book/880916) but the ending was predictable.",
			);
		});

		test("falls back to review_raw when review_markdown is null", () => {
			const bookWithReview = {
				...MOCK_USER_BOOK,
				review_markdown: null,
				review_raw: "I loved First Lie Wins but the ending was predictable.",
			};
			const { variables } = builder.build(bookWithReview);

			expect(variables.review).toBe(
				"I loved First Lie Wins but the ending was predictable.",
			);
		});

		test("extracts description", () => {
			const { variables } = builder.build(MOCK_USER_BOOK);

			expect(variables.description).toBe("A book description.");
		});

		test("extracts publisher as array", () => {
			const { variables } = builder.build(MOCK_USER_BOOK);

			expect(variables.publisher).toEqual(["Publisher Name"]);
		});

		test("extracts ISBNs", () => {
			const { variables } = builder.build(MOCK_USER_BOOK);

			expect(variables.isbn10).toBe("1234567890");
			expect(variables.isbn13).toBe("9781234567890");
		});

		test("extracts genres", () => {
			const { variables } = builder.build(MOCK_USER_BOOK);

			expect(variables.genres).toEqual(["Fiction"]);
		});

		test("extracts review", () => {
			const { variables } = builder.build(MOCK_USER_BOOK);

			expect(variables.review).toBe("Great book");
		});

		test("extracts quotes as array", () => {
			const { variables } = builder.build(MOCK_USER_BOOK);

			expect(variables.quotes).toEqual(["Quote one", "Quote two"]);
		});

		test("handles missing fields", () => {
			const incompleteBook = {
				book_id: 999,
				status_id: 1,
				rating: null,
				book: {
					title: "Incomplete Book",
					slug: "incomplete-book",
					cached_contributors: [],
				},
				edition: {
					title: "Incomplete Edition",
					cached_contributors: [],
				},
				user_book_reads: [],
			} as any;

			const { variables } = builder.build(incompleteBook);

			expect(variables.bookTitle).toBe("Incomplete Book");
			expect(variables.rating).toBeUndefined();
			expect(variables.description).toBeUndefined();
			expect(variables.review).toBeUndefined();
		});
	});

	describe("wikilink formatting", () => {
		test("does not apply wikilinks to authors in variables when enabled", () => {
			mockSettings.wikilinkSettings.authors = true;
			builder.updateSettings(mockSettings);

			const { variables } = builder.build(MOCK_USER_BOOK);

			expect(variables.editionAuthors).toEqual(["Edition Author"]);
		});

		test("does not apply wikilinks to authors in variables when disabled", () => {
			mockSettings.wikilinkSettings.authors = false;
			builder.updateSettings(mockSettings);

			const { variables } = builder.build(MOCK_USER_BOOK);

			expect(variables.editionAuthors).toEqual(["Edition Author"]);
		});
	});

	describe("lists handling", () => {
		test("extracts lists from bookToListsMap", () => {
			const listsMap = new Map<number, string[]>();
			listsMap.set(12345, ["TBR 2024", "Favorites"]);

			const { variables } = builder.build(MOCK_USER_BOOK, listsMap);

			expect(variables.lists).toEqual(["TBR 2024", "Favorites"]);
		});

		test("does not apply wikilinks to lists in variables when enabled", () => {
			mockSettings.wikilinkSettings.lists = true;
			builder.updateSettings(mockSettings);

			const listsMap = new Map<number, string[]>();
			listsMap.set(12345, ["TBR 2024", "Favorites"]);

			const { variables } = builder.build(MOCK_USER_BOOK, listsMap);

			expect(variables.lists).toEqual(["TBR 2024", "Favorites"]);
		});
	});

	describe("frontmatter generation", () => {
		test("always includes hardcoverBookId in frontmatter", () => {
			const { frontmatter } = builder.build(MOCK_USER_BOOK);

			expect(frontmatter.hardcoverBookId).toBe(12345);
		});

		test("substitutes variables in frontmatter", () => {
			const { frontmatter } = builder.build(MOCK_USER_BOOK);

			expect(frontmatter.title).toBe("Edition Title");
			expect(frontmatter.authors).toEqual(["Edition Author"]);
			expect(frontmatter.rating).toBe("5/5");
			expect(frontmatter.status).toEqual(["Read"]);
		});
	});

	describe("rawContributors", () => {
		test("returns edition contributors for fallback", () => {
			const { rawContributors } = builder.build(MOCK_USER_BOOK);

			expect(rawContributors).toBeDefined();
			expect(rawContributors?.length).toBeGreaterThan(0);
		});
	});
});
