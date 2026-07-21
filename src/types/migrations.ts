import { GroupingSettings } from "./plugin";

// legacy field level config shape used before the note template rewrite (v13)
// not every field had every property (it varied release to release and by field), so everything here is optional, the index signature allows anything else without fighting the type checker, since this code only ever runs once pe user on upgrade and isn't worth precisely typing for every historical version
export interface LegacyFieldConfig {
	enabled?: boolean;
	propertyName?: string;
	wikilinks?: boolean;
	format?: string;
	bodyHeading?: string;
	startPropertyName?: string;
	endPropertyName?: string;
	[key: string]: unknown;
}

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
	frontmatterFields?: Record<string, LegacyFieldConfig>;
	fieldsSettings?: Record<string, LegacyFieldConfig>; // old name before it was renamed to frontmatterFields

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

	// grouping settings (from v6+), built incrementally toward GroupingSettings
	grouping?: Partial<GroupingSettings>;

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
}
