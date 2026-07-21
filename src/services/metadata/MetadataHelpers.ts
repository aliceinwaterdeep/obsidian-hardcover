import { HardcoverBookSeries, HardcoverUserBooksReads } from "src/types";
import { FileUtils } from "src/utils/FileUtils";

function hasNameAsRole(contributorsData: Record<any, any>[]): boolean {
	// hc metadata workaround: check if there's only one contributor and their role is their own name
	return (
		contributorsData.length === 1 &&
		contributorsData[0].contribution === contributorsData[0].author?.name
	);
}

function capitalizeFirstLetter(text: string): string {
	if (!text) return "";
	return text.charAt(0).toUpperCase() + text.slice(1);
}

export function extractAuthors(contributorsData: Record<any, any>[]): string[] {
	if (!contributorsData || !Array.isArray(contributorsData)) {
		return [];
	}

	// filter for authors (null/empty contribution or explicitly "Author")
	const authors = contributorsData
		.filter(
			(item) =>
				!item.contribution ||
				item.contribution === "" ||
				item.contribution === "Author" ||
				hasNameAsRole(contributorsData), // treat as author
		)
		.map((item) => item.author?.name)
		.filter((name) => !!name) // remove any undefined/null names
		.slice(0, 5); // limit to 5 authors

	return authors;
}

export function extractContributors(
	contributorsData: Record<any, any>[],
	fileUtils: FileUtils,
): Array<{ name: string; role: string }> {
	if (!contributorsData || !Array.isArray(contributorsData)) {
		return [];
	}

	if (hasNameAsRole(contributorsData)) {
		// treated as author, exclude from contributors
		return [];
	}

	// Filter for non-authors (has a contribution that's not "Author")
	const contributors = contributorsData
		.filter((item) => item.contribution && item.contribution !== "Author")
		.map((item) => ({
			name: fileUtils.normalizeText(item.author?.name || ""),
			role: capitalizeFirstLetter(item.contribution),
		}))
		.filter((name) => !!name) // remove any undefined/null names
		.slice(0, 5); // limit to 5 authors

	return contributors;
}

export function extractSeriesInfo(
	seriesData: HardcoverBookSeries[],
	fileUtils: FileUtils,
): string[] {
	if (!seriesData || !Array.isArray(seriesData) || seriesData.length === 0) {
		return [];
	}

	return seriesData
		.filter((series) => series.series?.name)
		.map((series) => {
			const seriesName = fileUtils.normalizeText(series.series.name);

			if (series.position) {
				return `${seriesName} #${series.position}`;
			}
			return seriesName;
		});
}

export function extractReadingActivity(reads: HardcoverUserBooksReads[]) {
	if (!reads || !Array.isArray(reads) || reads.length === 0) {
		return { firstRead: null, lastRead: null, totalReads: 0, readYears: [] };
	}

	// only completed reads count: an in progress read (started but not finished) shouldn't be counted as a (re)read
	const completedReads = reads.filter(
		(read): read is HardcoverUserBooksReads & { finished_at: string } =>
			!!read.finished_at,
	);

	if (completedReads.length === 0) {
		return { firstRead: null, lastRead: null, totalReads: 0, readYears: [] };
	}

	// create a copy of the array
	const sortedReads = [...completedReads];

	// sort by finished_at date (oldest first)
	sortedReads.sort((a, b) => {
		const dateA = new Date(a.finished_at);
		const dateB = new Date(b.finished_at);
		return dateA.getTime() - dateB.getTime();
	});

	// first read is the oldest - first after sorting
	const firstRead = sortedReads[0];

	// last read is the newest - last after sorting
	const lastRead = sortedReads[sortedReads.length - 1];

	const totalReads = sortedReads.length;

	// extract array of unique years from reading activity
	const readYears = sortedReads
		.map((read) => {
			try {
				return new Date(read.finished_at).getFullYear().toString();
			} catch (e) {
				console.warn("Error parsing date:", read.finished_at, e);
				return null;
			}
		})
		.filter((year): year is string => year !== null)
		.filter((year, index, self) => self.indexOf(year) === index)
		.sort();

	return {
		firstRead: {
			start: firstRead.started_at || null,
			end: firstRead.finished_at || null,
		},
		lastRead: {
			start: lastRead.started_at || null,
			end: lastRead.finished_at || null,
		},
		totalReads,
		readYears,
	};
}
