import { MetadataService } from "./MetadataService";
import { PluginSettings } from "../types";
import { DEFAULT_SETTINGS } from "../config/defaultSettings";
import { FileUtils } from "../utils/FileUtils";

jest.mock("obsidian", () => ({
	parseYaml: (yaml: string) => {
		//  return a mock object that looks like parsed frontmatter
		return {
			title: "{{editionTitle}}",
			rating: "{{rating}}",
			status: "{{status}}",
		};
	},
}));

describe("MetadataService", () => {
	let metadataService: MetadataService;
	let mockSettings: PluginSettings;

	const MOCK_USER_BOOK = {
		book_id: 12345,
		updated_at: "2023-01-20T12:00:00Z",
		rating: 5,
		status_id: 3, // "Read"
		review: "Murderbot is the best",
		review_raw: null,
		reading_journals: [
			{ entry: "Quote one from the book" },
			{ entry: "Quote two from the book" },
		],
		book: {
			title: "All Systems Red",
			description: "A sci-fi novella about a security android.",
			release_date: "2017-05-02",
			cached_image: { url: "https://example.com/book-cover.jpg" },
			slug: "all-systems-red",
			cached_contributors: [
				{ author: { name: "Martha Wells" }, contribution: "Author" },
			],
			book_series: [],
			cached_tags: {
				Genre: [
					{
						tag: "Science Fiction",
						tagSlug: "science-fiction",
						category: "Genre",
						categorySlug: "genre",
						spoilerRatio: 0,
						count: 1,
					},
					{
						tag: "Novella",
						tagSlug: "novella",
						category: "Genre",
						categorySlug: "genre",
						spoilerRatio: 0,
						count: 1,
					},
				],
			},
		},
		edition: {
			title: "All Systems Red: Special Edition",
			release_date: "2018-01-03",
			cached_image: { url: "https://example.com/edition-cover.jpg" },
			cached_contributors: [
				{ author: { name: "Martha Wells" }, contribution: "Author" },
				{ author: { name: "Co-Author Name" }, contribution: "" }, // empty string = author
				{ author: { name: "Another Co-Author Name" }, contribution: null }, // null = author
				{ author: { name: "John Translator" }, contribution: "Translator" },
				{ author: { name: "Jane Narrator" }, contribution: "Narrator" },
			],
			publisher: { name: "Tor.com" },
			isbn_10: "0765397528",
			isbn_13: "9780765397522",
		},
		user_book_reads: [
			{
				started_at: "2023-01-15T00:00:00Z",
				finished_at: "2023-01-20T00:00:00Z",
			},
		],
	};

	beforeEach(() => {
		mockSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); // deep clone
		const fileUtils = new FileUtils();
		metadataService = new MetadataService(mockSettings, fileUtils);
	});

	describe("buildMetadata", () => {
		test("returns metadata with frontmatter and variables", () => {
			const { metadata, rawContributors } =
				metadataService.buildMetadata(MOCK_USER_BOOK);

			expect(metadata.hardcoverBookId).toBe(12345);
			expect(metadata.frontmatter).toBeDefined();
			expect(metadata.variables).toBeDefined();
			expect(rawContributors).toBeDefined();
		});

		test("includes hardcoverBookId in metadata", () => {
			const { metadata } = metadataService.buildMetadata(MOCK_USER_BOOK);

			expect(metadata.hardcoverBookId).toBe(12345);
		});

		test("frontmatter contains enabled fields", () => {
			const { metadata } = metadataService.buildMetadata(MOCK_USER_BOOK);

			// default settings have editionTitle enabled as "title"
			expect(metadata.frontmatter.title).toBeDefined();
			// default settings have rating enabled
			expect(metadata.frontmatter.rating).toBeDefined();
			// default settings have status enabled
			expect(metadata.frontmatter.status).toBeDefined();
		});

		test("variables contain all data for template rendering", () => {
			const { metadata } = metadataService.buildMetadata(MOCK_USER_BOOK);

			// variables should have both book and edition data
			expect(metadata.variables.bookTitle).toBeDefined();
			expect(metadata.variables.editionTitle).toBeDefined();
			expect(metadata.variables.description).toBeDefined();
			expect(metadata.variables.rating).toBeDefined();
		});

		test("returns rawContributors for author fallback", () => {
			const { rawContributors } = metadataService.buildMetadata(MOCK_USER_BOOK);

			expect(Array.isArray(rawContributors)).toBe(true);
			expect(rawContributors.length).toBeGreaterThan(0);
		});

		test("handles lists mapping", () => {
			const listsMap = new Map<number, string[]>();
			listsMap.set(12345, ["TBR 2024", "Sci-fi Favorites"]);

			const { metadata } = metadataService.buildMetadata(
				MOCK_USER_BOOK,
				listsMap,
			);

			// lists should be in variables
			expect(metadata.variables.lists).toBeDefined();
		});

		test("handles null lists mapping", () => {
			const { metadata } = metadataService.buildMetadata(MOCK_USER_BOOK, null);

			expect(metadata).toBeDefined();
			expect(metadata.hardcoverBookId).toBe(12345);
		});

		test("handles missing optional fields gracefully", () => {
			const userBookWithMissingData = {
				book_id: 12345,
				status_id: 3,
				rating: null,
				book: {
					title: "Test Book",
					slug: "test",
					cached_contributors: [],
				},
				edition: {
					title: "Test Edition",
					cached_contributors: [],
				},
				user_book_reads: [],
				reading_journals: [],
			} as any;

			const { metadata } = metadataService.buildMetadata(
				userBookWithMissingData,
			);

			expect(metadata.hardcoverBookId).toBe(12345);
			expect(metadata.frontmatter).toBeDefined();
			expect(metadata.variables).toBeDefined();
		});
	});
});
