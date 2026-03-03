import { HARDCOVER_BOOKS_ROUTE, HARDCOVER_URL } from "src/config/constants";
import {
	BookMetadata,
	BookMetadataWithContributors,
	FrontmatterFieldsSettings,
	HardcoverBookSeries,
	HardcoverUserBook,
	HardcoverUserBooksReads,
	PluginSettings,
} from "src/types";
import { FileUtils } from "src/utils/FileUtils";

export class MetadataService {
	private settings: PluginSettings;
	private fileUtils: FileUtils;

	constructor(settings: PluginSettings, fileUtils: FileUtils) {
		this.settings = settings;
		this.fileUtils = fileUtils;
	}

	updateSettings(settings: PluginSettings): void {
		this.settings = settings;
	}

	buildMetadata(
		userBook: HardcoverUserBook,
		bookToListsMap?: Map<number, string[]> | null,
	): BookMetadataWithContributors {
		const { frontmatterFields } = this.settings;
		const metadata: BookMetadata = {
			// always include the Hardcover book id
			hardcoverBookId: userBook.book_id,
			bodyContent: {},
		};

		let rawContributorsForFallback: Record<any, any>[] | undefined;

		const { book, edition, user_book_reads: readingActivity } = userBook;

		// Book title
		if (book?.title) {
			const normalizedTitle = this.fileUtils.normalizeText(book.title);

			// add to frontmatter if enabled
			if (frontmatterFields.bookTitle.enabled) {
				metadata[frontmatterFields.bookTitle.propertyName] = normalizedTitle;
			}

			// always add to bodyContent for template access
			metadata.bodyContent.bookTitle = normalizedTitle;
		}

		// Edition title
		if (edition?.title) {
			const normalizedTitle = this.fileUtils.normalizeText(edition.title);

			// add to frontmatter if enabled
			if (frontmatterFields.editionTitle.enabled) {
				metadata[frontmatterFields.editionTitle.propertyName] = normalizedTitle;
			}

			// always add to bodyContent for template access
			metadata.bodyContent.editionTitle = normalizedTitle;
		}

		// add rating if enabled and exists
		if (userBook.rating !== null) {
			if (frontmatterFields.rating.enabled) {
				metadata[frontmatterFields.rating.propertyName] = userBook.rating;
			}

			// always add to bodyContent
			metadata.bodyContent.rating = userBook.rating;
		}

		// add status if enabled and exists
		if (userBook.status_id !== null) {
			const statusArray = this.mapStatus(userBook.status_id);

			if (frontmatterFields.status.enabled) {
				metadata[frontmatterFields.status.propertyName] = statusArray;
			}

			// always add to bodyContent
			metadata.bodyContent.status = statusArray;
		}

		// add review to bodyContent if enabled and exists
		if (frontmatterFields.review.enabled) {
			let userReview;
			if (userBook.review && userBook.review.trim()) {
				userReview = userBook.review;
			} else if (userBook.review_raw && userBook.review_raw.trim()) {
				userReview = userBook.review_raw;
			}

			metadata.bodyContent.review = userReview;
		}

		// add quotes to bodyContent if enabled and exists
		if (frontmatterFields.quotes.enabled && userBook.reading_journals) {
			const quotes = userBook.reading_journals.map((q) => q.entry);
			if (quotes.length > 0) {
				metadata.bodyContent.quotes = quotes;
			}
		}

		// Book cover
		if (book?.cached_image?.url) {
			const coverUrl = book.cached_image.url;

			// add to frontmatter if enabled
			if (frontmatterFields.bookCover.enabled) {
				metadata[frontmatterFields.bookCover.propertyName] = coverUrl;
			}

			// always add to bodyContent
			metadata.bodyContent.bookCover = coverUrl;
		}

		// Edition cover
		if (edition?.cached_image?.url) {
			const coverUrl = edition.cached_image.url;

			// add to frontmatter if enabled
			if (frontmatterFields.editionCover.enabled) {
				metadata[frontmatterFields.editionCover.propertyName] = coverUrl;
			}

			// always add to bodyContent
			metadata.bodyContent.editionCover = coverUrl;
		}

		// Book authors
		if (book?.cached_contributors) {
			const authors = this.extractAuthors(book.cached_contributors);
			rawContributorsForFallback = book.cached_contributors;

			// add to frontmatter if enabled
			if (frontmatterFields.bookAuthors.enabled && authors.length) {
				metadata[frontmatterFields.bookAuthors.propertyName] = authors;
			}

			// always add to bodyContent
			if (authors.length) {
				metadata.bodyContent.bookAuthors = authors;
			}
		}

		// Edition authors
		if (edition?.cached_contributors) {
			const authors = this.extractAuthors(edition.cached_contributors);
			// set fallback if book authors weren't available
			if (!rawContributorsForFallback) {
				rawContributorsForFallback = edition.cached_contributors;
			}

			// add to frontmatter if enabled
			if (frontmatterFields.editionAuthors.enabled && authors.length) {
				metadata[frontmatterFields.editionAuthors.propertyName] = authors;
			}

			// always add to bodyContent
			if (authors.length) {
				metadata.bodyContent.editionAuthors = authors;
			}
		}

		// Book contributors
		if (book?.cached_contributors) {
			const otherContributors = this.extractContributors(
				book.cached_contributors,
			);

			// add to frontmatter if enabled
			if (
				frontmatterFields.bookContributors.enabled &&
				otherContributors.length
			) {
				const contributorStrings = otherContributors.map(
					(c) => `${c.name} (${c.role})`,
				);
				metadata[frontmatterFields.bookContributors.propertyName] =
					contributorStrings;
			}

			// always add to bodyContent
			if (otherContributors.length) {
				const contributorStrings = otherContributors.map(
					(c) => `${c.name} (${c.role})`,
				);
				metadata.bodyContent.bookContributors = contributorStrings;
			}
		}

		// Edition contributors
		if (edition?.cached_contributors) {
			const otherContributors = this.extractContributors(
				edition.cached_contributors,
			);

			// add to frontmatter if enabled
			if (
				frontmatterFields.editionContributors.enabled &&
				otherContributors.length
			) {
				const contributorStrings = otherContributors.map(
					(c) => `${c.name} (${c.role})`,
				);
				metadata[frontmatterFields.editionContributors.propertyName] =
					contributorStrings;
			}

			// always add to bodyContent
			if (otherContributors.length) {
				const contributorStrings = otherContributors.map(
					(c) => `${c.name} (${c.role})`,
				);
				metadata.bodyContent.editionContributors = contributorStrings;
			}
		}

		// Book release date
		if (book?.release_date) {
			// add to frontmatter if enabled
			if (frontmatterFields.bookReleaseDate.enabled) {
				metadata[frontmatterFields.bookReleaseDate.propertyName] =
					book.release_date;
			}

			// always add to bodyContent
			metadata.bodyContent.bookReleaseDate = book.release_date;
		}

		// Edition release date
		if (edition?.release_date) {
			// add to frontmatter if enabled
			if (frontmatterFields.editionReleaseDate.enabled) {
				metadata[frontmatterFields.editionReleaseDate.propertyName] =
					edition.release_date;
			}

			// always add to bodyContent
			metadata.bodyContent.editionReleaseDate = edition.release_date;
		}

		// add description
		if (frontmatterFields.description.enabled && book.description) {
			metadata[frontmatterFields.description.propertyName] = book.description;
		}

		// always add to bodyContent
		if (book.description) {
			metadata.bodyContent.description = book.description;
		}

		// add url
		const bookUrl = book.slug
			? `${HARDCOVER_URL}/${HARDCOVER_BOOKS_ROUTE}/${book.slug}`
			: undefined;

		if (frontmatterFields.url.enabled && bookUrl) {
			metadata[frontmatterFields.url.propertyName] = bookUrl;
		}

		// always add to bodyContent
		if (bookUrl) {
			metadata.bodyContent.url = bookUrl;
		}

		// add publisher
		if (edition.publisher?.name) {
			const publisherValue = this.fileUtils.normalizeText(
				edition.publisher.name,
			);

			if (frontmatterFields.publisher.enabled) {
				metadata[frontmatterFields.publisher.propertyName] = [publisherValue];
			}

			// always add to bodyContent (as array)
			metadata.bodyContent.publisher = [publisherValue];
		}

		// add isbn-10
		if (frontmatterFields.isbn10.enabled && edition.isbn_10) {
			metadata[frontmatterFields.isbn10.propertyName] = edition.isbn_10;
		}

		// always add to bodyContent
		if (edition.isbn_10) {
			metadata.bodyContent.isbn10 = edition.isbn_10;
		}

		// add isbn-13
		if (frontmatterFields.isbn13.enabled && edition.isbn_13) {
			metadata[frontmatterFields.isbn13.propertyName] = edition.isbn_13;
		}

		// always add to bodyContent
		if (edition.isbn_13) {
			metadata.bodyContent.isbn13 = edition.isbn_13;
		}

		// add series
		if (book.book_series) {
			const seriesArray = this.extractSeriesInfo(book.book_series);

			if (seriesArray.length > 0) {
				if (frontmatterFields.series.enabled) {
					metadata[frontmatterFields.series.propertyName] = seriesArray;
				}

				// always add to bodyContent
				metadata.bodyContent.series = seriesArray;
			}
		}

		// add genres
		if (book.cached_tags && book.cached_tags.Genre) {
			const genres = book.cached_tags.Genre.map((tag: any) => tag.tag).filter(
				(genre: string) => !!genre,
			);

			if (genres.length > 0) {
				if (frontmatterFields.genres.enabled) {
					metadata[frontmatterFields.genres.propertyName] = genres;
				}

				// always add to bodyContent
				metadata.bodyContent.genres = genres;
			}
		}

		// add lists
		if (bookToListsMap) {
			const lists = bookToListsMap.get(userBook.book_id);
			if (lists && lists.length > 0) {
				if (frontmatterFields.lists.enabled) {
					metadata[frontmatterFields.lists.propertyName] = lists;
				}

				// always add to bodyContent
				metadata.bodyContent.lists = lists;
			}
		}

		// add reading activity
		if (
			frontmatterFields.firstRead.enabled ||
			frontmatterFields.lastRead.enabled ||
			frontmatterFields.totalReads.enabled
		) {
			const activity = this.extractReadingActivity(readingActivity);

			// add first read
			if (frontmatterFields.firstRead.enabled && activity.firstRead) {
				metadata[frontmatterFields.firstRead.startPropertyName] =
					activity.firstRead.start;

				metadata[frontmatterFields.firstRead.endPropertyName] =
					activity.firstRead.end;
			}

			// add last read
			if (frontmatterFields.lastRead.enabled && activity.lastRead) {
				metadata[frontmatterFields.lastRead.startPropertyName] =
					activity.lastRead.start;

				metadata[frontmatterFields.lastRead.endPropertyName] =
					activity.lastRead.end;
			}

			// add number of total reads
			if (frontmatterFields.totalReads.enabled && activity.totalReads) {
				metadata[frontmatterFields.totalReads.propertyName] =
					activity.totalReads;
			}

			// add read years
			if (
				frontmatterFields.readYears.enabled &&
				activity.readYears.length > 0
			) {
				metadata[frontmatterFields.readYears.propertyName] = activity.readYears;
			}
		}

		// add reading activity to bodyContent
		if (readingActivity && readingActivity.length > 0) {
			const firstRead = readingActivity[0];
			const lastRead = readingActivity[readingActivity.length - 1];

			if (firstRead.started_at) {
				metadata.bodyContent.firstReadStart = firstRead.started_at;
			}
			if (firstRead.finished_at) {
				metadata.bodyContent.firstReadEnd = firstRead.finished_at;
			}
			if (lastRead.started_at) {
				metadata.bodyContent.lastReadStart = lastRead.started_at;
			}
			if (lastRead.finished_at) {
				metadata.bodyContent.lastReadEnd = lastRead.finished_at;
			}

			metadata.bodyContent.totalReads = readingActivity.length;
		}

		// add reading activity to bodyContent
		if (readingActivity && readingActivity.length > 0) {
			const activity = this.extractReadingActivity(readingActivity);

			if (activity.firstRead) {
				if (activity.firstRead.start) {
					metadata.bodyContent.firstReadStart = activity.firstRead.start;
				}
				if (activity.firstRead.end) {
					metadata.bodyContent.firstReadEnd = activity.firstRead.end;
				}
			}

			if (activity.lastRead) {
				if (activity.lastRead.start) {
					metadata.bodyContent.lastReadStart = activity.lastRead.start;
				}
				if (activity.lastRead.end) {
					metadata.bodyContent.lastReadEnd = activity.lastRead.end;
				}
			}

			if (activity.totalReads) {
				metadata.bodyContent.totalReads = activity.totalReads;
			}

			if (activity.readYears && activity.readYears.length > 0) {
				// readYears are strings from extractReadingActivity, convert to numbers
				metadata.bodyContent.readYears = activity.readYears.map((year) =>
					parseInt(year, 10),
				);
			}
		}

		return { metadata, rawContributors: rawContributorsForFallback };
	}

