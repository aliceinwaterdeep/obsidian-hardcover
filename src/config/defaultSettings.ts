import { FieldsSettings, PluginSettings } from "src/types";
import { HARDCOVER_STATUS_MAP } from "./statusMapping";

export const DEFAULT_FIELDS_SETTINGS: FieldsSettings = {
	rating: { enabled: true, propertyName: "rating" },
	status: { enabled: true, propertyName: "status" },
	review: { enabled: true, propertyName: "review" },
	quotes: { enabled: false, propertyName: "quotes", format: "blockquote" },

	title: { enabled: true, propertyName: "title" },
	cover: { enabled: true, propertyName: "cover" },
	authors: { enabled: true, propertyName: "authors" },
	contributors: { enabled: true, propertyName: "contributors" },
	releaseDate: { enabled: true, propertyName: "releaseDate" },
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
	settingsVersion: 10,
	apiKey: "",
	lastSyncTimestamp: "",
	userId: null,
	booksCount: null,
	preserveCustomFrontmatter: true,
	statusFilter: [1, 2, 3, 5],
	fieldsSettings: DEFAULT_FIELDS_SETTINGS,
	dataSourcePreferences: {
		titleSource: "edition",
		coverSource: "edition",
		releaseDateSource: "edition",
		authorsSource: "edition",
		contributorsSource: "edition",
	},
	statusMapping: HARDCOVER_STATUS_MAP,
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
