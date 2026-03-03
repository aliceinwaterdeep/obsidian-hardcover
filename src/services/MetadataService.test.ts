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
		test("includes basic required fields", () => {
			const { metadata: result } =
				metadataService.buildMetadata(MOCK_USER_BOOK);

			expect(result.hardcoverBookId).toBe(12345);
			// editionTitle.propertyName defaults to "title"
			expect(result.frontmatter.title).toBe("All Systems Red: Special Edition");
			expect(result.frontmatter.rating).toBe(5);
			expect(result.frontmatter.status).toEqual(["Read"]);
		});

		test("uses editionTitle for frontmatter title by default", () => {
			const { metadata: result } =
				metadataService.buildMetadata(MOCK_USER_BOOK);
			// editionTitle is enabled by default, bookTitle is not
			expect(result.frontmatter.title).toBe("All Systems Red: Special Edition");
			expect(result.frontmatter.bookTitle).toBeUndefined();
		});

		test("uses bookTitle when enabled", () => {
			mockSettings.frontmatterFields.bookTitle.enabled = true;
			metadataService.updateSettings(mockSettings);

			const { metadata: result } =
				metadataService.buildMetadata(MOCK_USER_BOOK);
			expect(result.frontmatter.bookTitle).toBe("All Systems Red");
		});

		test("uses editionCover for frontmatter cover by default", () => {
			const { metadata: result } =
				metadataService.buildMetadata(MOCK_USER_BOOK);
			// editionCover.propertyName defaults to "cover"
			expect(result.frontmatter.cover).toBe(
				"https://example.com/edition-cover.jpg",
			);
		});

		test("uses bookCover when enabled", () => {
			mockSettings.frontmatterFields.bookCover.enabled = true;
			metadataService.updateSettings(mockSettings);

			const { metadata: result } =
				metadataService.buildMetadata(MOCK_USER_BOOK);
			expect(result.frontmatter.bookCover).toBe(
				"https://example.com/book-cover.jpg",
			);
		});

		test("uses editionReleaseDate for frontmatter by default", () => {
			const { metadata: result } =
				metadataService.buildMetadata(MOCK_USER_BOOK);
			// editionReleaseDate.propertyName defaults to "releaseDate"
			expect(result.frontmatter.releaseDate).toBe("2018-01-03");
		});

		test("uses bookReleaseDate when enabled", () => {
			mockSettings.frontmatterFields.bookReleaseDate.enabled = true;
			metadataService.updateSettings(mockSettings);

			const { metadata: result } =
				metadataService.buildMetadata(MOCK_USER_BOOK);
			expect(result.frontmatter.bookReleaseDate).toBe("2017-05-02");
		});

		test("extracts edition authors and contributors correctly by default", () => {
			const { metadata: result } =
				metadataService.buildMetadata(MOCK_USER_BOOK);

			// editionAuthors.propertyName defaults to "authors"
			expect(result.frontmatter.authors).toEqual([
				"Martha Wells",
				"Co-Author Name",
				"Another Co-Author Name",
			]);
			// editionContributors.propertyName defaults to "contributors"
			expect(result.frontmatter.contributors).toEqual([
				"John Translator (Translator)",
				"Jane Narrator (Narrator)",
			]);
		});

		test("extracts book authors when enabled", () => {
			mockSettings.frontmatterFields.bookAuthors.enabled = true;
			metadataService.updateSettings(mockSettings);

			const { metadata: result } =
				metadataService.buildMetadata(MOCK_USER_BOOK);
			expect(result.frontmatter.bookAuthors).toEqual(["Martha Wells"]);
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

			const { metadata: result } = metadataService.buildMetadata(
				userBookWithMissingData,
			);

			expect(result.hardcoverBookId).toBe(12345);
			expect(result.frontmatter.title).toBeDefined();
			expect(result.frontmatter.rating).toBeUndefined();
			expect(result.frontmatter.description).toBeUndefined();
			expect(result.frontmatter.genres).toBeUndefined();
		});

		test("extracts reading activity correctly", () => {
			const { metadata: result } =
				metadataService.buildMetadata(MOCK_USER_BOOK);

			expect(result.frontmatter.firstReadStart).toBe("2023-01-15T00:00:00Z");
			expect(result.frontmatter.firstReadEnd).toBe("2023-01-20T00:00:00Z");
			expect(result.frontmatter.lastReadStart).toBe("2023-01-15T00:00:00Z");
			expect(result.frontmatter.lastReadEnd).toBe("2023-01-20T00:00:00Z");
			expect(result.frontmatter.totalReads).toBe(1);
		});

		test("uses custom status mapping", () => {
			mockSettings.statusMapping[3] = "Finished Reading";
			metadataService.updateSettings(mockSettings);

			const { metadata: result } =
				metadataService.buildMetadata(MOCK_USER_BOOK);
			expect(result.frontmatter.status).toEqual(["Finished Reading"]);
		});

		test("respects field enable/disable settings", () => {
			mockSettings.frontmatterFields.rating.enabled = false;
			mockSettings.frontmatterFields.description.enabled = false;
			mockSettings.frontmatterFields.genres.enabled = false;
			metadataService.updateSettings(mockSettings);

			const { metadata: result } =
				metadataService.buildMetadata(MOCK_USER_BOOK);

			expect(result.frontmatter.rating).toBeUndefined();
			expect(result.frontmatter.description).toBeUndefined();
			expect(result.frontmatter.genres).toBeUndefined();

			expect(result.hardcoverBookId).toBe(12345);
			expect(result.frontmatter.title).toBeDefined();
			expect(result.frontmatter.status).toBeDefined();
		});

		test("uses custom property names from settings", () => {
			mockSettings.frontmatterFields.editionTitle.propertyName = "bookTitle";
			mockSettings.frontmatterFields.rating.propertyName = "myRating";
			mockSettings.frontmatterFields.status.propertyName = "readingStatus";
			metadataService.updateSettings(mockSettings);

			const { metadata: result } =
				metadataService.buildMetadata(MOCK_USER_BOOK);

			expect(result.frontmatter.bookTitle).toBe(
				"All Systems Red: Special Edition",
			);
			expect(result.frontmatter.myRating).toBe(5);
			expect(result.frontmatter.readingStatus).toEqual(["Read"]);

			expect(result.frontmatter.title).toBeUndefined();
			expect(result.frontmatter.rating).toBeUndefined();
			expect(result.frontmatter.status).toBeUndefined();
		});

		test("includes body content for review when review is enabled", () => {
			const { metadata: result } =
				metadataService.buildMetadata(MOCK_USER_BOOK);

			expect(result.bodyContent.review).toBe("Murderbot is the best");
			// bodyContent uses fixed names
			expect(result.bodyContent.editionTitle).toBe(
				"All Systems Red: Special Edition",
			);
			expect(result.bodyContent.editionCover).toBe(
				"https://example.com/edition-cover.jpg",
			);
		});

		test("includes body content for quotes when enabled", () => {
			mockSettings.frontmatterFields.quotes.enabled = true;
			metadataService.updateSettings(mockSettings);

			const { metadata: result } =
				metadataService.buildMetadata(MOCK_USER_BOOK);

			expect(result.bodyContent.quotes).toEqual([
				"Quote one from the book",
				"Quote two from the book",
			]);
		});

		test("excludes quotes when disabled", () => {
			mockSettings.frontmatterFields.quotes.enabled = false;
			metadataService.updateSettings(mockSettings);

			const { metadata: result } =
				metadataService.buildMetadata(MOCK_USER_BOOK);

			expect(result.bodyContent.quotes).toBeUndefined();
		});

		test("handles empty quotes array", () => {
			mockSettings.frontmatterFields.quotes.enabled = true;
			metadataService.updateSettings(mockSettings);

			const userBookWithoutQuotes = {
				...MOCK_USER_BOOK,
				reading_journals: [],
			};

			const { metadata: result } = metadataService.buildMetadata(
				userBookWithoutQuotes,
			);

			expect(result.bodyContent.quotes).toBeUndefined();
		});

		test("handles missing reading_journals field", () => {
			mockSettings.frontmatterFields.quotes.enabled = true;
			metadataService.updateSettings(mockSettings);

			const { reading_journals, ...userBookWithoutJournals } = MOCK_USER_BOOK;

			const { metadata: result } = metadataService.buildMetadata(
				userBookWithoutJournals as any,
			);

			expect(result.bodyContent.quotes).toBeUndefined();
		});

		test("extracts ISBN fields when enabled", () => {
			mockSettings.frontmatterFields.isbn10.enabled = true;
			mockSettings.frontmatterFields.isbn13.enabled = true;
			metadataService.updateSettings(mockSettings);

			const { metadata: result } =
				metadataService.buildMetadata(MOCK_USER_BOOK);

			expect(result.frontmatter.isbn10).toBe("0765397528");
			expect(result.frontmatter.isbn13).toBe("9780765397522");
		});

		test("respects ISBN field enable/disable settings", () => {
			mockSettings.frontmatterFields.isbn10.enabled = false;
			mockSettings.frontmatterFields.isbn13.enabled = false;
			metadataService.updateSettings(mockSettings);

			const { metadata: result } =
				metadataService.buildMetadata(MOCK_USER_BOOK);

			expect(result.frontmatter.isbn10).toBeUndefined();
			expect(result.frontmatter.isbn13).toBeUndefined();
		});

		test("bodyContent always includes all data regardless of enabled state", () => {
			mockSettings.frontmatterFields.bookTitle.enabled = false;
			mockSettings.frontmatterFields.editionTitle.enabled = false;
			mockSettings.frontmatterFields.editionAuthors.enabled = false;
			metadataService.updateSettings(mockSettings);

			const { metadata: result } =
				metadataService.buildMetadata(MOCK_USER_BOOK);

			// frontmatter should be empty for these fields
			expect(result.frontmatter.title).toBeUndefined();
			expect(result.frontmatter.bookTitle).toBeUndefined();
			expect(result.frontmatter.authors).toBeUndefined();

			// bodyContent always has data
			expect(result.bodyContent.editionTitle).toBe(
				"All Systems Red: Special Edition",
			);
			expect(result.bodyContent.bookTitle).toBe("All Systems Red");
			expect(result.bodyContent.editionAuthors).toEqual([
				"Martha Wells",
				"Co-Author Name",
				"Another Co-Author Name",
			]);
		});
	});
});