	private mapStatus(statusId: number): string[] {
		const statusText =
			this.settings.statusMapping[statusId] || `Unknown (${statusId})`;
		// return as array so obsidian property is a list
		return [statusText];
	}

	private hasNameAsRole(contributorsData: Record<any, any>[]): boolean {
		// hc metadata workaround: check if there's only one contributor and their role is their own name
		return (
			contributorsData.length === 1 &&
			contributorsData[0].contribution === contributorsData[0].author?.name
		);
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
					item.contribution === "Author" ||
					this.hasNameAsRole(contributorsData), // treat as author
			)
			.map((item) => item.author?.name)
			.filter((name) => !!name) // remove any undefined/null names
			.slice(0, 5); // limit to 5 authors

		return authors;
	}

	private extractContributors(
		contributorsData: Record<any, any>[],
	): Array<{ name: string; role: string }> {
		if (!contributorsData || !Array.isArray(contributorsData)) {
			return [];
		}

		if (this.hasNameAsRole(contributorsData)) {
			// treated as author, exclude from contributors
			return [];
		}

		// Filter for non-authors (has a contribution that's not "Author")
		const contributors = contributorsData
			.filter((item) => item.contribution && item.contribution !== "Author")
			.map((item) => ({
				name: this.fileUtils.normalizeText(item.author?.name || ""),
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
				const seriesName = this.fileUtils.normalizeText(series.series.name);

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
