import { SettingsMigrationService } from "./migrations";
import { DEFAULT_SETTINGS } from "../config/defaultSettings";

describe("SettingsMigrationService", () => {
	describe("migrateSettings", () => {
		test("does not modify settings that are already current version", () => {
			const currentSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

			const result = SettingsMigrationService.migrateSettings(currentSettings);

			expect(result.settingsVersion).toBe(DEFAULT_SETTINGS.settingsVersion);
			expect(result).toEqual(DEFAULT_SETTINGS);
		});

		test("applies migration to settings without version field", () => {
			const oldSettings = {
				apiKey: "test-key",
				lastSyncTimestamp: "2023-01-01T00:00:00Z",
				userId: 123,
				frontmatterFields: DEFAULT_SETTINGS.frontmatterFields,
				// missing settingsVersion field
			};

			const result = SettingsMigrationService.migrateSettings(oldSettings);

			expect(result.settingsVersion).toBe(DEFAULT_SETTINGS.settingsVersion);
			expect(result.apiKey).toBe("test-key");
			expect(result.lastSyncTimestamp).toBe("2023-01-01T00:00:00Z");
			expect(result.userId).toBe(123);
		});

		test("applies migration to version 0 settings", () => {
			// Test v0 format migration - input has old v11 structure with dataSourcePreferences
			const v0Settings = {
				settingsVersion: 0,
				apiKey: "test-key",
				frontmatterFields: {
					title: { enabled: true, propertyName: "title" },
					cover: { enabled: true, propertyName: "cover" },
					releaseDate: { enabled: true, propertyName: "releaseDate" },
					authors: { enabled: true, propertyName: "authors" },
					contributors: { enabled: true, propertyName: "contributors" },
					description: { enabled: true, propertyName: "description" },
					review: { enabled: true, propertyName: "review" },
					quotes: { enabled: true, propertyName: "quotes" },
					series: { enabled: true, propertyName: "series" },
					publisher: { enabled: true, propertyName: "publisher" },
					genres: { enabled: true, propertyName: "genres" },
					lists: { enabled: false, propertyName: "lists" },
					url: { enabled: true, propertyName: "url" },
					isbn10: { enabled: false, propertyName: "isbn10" },
					isbn13: { enabled: false, propertyName: "isbn13" },
					rating: { enabled: true, propertyName: "rating" },
					status: { enabled: true, propertyName: "status" },
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
				},
				dataSourcePreferences: {
					titleSource: "edition",
					coverSource: "edition",
					releaseDateSource: "edition",
					authorsSource: "edition",
					contributorsSource: "edition",
				},
				preserveCustomFrontmatter: true,
			} as any;

			const result = SettingsMigrationService.migrateSettings(v0Settings);

			expect(result.settingsVersion).toBe(12);
			expect(result.apiKey).toBe("test-key");
		});

		test("preserves user data during migration", () => {
			const userSettings = {
				settingsVersion: 0,
				apiKey: "user-api-key",
				lastSyncTimestamp: "2023-06-15T12:00:00Z",
				userId: 456,
				booksCount: 150,
				targetFolder: "MyBooks",
				frontmatterFields: {
					title: { enabled: true, propertyName: "title" },
					cover: { enabled: true, propertyName: "cover" },
					releaseDate: { enabled: true, propertyName: "releaseDate" },
					authors: { enabled: true, propertyName: "authors" },
					contributors: { enabled: true, propertyName: "contributors" },
					description: { enabled: true, propertyName: "description" },
					review: { enabled: true, propertyName: "review" },
					quotes: { enabled: true, propertyName: "quotes" },
					series: { enabled: true, propertyName: "series" },
					publisher: { enabled: true, propertyName: "publisher" },
					genres: { enabled: true, propertyName: "genres" },
					lists: { enabled: false, propertyName: "lists" },
					url: { enabled: true, propertyName: "url" },
					isbn10: { enabled: false, propertyName: "isbn10" },
					isbn13: { enabled: false, propertyName: "isbn13" },
					rating: { enabled: true, propertyName: "rating" },
					status: { enabled: true, propertyName: "status" },
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
				},
				dataSourcePreferences: {
					titleSource: "edition",
					coverSource: "edition",
					releaseDateSource: "edition",
					authorsSource: "edition",
					contributorsSource: "edition",
				},
				statusMapping: { 1: "Want to Read", 3: "Finished" },
				filenameTemplate: "${title} by ${authors}",
				preserveCustomFrontmatter: true,
			} as any;

			const result = SettingsMigrationService.migrateSettings(userSettings);

			// version should be updated
			expect(result.settingsVersion).toBe(12);

			// user data should be preserved
			expect(result.apiKey).toBe("user-api-key");
			expect(result.lastSyncTimestamp).toBe("2023-06-15T12:00:00Z");
			expect(result.userId).toBe(456);
			expect(result.targetFolder).toBe("MyBooks");
			expect(result.frontmatterFields.rating.enabled).toBe(true);
			expect(result.frontmatterFields.rating.propertyName).toBe("rating");
			expect(result.statusMapping).toEqual({
				1: "Want to Read",
				3: "Finished",
			});
			expect(result.filenameTemplate).toBe("${title} by ${authors}");
			expect(result.preserveCustomFrontmatter).toBe(true);
		});

		test("adds preserveCustomFrontmatter with default when missing (v6 -> v7)", () => {
			const v6Settings = {
				settingsVersion: 6,
				apiKey: "abc",
				frontmatterFields: {
					title: { enabled: true, propertyName: "title" },
					cover: { enabled: true, propertyName: "cover" },
					releaseDate: { enabled: true, propertyName: "releaseDate" },
					authors: { enabled: true, propertyName: "authors" },
					contributors: { enabled: true, propertyName: "contributors" },
					description: { enabled: true, propertyName: "description" },
					review: { enabled: true, propertyName: "review" },
					quotes: { enabled: true, propertyName: "quotes" },
					series: { enabled: true, propertyName: "series" },
					publisher: { enabled: true, propertyName: "publisher" },
					genres: { enabled: true, propertyName: "genres" },
					lists: { enabled: false, propertyName: "lists" },
					url: { enabled: true, propertyName: "url" },
					isbn10: { enabled: false, propertyName: "isbn10" },
					isbn13: { enabled: false, propertyName: "isbn13" },
					rating: { enabled: true, propertyName: "rating" },
					status: { enabled: true, propertyName: "status" },
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
				},
				dataSourcePreferences: {
					titleSource: "edition",
					coverSource: "edition",
					releaseDateSource: "edition",
					authorsSource: "edition",
					contributorsSource: "edition",
				},
				grouping: DEFAULT_SETTINGS.grouping,
			} as any;

			const result = SettingsMigrationService.migrateSettings(v6Settings);

			expect(result.settingsVersion).toBe(12);
			expect(result.preserveCustomFrontmatter).toBe(true);
		});

		test("retains existing preserveCustomFrontmatter value during migration", () => {
			const v6Settings = {
				settingsVersion: 6,
				apiKey: "abc",
				frontmatterFields: {
					title: { enabled: true, propertyName: "title" },
					cover: { enabled: true, propertyName: "cover" },
					releaseDate: { enabled: true, propertyName: "releaseDate" },
					authors: { enabled: true, propertyName: "authors" },
					contributors: { enabled: true, propertyName: "contributors" },
					description: { enabled: true, propertyName: "description" },
					review: { enabled: true, propertyName: "review" },
					quotes: { enabled: true, propertyName: "quotes" },
					series: { enabled: true, propertyName: "series" },
					publisher: { enabled: true, propertyName: "publisher" },
					genres: { enabled: true, propertyName: "genres" },
					lists: { enabled: false, propertyName: "lists" },
					url: { enabled: true, propertyName: "url" },
					isbn10: { enabled: false, propertyName: "isbn10" },
					isbn13: { enabled: false, propertyName: "isbn13" },
					rating: { enabled: true, propertyName: "rating" },
					status: { enabled: true, propertyName: "status" },
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
				},
				dataSourcePreferences: {
					titleSource: "edition",
					coverSource: "edition",
					releaseDateSource: "edition",
					authorsSource: "edition",
					contributorsSource: "edition",
				},
				preserveCustomFrontmatter: false,
				grouping: DEFAULT_SETTINGS.grouping,
			} as any;

			const result = SettingsMigrationService.migrateSettings(v6Settings);

			expect(result.preserveCustomFrontmatter).toBe(false);
		});

		describe("migrateToV12", () => {
			test("migrates title with book source preference", () => {
				const v11Settings = {
					settingsVersion: 11,
					frontmatterFields: {
						title: { enabled: true, propertyName: "customTitle" },
						cover: { enabled: true, propertyName: "cover" },
						releaseDate: { enabled: true, propertyName: "releaseDate" },
						authors: { enabled: true, propertyName: "authors" },
						contributors: { enabled: true, propertyName: "contributors" },
						description: { enabled: true, propertyName: "description" },
						review: { enabled: true, propertyName: "review" },
						quotes: { enabled: true, propertyName: "quotes" },
						// ... other fields from DEFAULT_SETTINGS ...
						series: { enabled: true, propertyName: "series" },
						publisher: { enabled: true, propertyName: "publisher" },
						genres: { enabled: true, propertyName: "genres" },
						lists: { enabled: false, propertyName: "lists" },
						url: { enabled: true, propertyName: "url" },
						isbn10: { enabled: false, propertyName: "isbn10" },
						isbn13: { enabled: false, propertyName: "isbn13" },
						rating: { enabled: true, propertyName: "rating" },
						status: { enabled: true, propertyName: "status" },
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
					},
					dataSourcePreferences: {
						titleSource: "book",
						coverSource: "edition",
						releaseDateSource: "edition",
						authorsSource: "edition",
						contributorsSource: "edition",
					},
				} as any;

				const result = SettingsMigrationService.migrateSettings(v11Settings);

				expect(result.settingsVersion).toBe(12);
				expect(result.frontmatterFields.bookTitle).toEqual({
					enabled: true,
					propertyName: "customTitle",
				});
				expect(result.frontmatterFields.editionTitle).toEqual({
					enabled: false,
					propertyName: "editionTitle",
				});
			});

			test("migrates title with edition source preference", () => {
				const v11Settings = {
					settingsVersion: 11,
					frontmatterFields: {
						title: { enabled: true, propertyName: "myTitle" },
						cover: { enabled: true, propertyName: "cover" },
						releaseDate: { enabled: true, propertyName: "releaseDate" },
						authors: { enabled: true, propertyName: "authors" },
						contributors: { enabled: true, propertyName: "contributors" },
						description: { enabled: true, propertyName: "description" },
						review: { enabled: true, propertyName: "review" },
						quotes: { enabled: true, propertyName: "quotes" },
						series: { enabled: true, propertyName: "series" },
						publisher: { enabled: true, propertyName: "publisher" },
						genres: { enabled: true, propertyName: "genres" },
						lists: { enabled: false, propertyName: "lists" },
						url: { enabled: true, propertyName: "url" },
						isbn10: { enabled: false, propertyName: "isbn10" },
						isbn13: { enabled: false, propertyName: "isbn13" },
						rating: { enabled: true, propertyName: "rating" },
						status: { enabled: true, propertyName: "status" },
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
					},
					dataSourcePreferences: {
						titleSource: "edition",
						coverSource: "edition",
						releaseDateSource: "edition",
						authorsSource: "edition",
						contributorsSource: "edition",
					},
				} as any;

				const result = SettingsMigrationService.migrateSettings(v11Settings);

				expect(result.frontmatterFields.bookTitle).toEqual({
					enabled: false,
					propertyName: "bookTitle",
				});
				expect(result.frontmatterFields.editionTitle).toEqual({
					enabled: true,
					propertyName: "myTitle",
				});
			});
		});

		test("migrates all split fields with mixed source preferences", () => {
			const v11Settings = {
				settingsVersion: 11,
				frontmatterFields: {
					title: { enabled: true, propertyName: "bookName" },
					cover: { enabled: true, propertyName: "coverImage" },
					releaseDate: { enabled: true, propertyName: "published" },
					authors: { enabled: true, propertyName: "writers" },
					contributors: { enabled: true, propertyName: "people" },
					description: { enabled: true, propertyName: "description" },
					review: { enabled: true, propertyName: "review" },
					quotes: { enabled: true, propertyName: "quotes" },
					series: { enabled: true, propertyName: "series" },
					publisher: { enabled: true, propertyName: "publisher" },
					genres: { enabled: true, propertyName: "genres" },
					lists: { enabled: false, propertyName: "lists" },
					url: { enabled: true, propertyName: "url" },
					isbn10: { enabled: false, propertyName: "isbn10" },
					isbn13: { enabled: false, propertyName: "isbn13" },
					rating: { enabled: true, propertyName: "rating" },
					status: { enabled: true, propertyName: "status" },
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
				},
				dataSourcePreferences: {
					titleSource: "book",
					coverSource: "edition",
					releaseDateSource: "book",
					authorsSource: "edition",
					contributorsSource: "book",
				},
			} as any;

			const result = SettingsMigrationService.migrateSettings(v11Settings);

			// Title: book source
			expect(result.frontmatterFields.bookTitle).toEqual({
				enabled: true,
				propertyName: "bookName",
			});
			expect(result.frontmatterFields.editionTitle).toEqual({
				enabled: false,
				propertyName: "editionTitle",
			});

			// Cover: edition source
			expect(result.frontmatterFields.bookCover).toEqual({
				enabled: false,
				propertyName: "bookCover",
			});
			expect(result.frontmatterFields.editionCover).toEqual({
				enabled: true,
				propertyName: "coverImage",
			});

			// Release Date: book source
			expect(result.frontmatterFields.bookReleaseDate).toEqual({
				enabled: true,
				propertyName: "published",
			});
			expect(result.frontmatterFields.editionReleaseDate).toEqual({
				enabled: false,
				propertyName: "editionReleaseDate",
			});

			// Authors: edition source
			expect(result.frontmatterFields.bookAuthors).toEqual({
				enabled: false,
				propertyName: "bookAuthors",
			});
			expect(result.frontmatterFields.editionAuthors).toEqual({
				enabled: true,
				propertyName: "writers",
			});

			// Contributors: book source
			expect(result.frontmatterFields.bookContributors).toEqual({
				enabled: true,
				propertyName: "people",
			});
			expect(result.frontmatterFields.editionContributors).toEqual({
				enabled: false,
				propertyName: "editionContributors",
			});
		});

		test("extracts wikilink settings correctly", () => {
			const v11Settings = {
				settingsVersion: 11,
				frontmatterFields: {
					title: { enabled: true, propertyName: "title" },
					cover: { enabled: true, propertyName: "cover" },
					releaseDate: { enabled: true, propertyName: "releaseDate" },
					authors: { enabled: true, propertyName: "authors", wikilinks: true },
					contributors: {
						enabled: true,
						propertyName: "contributors",
						wikilinks: false,
					},
					series: { enabled: true, propertyName: "series", wikilinks: true },
					publisher: {
						enabled: true,
						propertyName: "publisher",
						wikilinks: false,
					},
					genres: { enabled: true, propertyName: "genres", wikilinks: true },
					lists: { enabled: false, propertyName: "lists", wikilinks: false },
					description: { enabled: true, propertyName: "description" },
					review: { enabled: true, propertyName: "review" },
					quotes: { enabled: true, propertyName: "quotes" },
					url: { enabled: true, propertyName: "url" },
					isbn10: { enabled: false, propertyName: "isbn10" },
					isbn13: { enabled: false, propertyName: "isbn13" },
					rating: { enabled: true, propertyName: "rating" },
					status: { enabled: true, propertyName: "status" },
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
				},
				dataSourcePreferences: {
					titleSource: "edition",
					coverSource: "edition",
					releaseDateSource: "edition",
					authorsSource: "edition",
					contributorsSource: "edition",
				},
			} as any;

			const result = SettingsMigrationService.migrateSettings(v11Settings);

			expect(result.wikilinkSettings).toEqual({
				authors: true,
				contributors: false,
				series: true,
				publisher: false,
				genres: true,
				lists: false,
			});
		});

		test("defaults wikilink settings to false when missing", () => {
			const v11Settings = {
				settingsVersion: 11,
				frontmatterFields: {
					title: { enabled: true, propertyName: "title" },
					cover: { enabled: true, propertyName: "cover" },
					releaseDate: { enabled: true, propertyName: "releaseDate" },
					authors: { enabled: true, propertyName: "authors" }, // no wikilinks property
					contributors: { enabled: true, propertyName: "contributors" },
					series: { enabled: true, propertyName: "series" },
					publisher: { enabled: true, propertyName: "publisher" },
					genres: { enabled: true, propertyName: "genres" },
					lists: { enabled: false, propertyName: "lists" },
					description: { enabled: true, propertyName: "description" },
					review: { enabled: true, propertyName: "review" },
					quotes: { enabled: true, propertyName: "quotes" },
					url: { enabled: true, propertyName: "url" },
					isbn10: { enabled: false, propertyName: "isbn10" },
					isbn13: { enabled: false, propertyName: "isbn13" },
					rating: { enabled: true, propertyName: "rating" },
					status: { enabled: true, propertyName: "status" },
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
				},
				dataSourcePreferences: {
					titleSource: "edition",
					coverSource: "edition",
					releaseDateSource: "edition",
					authorsSource: "edition",
					contributorsSource: "edition",
				},
			} as any;

			const result = SettingsMigrationService.migrateSettings(v11Settings);

			expect(result.wikilinkSettings).toEqual({
				authors: false,
				contributors: false,
				series: false,
				publisher: false,
				genres: false,
				lists: false,
			});
		});
	});
});
