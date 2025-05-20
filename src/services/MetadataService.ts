import { HARDCOVER_BOOKS_ROUTE, HARDCOVER_URL } from "src/config/constants";
import {
	BookMetadata,
	HardcoverBookSeries,
	HardcoverUserBook,
	HardcoverUserBooksReads,
	PluginSettings,
} from "src/types";

export class MetadataService {
	private settings: PluginSettings;

	constructor(settings: PluginSettings) {
		this.settings = settings;
	}

	updateSettings(settings: PluginSettings): void {
		this.settings = settings;
	}

	buildMetadata(userBook: HardcoverUserBook): BookMetadata {
		const { fieldsSettings, dataSourcePreferences } = this.settings;
		const metadata: BookMetadata = {
			// always include the Hardcover book id
			hardcoverBookId: userBook.book_id,
			bodyContent: {},
		};

		const { titleSource, coverSource, releaseDateSource } =
			dataSourcePreferences;

		const { book, edition, user_book_reads: readingActivity } = userBook;

		// add title (from book or edition based on user settings)
		const currentTitleSource = titleSource === "book" ? book : edition;
		if (currentTitleSource && currentTitleSource.title) {
			// add to frontmatter
			metadata[fieldsSettings.title.propertyName] = currentTitleSource.title;
			//add to body
			metadata.bodyContent.title = currentTitleSource.title;
		}

		// add rating if enabled and exists
		if (fieldsSettings.rating.enabled && userBook.rating !== null) {
			metadata[fieldsSettings.rating.propertyName] = `${userBook.rating}/5`;
		}

		// add status if enabled and exists
		if (fieldsSettings.status.enabled && userBook.status_id !== null) {
			metadata[fieldsSettings.status.propertyName] = this.mapStatus(
				userBook.status_id
			);
		}

		// add review to bodyContent if enabled and exists
		if (fieldsSettings.review.enabled && userBook.review_raw) {
			metadata.bodyContent.review = userBook.review_raw;
		}

		// add cover (from book or edition based on user settings)
		const currentCoverSource = coverSource === "book" ? book : edition;
		const coverUrl = currentCoverSource.cached_image?.url;
		if (fieldsSettings.cover.enabled && coverUrl) {
			// add to frontmatteer
			metadata[fieldsSettings.cover.propertyName] = coverUrl;
			// add to body
			metadata.bodyContent.coverUrl = coverUrl;
		}

		// add authors
		if (fieldsSettings.authors.enabled) {
			let authors: string[] = [];
			if (
				dataSourcePreferences.authorsSource === "book" &&
				book.cached_contributors
			) {
				authors = this.extractAuthors(book.cached_contributors);
			} else if (
				dataSourcePreferences.authorsSource === "edition" &&
				edition.cached_contributors
			) {
				authors = this.extractAuthors(edition.cached_contributors);
			}

			if (authors.length) {
				metadata[fieldsSettings.authors.propertyName] = authors;
			}
		}

		// add other contributors
		if (fieldsSettings.contributors.enabled) {
			let otherContributors: Array<{ name: string; role: string }> = [];
			if (
				dataSourcePreferences.contributorsSource === "book" &&
				book.cached_contributors
			) {
				otherContributors = this.extractContributors(book.cached_contributors);
			} else if (
				dataSourcePreferences.contributorsSource === "edition" &&
				edition.cached_contributors
			) {
				otherContributors = this.extractContributors(
					edition.cached_contributors
				);
			}

			if (otherContributors.length) {
				metadata[fieldsSettings.contributors.propertyName] =
					otherContributors.map((c) => `${c.name} (${c.role})`);
			}
		}

		// add release date (from book or edition based on user settings)
		const currentReleaseDateSource =
			releaseDateSource === "book" ? book : edition;
		if (
			fieldsSettings.releaseDate.enabled &&
			currentReleaseDateSource.release_date
		) {
			metadata[fieldsSettings.releaseDate.propertyName] =
				currentReleaseDateSource.release_date;
		}

		// add description
		if (fieldsSettings.description.enabled && book.description) {
			metadata[fieldsSettings.description.propertyName] = book.description;
		}

		// add url
		if (fieldsSettings.url.enabled && book.slug) {
			metadata[
				fieldsSettings.url.propertyName
			] = `${HARDCOVER_URL}/${HARDCOVER_BOOKS_ROUTE}/${book.slug}`;
		}

		// add publisher
		if (fieldsSettings.publisher.enabled && edition.publisher?.name) {
			metadata[fieldsSettings.publisher.propertyName] = edition.publisher.name;
		}

		// add series
		if (fieldsSettings.series.enabled && book.book_series) {
			const seriesArray = this.extractSeriesInfo(book.book_series);
			if (seriesArray.length > 0) {
				metadata[fieldsSettings.series.propertyName] = seriesArray;
			}
		}

		// add genres
		if (
			fieldsSettings.genres.enabled &&
			book.cached_tags &&
			book.cached_tags.Genre
		) {
			const genres = book.cached_tags.Genre.map((tag: any) => tag.tag).filter(
				(genre: string) => !!genre
			);

			if (genres.length > 0) {
				metadata[fieldsSettings.genres.propertyName] = genres;
			}
		}

		// add reading activity
		if (
			fieldsSettings.firstRead.enabled ||
			fieldsSettings.lastRead.enabled ||
			fieldsSettings.totalReads.enabled
		) {
			const activity = this.extractReadingActivity(readingActivity);

			// add first read
			if (fieldsSettings.firstRead.enabled && activity.firstRead) {
				metadata[fieldsSettings.firstRead.startPropertyName] =
					activity.firstRead.start;

				metadata[fieldsSettings.firstRead.endPropertyName] =
					activity.firstRead.end;
			}

			// add last read
			if (fieldsSettings.lastRead.enabled && activity.lastRead) {
				metadata[fieldsSettings.lastRead.startPropertyName] =
					activity.lastRead.start;

				metadata[fieldsSettings.lastRead.endPropertyName] =
					activity.lastRead.end;
			}

			// add number of total reads
			if (fieldsSettings.totalReads.enabled && activity.totalReads) {
				metadata[fieldsSettings.totalReads.propertyName] = activity.totalReads;
			}

			// add read years
			if (fieldsSettings.readYears.enabled && activity.readYears.length > 0) {
				metadata[fieldsSettings.readYears.propertyName] = activity.readYears;
			}
		}

		return metadata;
	}

