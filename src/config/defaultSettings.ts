import { FieldsSettings, PluginSettings } from "src/types";
import { HARDCOVER_STATUS_MAP } from "./statusMapping";

export const DEFAULT_BODY_TEMPLATE = `# {{editionTitle}}
![{{editionTitle}} Cover|300]({{editionCover}})

{{description}}

## Review
{{review}}

## Quotes
{{quotes}}
`;

export const DEFAULT_FIELDS_SETTINGS: FieldsSettings = {
	rating: { enabled: true, propertyName: "rating" },
	status: { enabled: true, propertyName: "status" },
	review: { enabled: true, propertyName: "review", bodyHeading: "Review" },
	quotes: {
		enabled: false,
		propertyName: "quotes",
		bodyHeading: "Quotes",
	},
	bookTitle: { enabled: false, propertyName: "bookTitle" },
	editionTitle: { enabled: true, propertyName: "title" },
	bookCover: { enabled: false, propertyName: "bookCover" },
	editionCover: { enabled: true, propertyName: "cover" },
	bookReleaseDate: { enabled: false, propertyName: "bookReleaseDate" },
	editionReleaseDate: { enabled: true, propertyName: "releaseDate" },
	bookAuthors: { enabled: false, propertyName: "bookAuthors" },
	editionAuthors: { enabled: true, propertyName: "authors" },
	bookContributors: { enabled: false, propertyName: "bookContributors" },
	editionContributors: { enabled: true, propertyName: "contributors" },
	url: { enabled: true, propertyName: "url" },

	description: { enabled: true, propertyName: "description" },
	series: {
		enabled: true,
		propertyName: "seriesName",
	},
	genres: { enabled: true, propertyName: "genres" },
	lists: { enabled: false, propertyName: "lists" },

	publisher: { enabled: true, propertyName: "publisher" },

	isbn10: { enabled: false, propertyName: "isbn10" },
	isbn13: { enabled: false, propertyName: "isbn13" },

	firstRead: {
		enabled: true,
		propertyName: "firstRead",
		startPropertyName: "firstReadStart",
		endPropertyName: "firstReadEnd",
	},
	lastRead: {
		enabled: true,
		propertyName: "lastRead",
		startPropertyName: "lastReadStart",
		endPropertyName: "lastReadEnd",
	},
	totalReads: { enabled: true, propertyName: "totalReads" },
	readYears: { enabled: false, propertyName: "readYears" },
};

export const DEFAULT_FILENAME_FORMAT = "${title} (${year})";

export const DEFAULT_SETTINGS: PluginSettings = {
	settingsVersion: 12,
	apiKey: "",
	lastSyncTimestamp: "",
	userId: null,
	booksCount: null,
	preserveCustomFrontmatter: true,
	statusFilter: [1, 2, 3, 5],
	fieldsSettings: DEFAULT_FIELDS_SETTINGS,
	statusMapping: HARDCOVER_STATUS_MAP,
	bodyTemplate: DEFAULT_BODY_TEMPLATE,
	quotesFormat: "blockquote",
	wikilinkSettings: {
		authors: false,
		contributors: false,
		series: false,
		publisher: false,
		genres: false,
		lists: false,
	},
	targetFolder: "HardcoverBooks",
	grouping: {
		enabled: false,
		groupBy: "author",
		authorFormat: "firstLast",
		noAuthorBehavior: "useFallbackPriority",
		fallbackFolderName: "Various",
		multipleAuthorsBehavior: "useFirst",
		collectionsFolderName: "Collections",
		autoOrganizeFolders: true,
	},
	filenameTemplate: DEFAULT_FILENAME_FORMAT,
};
