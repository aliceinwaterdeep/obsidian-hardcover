export interface GroupingSettings {
	enabled: boolean;
	groupBy: "author" | "series" | "author-series";
	authorFormat: "firstLast" | "lastFirst";

	noAuthorBehavior: "useFallbackPriority" | "useFallbackFolder";
	fallbackFolderName: string;

	multipleAuthorsBehavior: "useFirst" | "useCollectionsFolder";
	collectionsFolderName: string;

	autoOrganizeFolders: boolean;
}

export interface PluginSettings {
	settingsVersion: number;
	apiKey: string;
	lastSyncTimestamp: string;
	userId: number | null;
	booksCount: number | null;

	// field configuration
	frontmatterFields: FrontmatterFieldsSettings;
	preserveCustomFrontmatter: boolean;

	// status filter - empty array means sync all statuses
	statusFilter: number[];

	bodyTemplate: string;
	quotesFormat: "blockquote" | "callout";
	wikilinkSettings: {
		authors: boolean;
		contributors: boolean;
		series: boolean;
		publisher: boolean;
		genres: boolean;
		lists: boolean;
	};

	statusMapping: {
		[key: number]: string; // map hardcover status_id to custom string, will be put in array to allow for list type property in obsidian
	};

	targetFolder: string;
	grouping: GroupingSettings;
	filenameTemplate: string;
}

export interface FieldConfig {
	enabled: boolean;
	propertyName: string;
	bodyHeading?: string;
}

export interface ActivityDateFieldConfig extends FieldConfig {
	startPropertyName: string;
	endPropertyName: string;
}

export interface FrontmatterFieldsSettings {
	// user_books fields
	rating: FieldConfig;
	status: FieldConfig;
	review: FieldConfig;
	quotes: FieldConfig;

	// book or edition fields
	bookTitle: FieldConfig;
	editionTitle: FieldConfig;
	bookCover: FieldConfig;
	editionCover: FieldConfig;
	bookReleaseDate: FieldConfig;
	editionReleaseDate: FieldConfig;
	bookAuthors: FieldConfig;
	editionAuthors: FieldConfig;
	bookContributors: FieldConfig;
	editionContributors: FieldConfig;

	// book fields
	description: FieldConfig;
	url: FieldConfig;
	series: FieldConfig;
	genres: FieldConfig;

	// lists fields
	lists: FieldConfig;

	// edition fields
	publisher: FieldConfig;
	isbn10: FieldConfig;
	isbn13: FieldConfig;

	// user_book_reads fields
	firstRead: ActivityDateFieldConfig;
	lastRead: ActivityDateFieldConfig; // enabling firstRead/lastRead will create both start/end properties in the frontmatter
	totalReads: FieldConfig;

	readYears: FieldConfig;
}

export interface FieldDefinition {
	key: keyof FrontmatterFieldsSettings;
	name: string;
	description: string;
	isActivityDateField?: boolean;
	supportsWikilinks?: boolean;
}

export interface BookMetadata {
	hardcoverBookId: number;
	bodyContent: {
		bookTitle?: string;
		editionTitle?: string;
		bookCover?: string;
		editionCover?: string;
		bookReleaseDate?: string;
		editionReleaseDate?: string;
		bookAuthors?: string[];
		editionAuthors?: string[];
		bookContributors?: string[];
		editionContributors?: string[];

		description?: string;
		url?: string;
		series?: string[];
		genres?: string[];

		publisher?: string[];
		isbn10?: string;
		isbn13?: string;

		rating?: number;
		status?: string[];
		review?: string;
		quotes?: string[];
		lists?: string[];

		firstReadStart?: string;
		firstReadEnd?: string;
		lastReadStart?: string;
		lastReadEnd?: string;
		totalReads?: number;
		readYears?: number[];
	};

	// frontmatter properties based on user custom property names
	[key: string]: any;
}

export interface BookMetadataWithContributors {
	metadata: BookMetadata;
	rawContributors?: Record<any, any>[];
}
