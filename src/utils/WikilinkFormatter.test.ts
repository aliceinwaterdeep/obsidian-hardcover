import { WikilinkFormatter } from "./WikilinkFormatter";
import { DEFAULT_SETTINGS } from "../config/defaultSettings";
import { PluginSettings } from "../types";

describe("WikilinkFormatter", () => {
	describe("formatAsWikilinks", () => {
		test("wraps plain values in wikilinks", () => {
			expect(
				WikilinkFormatter.formatAsWikilinks(["Author One"], "authors"),
			).toEqual(["[[Author One]]"]);
		});

		test("splits contributors into base name + display alias", () => {
			expect(
				WikilinkFormatter.formatAsWikilinks(
					["Translator Name (Translator)"],
					"contributors",
				),
			).toEqual(["[[Translator Name|Translator Name (Translator)]]"]);
		});

		test("splits series into base name + display alias", () => {
			expect(
				WikilinkFormatter.formatAsWikilinks(["Series Name #1"], "series"),
			).toEqual(["[[Series Name|Series Name #1]]"]);
		});

		test("falls back to plain wikilink when contributor has no role suffix", () => {
			expect(
				WikilinkFormatter.formatAsWikilinks(["No Role Here"], "contributors"),
			).toEqual(["[[No Role Here]]"]);
		});
	});

	describe("applyWikilinksIfNeeded", () => {
		const buildSettings = (
			overrides: Partial<PluginSettings["wikilinkSettings"]>,
		): PluginSettings => ({
			...JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
			wikilinkSettings: {
				...DEFAULT_SETTINGS.wikilinkSettings,
				...overrides,
			},
		});

		test("applies wikilinks to an authors array when enabled", () => {
			const settings = buildSettings({ authors: true });
			expect(
				WikilinkFormatter.applyWikilinksIfNeeded(
					["Edition Author"],
					"editionAuthors",
					settings,
				),
			).toEqual(["[[Edition Author]]"]);
		});

		test("leaves an authors array unchanged when disabled", () => {
			const settings = buildSettings({ authors: false });
			expect(
				WikilinkFormatter.applyWikilinksIfNeeded(
					["Edition Author"],
					"editionAuthors",
					settings,
				),
			).toEqual(["Edition Author"]);
		});

		test("applies wikilinks to a lists array when enabled", () => {
			const settings = buildSettings({ lists: true });
			expect(
				WikilinkFormatter.applyWikilinksIfNeeded(
					["TBR 2024", "Favorites"],
					"lists",
					settings,
				),
			).toEqual(["[[TBR 2024]]", "[[Favorites]]"]);
		});

		test("applies a single wikilink to publisher when enabled", () => {
			const settings = buildSettings({ publisher: true });
			expect(
				WikilinkFormatter.applyWikilinksIfNeeded(
					"Publisher Name",
					"publisher",
					settings,
				),
			).toBe("[[Publisher Name]]");
		});

		test("ignores fields with no wikilink setting", () => {
			const settings = buildSettings({});
			expect(
				WikilinkFormatter.applyWikilinksIfNeeded(
					"Some Title",
					"editionTitle",
					settings,
				),
			).toBe("Some Title");
		});

		test("passes through falsy values unchanged", () => {
			const settings = buildSettings({ authors: true });
			expect(
				WikilinkFormatter.applyWikilinksIfNeeded(
					undefined,
					"editionAuthors",
					settings,
				),
			).toBeUndefined();
		});
	});
});
