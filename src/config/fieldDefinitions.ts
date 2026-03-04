import { FieldDefinition } from "src/types";

// settings order can be rearranged by changing this
export const FRONTMATTER_FIELDS_DEFINITIONS: FieldDefinition[] = [
	{
		key: "bookTitle",
		name: "Book Title",
		description: "Title from book data",
		supportsWikilinks: false,
	},
	{
		key: "editionTitle",
		name: "Edition Title",
		description: "Title from edition data",
		supportsWikilinks: false,
	},
	{
		key: "bookCover",
		name: "Book Cover",
		description: "Cover image from book data",
		supportsWikilinks: false,
	},
	{
		key: "editionCover",
		name: "Edition Cover",
		description: "Cover image from edition data",
		supportsWikilinks: false,
	},
	{
		key: "bookReleaseDate",
		name: "Book Release Date",
		description: "Release date from book data",
		supportsWikilinks: false,
	},
	{
		key: "editionReleaseDate",
		name: "Edition Release Date",
		description: "Publication date from edition data",
		supportsWikilinks: false,
	},
	{
		key: "bookAuthors",
		name: "Book Authors",
		description: "Authors from book data",
		supportsWikilinks: true,
	},
	{
		key: "editionAuthors",
		name: "Edition Authors",
		description: "Authors from edition data",
		supportsWikilinks: true,
	},
	{
		key: "bookContributors",
		name: "Book Contributors",
		description: "Contributors from book data",
		supportsWikilinks: true,
	},
	{
		key: "editionContributors",
		name: "Edition Contributors",
		description: "Contributors from edition data",
		supportsWikilinks: true,
	},
	{
		key: "description",
		name: "Description",
		description: "Book description",
	},

	{
		key: "series",
		name: "Series",
		description: "Series information",
		supportsWikilinks: true,
	},
	{
		key: "publisher",
		name: "Publisher",
		description: "Publisher name",
		supportsWikilinks: true,
	},
	{
		key: "isbn10",
		name: "ISBN-10",
		description: "ISBN-10",
	},
	{
		key: "isbn13",
		name: "ISBN-13",
		description: "ISBN-13",
	},
	{ key: "url", name: "URL", description: "Hardcover URL" },
	{
		key: "genres",
		name: "Genres",
		description: "Book genres",
		supportsWikilinks: true,
	},
	{
		key: "lists",
		name: "Lists",
		description: "User lists",
		supportsWikilinks: true,
	},
	{ key: "status", name: "Status", description: "Reading status" },
	{ key: "rating", name: "Rating", description: "Your rating" },
	{
		key: "firstRead",
		name: "First read",
		description: "Start and end date of first read",
		isActivityDateField: true,
	},
	{
		key: "lastRead",
		name: "Last read",
		description: "Start and end date of last read",
		isActivityDateField: true,
	},
	{
		key: "totalReads",
		name: "Total reads",
		description: "Times read",
	},
	{
		key: "readYears",
		name: "Read years",
		description: "List of years when the book was read",
	},
];
