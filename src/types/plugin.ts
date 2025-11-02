export interface GroupingSettings {
	enabled: boolean;
	groupBy: "author" | "series" | "author-series";
	authorFormat: "firstLast" | "lastFirst";
}

export interface PluginSettings {
	settingsVersion: number;
	apiKey: string;
	lastSyncTimestamp: string;
	userId: number | null;
	booksCount: number | null;

	// field configuration
	fieldsSettings: FieldsSettings;

	// data source preferences
	dataSourcePreferences: {
		titleSource: DataSource;
		coverSource: DataSource;
		releaseDateSource: DataSource;
		authorsSource: DataSource;
		contributorsSource: DataSource;
	};

	statusMapping: {
		[key: number]: string; // map hardcover status_id to custom string, will be put in array to allow for list type property in obsidian
	};

	targetFolder: string;
	grouping: GroupingSettings;
	filenameTemplate: string;
}

type DataSource = "book" | "edition";
export interface FieldConfig {
	enabled: boolean;
	propertyName: string;
	wikilinks?: boolean;
}

export interface ActivityDateFieldConfig extends FieldConfig {
	startPropertyName: string;
	endPropertyName: string;
}

export interface FieldsSettings {
	// user_books fields
	rating: FieldConfig;
	status: FieldConfig;
	review: FieldConfig;

	// book or edition fields
	title: FieldConfig;
	cover: FieldConfig;
	authors: FieldConfig;
	contributors: FieldConfig;
	releaseDate: FieldConfig;

	// book fields
	description: FieldConfig;
	url: FieldConfig;
	series: FieldConfig;
	genres: FieldConfig;

	// lists fields
	lists: FieldConfig;

	// edition fields
	publisher: FieldConfig;

	// user_book_reads fields
	firstRead: ActivityDateFieldConfig;
	lastRead: ActivityDateFieldConfig; // enabling firstRead/lastRead will create both start/end properties in the frontmatter
	totalReads: FieldConfig;

	readYears: FieldConfig;
}

export interface FieldDefinition {
	key: keyof FieldsSettings;
	name: string;
	description: string;
	hasDataSource?: boolean;
	isActivityDateField?: boolean;
	supportsWikilinks?: boolean;
}

export interface BookMetadata {
	hardcoverBookId: number;
	bodyContent: {
		title?: string;
		coverUrl?: string;
		review?: string;
	};
	// allow for dynamic properties based on user custom property names
	[key: string]: any;
}
