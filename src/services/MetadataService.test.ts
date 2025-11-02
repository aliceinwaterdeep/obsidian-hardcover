import { MetadataService } from "./MetadataService";
import { PluginSettings } from "../types";
import { DEFAULT_SETTINGS } from "../config/defaultSettings";
import { FileUtils } from "../utils/FileUtils";

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
		test("includes basic required fields", () => {
			const result = metadataService.buildMetadata(MOCK_USER_BOOK);

			expect(result.hardcoverBookId).toBe(12345);
			expect(result.title).toBe("All Systems Red: Special Edition"); // edition source by default
			expect(result.rating).toBe("5/5");
			expect(result.status).toEqual(["Read"]);
		});

		test("respects data source preferences for title", () => {
			mockSettings.dataSourcePreferences.titleSource = "book";
			metadataService.updateSettings(mockSettings);

			const result = metadataService.buildMetadata(MOCK_USER_BOOK);
			expect(result.title).toBe("All Systems Red");

			mockSettings.dataSourcePreferences.titleSource = "edition";
			metadataService.updateSettings(mockSettings);

			const result2 = metadataService.buildMetadata(MOCK_USER_BOOK);
			expect(result2.title).toBe("All Systems Red: Special Edition");
		});

		test("respects data source preferences for cover", () => {
			mockSettings.dataSourcePreferences.coverSource = "book";
			metadataService.updateSettings(mockSettings);

			const result = metadataService.buildMetadata(MOCK_USER_BOOK);
			expect(result.cover).toBe("https://example.com/book-cover.jpg");

			mockSettings.dataSourcePreferences.coverSource = "edition";
			metadataService.updateSettings(mockSettings);

			const result2 = metadataService.buildMetadata(MOCK_USER_BOOK);
			expect(result2.cover).toBe("https://example.com/edition-cover.jpg");
		});

		test("respects data source preferences for release date", () => {
			mockSettings.dataSourcePreferences.releaseDateSource = "book";
			metadataService.updateSettings(mockSettings);

			const result = metadataService.buildMetadata(MOCK_USER_BOOK);
			expect(result.releaseDate).toBe("2017-05-02");

			mockSettings.dataSourcePreferences.releaseDateSource = "edition";
			metadataService.updateSettings(mockSettings);

			const result2 = metadataService.buildMetadata(MOCK_USER_BOOK);
			expect(result2.releaseDate).toBe("2018-01-03");
		});

		test("extracts authors and contributors correctly", () => {
			const result = metadataService.buildMetadata(MOCK_USER_BOOK);

			expect(result.authors).toEqual([
				"Martha Wells",
				"Co-Author Name",
				"Another Co-Author Name",
			]);
			expect(result.contributors).toEqual([
				"John Translator (Translator)",
				"Jane Narrator (Narrator)",
			]);
		});

		test("handles missing optional fields gracefully", () => {
			const userBookWithMissingData = {
				...MOCK_USER_BOOK,
				rating: null,
				book: {
					...MOCK_USER_BOOK.book,
					description: null,
					cached_tags: null,
				},
				user_book_reads: [],
			};

			const result = metadataService.buildMetadata(userBookWithMissingData);

			expect(result.hardcoverBookId).toBe(12345);
			expect(result.title).toBeDefined();
			expect(result.rating).toBeUndefined();
			expect(result.description).toBeUndefined();
			expect(result.genres).toBeUndefined();
		});

		test("respects data source preferences for authors and contributors", () => {
			mockSettings.dataSourcePreferences.authorsSource = "book";
			metadataService.updateSettings(mockSettings);

			const result = metadataService.buildMetadata(MOCK_USER_BOOK);
			expect(result.authors).toEqual(["Martha Wells"]);

			mockSettings.dataSourcePreferences.authorsSource = "edition";
			metadataService.updateSettings(mockSettings);

			const result2 = metadataService.buildMetadata(MOCK_USER_BOOK);
			expect(result2.authors).toEqual([
				"Martha Wells",
				"Co-Author Name",
				"Another Co-Author Name",
			]);
		});

		test("extracts reading activity correctly", () => {
			const result = metadataService.buildMetadata(MOCK_USER_BOOK);

			expect(result.firstReadStart).toBe("2023-01-15T00:00:00Z");
			expect(result.firstReadEnd).toBe("2023-01-20T00:00:00Z");
			expect(result.lastReadStart).toBe("2023-01-15T00:00:00Z");
			expect(result.lastReadEnd).toBe("2023-01-20T00:00:00Z");
			expect(result.totalReads).toBe(1);
		});

		test("uses custom status mapping", () => {
			mockSettings.statusMapping[3] = "Finished Reading";
			metadataService.updateSettings(mockSettings);

			const result = metadataService.buildMetadata(MOCK_USER_BOOK);
			expect(result.status).toEqual(["Finished Reading"]);
		});

		test("respects field enable/disable settings", () => {
			mockSettings.fieldsSettings.rating.enabled = false;
			mockSettings.fieldsSettings.description.enabled = false;
			mockSettings.fieldsSettings.genres.enabled = false;
			metadataService.updateSettings(mockSettings);

			const result = metadataService.buildMetadata(MOCK_USER_BOOK);

			expect(result.rating).toBeUndefined();
			expect(result.description).toBeUndefined();
			expect(result.genres).toBeUndefined();

			expect(result.hardcoverBookId).toBe(12345);
			expect(result.title).toBeDefined();
			expect(result.status).toBeDefined();
		});

		test("uses custom property names from settings", () => {
			mockSettings.fieldsSettings.title.propertyName = "bookTitle";
			mockSettings.fieldsSettings.rating.propertyName = "myRating";
			mockSettings.fieldsSettings.status.propertyName = "readingStatus";
			metadataService.updateSettings(mockSettings);

			const result = metadataService.buildMetadata(MOCK_USER_BOOK);

			expect(result.bookTitle).toBe("All Systems Red: Special Edition");
			expect(result.myRating).toBe("5/5");
			expect(result.readingStatus).toEqual(["Read"]);

			expect(result.title).toBeUndefined();
			expect(result.rating).toBeUndefined();
			expect(result.status).toBeUndefined();
		});

		test("includes body content for review", () => {
			const result = metadataService.buildMetadata(MOCK_USER_BOOK);

			expect(result.bodyContent.review).toBe("Murderbot is the best");
			expect(result.bodyContent.title).toBe("All Systems Red: Special Edition");
			expect(result.bodyContent.coverUrl).toBe(
				"https://example.com/edition-cover.jpg"
			);
		});

		test("extracts ISBN fields when enabled", () => {
			mockSettings.fieldsSettings.isbn10.enabled = true;
			mockSettings.fieldsSettings.isbn13.enabled = true;
			metadataService.updateSettings(mockSettings);

			const result = metadataService.buildMetadata(MOCK_USER_BOOK);

			expect(result.isbn10).toBe("0765397528");
			expect(result.isbn13).toBe("9780765397522");
		});

		test("respects ISBN field enable/disable settings", () => {
			mockSettings.fieldsSettings.isbn10.enabled = false;
			mockSettings.fieldsSettings.isbn13.enabled = false;
			metadataService.updateSettings(mockSettings);

			const result = metadataService.buildMetadata(MOCK_USER_BOOK);

			expect(result.isbn10).toBeUndefined();
			expect(result.isbn13).toBeUndefined();
		});
	});
});
