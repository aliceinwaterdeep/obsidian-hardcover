import { FieldDefinition } from "src/types";

// settings order can be rearranged by changing this
export const FIELD_DEFINITIONS: FieldDefinition[] = [
	{
		key: "title",
		name: "Title",
		description: "Book title",
		hasDataSource: true,
	},
	{
		key: "description",
		name: "Description",
		description: "Book description",
	},
	{
		key: "cover",
		name: "Cover",
		description: "Book cover image",
		hasDataSource: true,
	},
	{
		key: "releaseDate",
		name: "Release date",
		description: "Publication date",
		hasDataSource: true,
	},
	{
		key: "series",
		name: "Series",
		description: "Series information",
		supportsWikilinks: true,
	},
	{
		key: "authors",
		name: "Authors",
		description: "Book authors",
		hasDataSource: true,
		supportsWikilinks: true,
	},
	{
		key: "contributors",
		name: "Contributors",
		description: "Other contributors (translators, narrators, etc.)",
		hasDataSource: true,
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
	{ key: "review", name: "Review", description: "Your review of the book" },
	{
		key: "quotes",
		name: "Quotes",
		description: "Quotes from reading journal",
	},
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
