import { PluginSettings } from "src/types";
import { HARDCOVER_STATUS_MAP } from "./statusMapping";

export const DEFAULT_NOTE_TEMPLATE = `---
title: {{editionTitle}}
cover: {{editionCover}}
releaseDate: {{editionReleaseDate}}
authors: {{editionAuthors}}
contributors: {{editionContributors}}
description: {{description}}
series: {{series}}
publisher: {{publisher}}
genres: {{genres}}
url: {{url}}
rating: {{rating}}
status: {{status}}
firstReadStart: {{firstReadStart}}
firstReadEnd: {{firstReadEnd}}
lastReadStart: {{lastReadStart}}
lastReadEnd: {{lastReadEnd}}
totalReads: {{totalReads}}
readYears: {{readYears}}
---

# {{editionTitle}}
![{{editionTitle}} Cover|300]({{editionCover}})

{{description}}

## Review
{{review}}
`;

export const DEFAULT_FILENAME_FORMAT = "{{editionTitle}} ({{editionYear}})";

export const DEFAULT_SETTINGS: PluginSettings = {
	settingsVersion: 14,
	apiKey: "",
	lastSyncTimestamp: "",
	userId: null,
	booksCount: null,
	preserveCustomFrontmatter: true,
	statusFilter: [1, 2, 3, 4, 5],
	statusMapping: HARDCOVER_STATUS_MAP,
	noteTemplate: DEFAULT_NOTE_TEMPLATE,
	keepEmptyHeadings: false,
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