	private mapStatus(statusId: number): string[] {
		const statusText =
			this.settings.statusMapping[statusId] || `Unknown (${statusId})`;
		// return as array so obsidian property is a list
		return [statusText];
	}

	private extractAuthors(contributorsData: Record<any, any>[]): string[] {
		if (!contributorsData || !Array.isArray(contributorsData)) {
			return [];
		}

		// filter for authors (null/empty contribution or explicitly "Author")
		const authors = contributorsData
			.filter(
				(item) =>
					!item.contribution ||
					item.contribution === "" ||
					item.contribution === "Author"
			)
			.map((item) => item.author?.name)
			.filter((name) => !!name) // remove any undefined/null names
			.slice(0, 5); // limit to 5 authors

		return authors;
	}

	private extractContributors(
		contributorsData: Record<any, any>[]
	): Array<{ name: string; role: string }> {
		if (!contributorsData || !Array.isArray(contributorsData)) {
			return [];
		}

		// Filter for non-authors (has a contribution that's not "Author")
		const contributors = contributorsData
			.filter((item) => item.contribution && item.contribution !== "Author")
			.map((item) => ({
				name: item.author?.name,
				role: this.capitalizeFirstLetter(item.contribution),
			}))
			.filter((name) => !!name) // remove any undefined/null names
			.slice(0, 5); // limit to 5 authors

		return contributors;
	}

	private extractReadingActivity(reads: HardcoverUserBooksReads[]) {
		if (!reads || !Array.isArray(reads) || reads.length === 0) {
			return { firstRead: null, lastRead: null, totalReads: 0, readYears: [] };
		}

		// create a copy of the array
		const sortedReads = [...reads];

		// sort by started_at date (oldest first)
		sortedReads.sort((a, b) => {
			const dateA = new Date(a.started_at || "");
			const dateB = new Date(b.started_at || "");
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
				// try to get the year from finished_at, fall back to started_at
				const dateStr = read.finished_at || read.started_at;
				if (!dateStr) return null;

				try {
					return new Date(dateStr).getFullYear().toString();
				} catch (e) {
					console.warn("Error parsing date:", dateStr, e);
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

	private extractSeriesInfo(seriesData: HardcoverBookSeries[]): string[] {
		if (!seriesData || !Array.isArray(seriesData) || seriesData.length === 0) {
			return [];
		}

		return seriesData
			.filter((series) => series.series?.name)
			.map((series) => {
				const seriesName = series.series.name;
				if (series.position) {
					return `${seriesName} #${series.position}`;
				}
				return seriesName;
			});
	}

	private capitalizeFirstLetter(text: string): string {
		if (!text) return "";
		return text.charAt(0).toUpperCase() + text.slice(1);
	}
}
