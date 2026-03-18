import { PluginSettings } from "src/types";

// legacy settings structure used by migrations to access properties that existed in older versions
export interface LegacySettings {
	settingsVersion?: number;
	apiKey?: string;
	lastSyncTimestamp?: string;
	userId?: number | null;
	booksCount?: number | null;
	preserveCustomFrontmatter?: boolean;
	statusFilter?: number[];
	targetFolder?: string;
	filenameTemplate?: string;

	// frontmatter related
	// from v2 to v12
	frontmatterFields?: {
		[key: string]: any;
	};
	fieldsSettings?: {
		// old name before it was renamed to frontmatterFields
		[key: string]: any;
	};

	// from v11 to v12
	dataSourcePreferences?: {
		titleSource?: "book" | "edition";
		coverSource?: "book" | "edition";
		releaseDateSource?: "book" | "edition";
		authorsSource?: "book" | "edition";
		contributorsSource?: "book" | "edition";
	};

	// from v12
	bodyTemplate?: string;

	// grouping settings (from v6+)
	grouping?: {
		[key: string]: any;
	};

	// from v13+
	noteTemplate?: string;
	keepEmptyHeadings?: boolean;
	wikilinkSettings?: {
		authors?: boolean;
		contributors?: boolean;
		series?: boolean;
		publisher?: boolean;
		genres?: boolean;
		lists?: boolean;
	};
	quotesFormat?: "blockquote" | "callout";
	statusMapping?: {
		[key: number]: string;
	};

	// catch all for anything else
	[key: string]: any;
}
