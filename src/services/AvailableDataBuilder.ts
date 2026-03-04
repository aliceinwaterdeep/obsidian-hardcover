import { HARDCOVER_BOOKS_ROUTE, HARDCOVER_URL } from "src/config/constants";
import { BookMetadata, HardcoverUserBook, PluginSettings } from "src/types";
import { FileUtils } from "src/utils/FileUtils";
import {
	extractAuthors,
	extractContributors,
	extractReadingActivity,
	extractSeriesInfo,
} from "./metadata/MetadataHelpers";

export class AvailableDataBuilder {
	private settings: PluginSettings;
	private fileUtils: FileUtils;

	constructor(settings: PluginSettings, fileUtils: FileUtils) {
		this.settings = settings;
		this.fileUtils = fileUtils;
	}

	updateSettings(settings: PluginSettings): void {
		this.settings = settings;
	}

	build(
		userBook: HardcoverUserBook,
		bookToListsMap?: Map<number, string[]> | null,
	): BookMetadata["availableData"] {
		const { frontmatterFields } = this.settings;
		const availableData: BookMetadata["availableData"] = {};

		const { book, edition, user_book_reads: readingActivity } = userBook;

		// Book title
		if (book?.title) {
			availableData.bookTitle = this.fileUtils.normalizeText(book.title);
		}

		// Edition title
		if (edition?.title) {
			availableData.editionTitle = this.fileUtils.normalizeText(edition.title);
		}

		// Rating
		if (userBook.rating !== null) {
			availableData.rating = userBook.rating;
		}

		// Status
		if (userBook.status_id !== null) {
			// reuse the status mapping from settings
			const statusText =
				this.settings.statusMapping[userBook.status_id] ||
				`Unknown (${userBook.status_id})`;
			availableData.status = [statusText];
		}

		// Review
		let userReview;
		if (userBook.review && userBook.review.trim()) {
			userReview = userBook.review;
		} else if (userBook.review_raw && userBook.review_raw.trim()) {
			userReview = userBook.review_raw;
		}

		availableData.review = userReview;

		// Quotes
		if (userBook.reading_journals) {
			const quotes = userBook.reading_journals.map((q) => q.entry);
			if (quotes.length > 0) {
				availableData.quotes = quotes;
			}
		}

		// Book cover
		if (book?.cached_image?.url) {
			availableData.bookCover = book.cached_image.url;
		}

		// Edition cover
		if (edition?.cached_image?.url) {
			availableData.editionCover = edition.cached_image.url;
		}

		// Book authors
		if (book?.cached_contributors) {
			const authors = extractAuthors(book.cached_contributors);
			if (authors.length) {
				availableData.bookAuthors = authors;
			}
		}

		// Edition authors
		if (edition?.cached_contributors) {
			const authors = extractAuthors(edition.cached_contributors);
			if (authors.length) {
				availableData.editionAuthors = authors;
			}
		}

		// Book contributors
		if (book?.cached_contributors) {
			const otherContributors = extractContributors(
				book.cached_contributors,
				this.fileUtils,
			);
			if (otherContributors.length) {
				availableData.bookContributors = otherContributors.map(
					(c) => `${c.name} (${c.role})`,
				);
			}
		}

		// Edition contributors
		if (edition?.cached_contributors) {
			const otherContributors = extractContributors(
				edition.cached_contributors,
				this.fileUtils,
			);
			if (otherContributors.length) {
				availableData.editionContributors = otherContributors.map(
					(c) => `${c.name} (${c.role})`,
				);
			}
		}

		// Book release date
		if (book?.release_date) {
			availableData.bookReleaseDate = book.release_date;
		}

		// Edition release date
		if (edition?.release_date) {
			availableData.editionReleaseDate = edition.release_date;
		}

		// Description
		if (book.description) {
			availableData.description = book.description;
		}

		// URL
		const bookUrl = book.slug
			? `${HARDCOVER_URL}/${HARDCOVER_BOOKS_ROUTE}/${book.slug}`
			: undefined;

		if (bookUrl) {
			availableData.url = bookUrl;
		}

		// Publisher   (as array)
		if (edition.publisher?.name) {
			availableData.publisher = [
				this.fileUtils.normalizeText(edition.publisher.name),
			];
		}

		// ISBN-10
		if (edition.isbn_10) {
			availableData.isbn10 = edition.isbn_10;
		}

		// ISBN-13
		if (edition.isbn_13) {
			availableData.isbn13 = edition.isbn_13;
		}

		// Series
		if (book.book_series) {
			const seriesArray = extractSeriesInfo(book.book_series, this.fileUtils);
			if (seriesArray.length > 0) {
				availableData.series = seriesArray;
			}
		}

		// Genres
		if (book.cached_tags && book.cached_tags.Genre) {
			const genres = book.cached_tags.Genre.map((tag: any) => tag.tag).filter(
				(genre: string) => !!genre,
			);

			if (genres.length > 0) {
				availableData.genres = genres;
			}
		}

		// Lists
		if (bookToListsMap) {
			const lists = bookToListsMap.get(userBook.book_id);
			if (lists && lists.length > 0) {
				availableData.lists = lists;
			}
		}

		// Reading activity - add raw values first (direct from array)
		if (readingActivity && readingActivity.length > 0) {
			const firstRead = readingActivity[0];
			const lastRead = readingActivity[readingActivity.length - 1];

			if (firstRead.started_at) {
				availableData.firstReadStart = firstRead.started_at;
			}
			if (firstRead.finished_at) {
				availableData.firstReadEnd = firstRead.finished_at;
			}
			if (lastRead.started_at) {
				availableData.lastReadStart = lastRead.started_at;
			}
			if (lastRead.finished_at) {
				availableData.lastReadEnd = lastRead.finished_at;
			}

			availableData.totalReads = readingActivity.length;
		}

		// Reading activity
		if (readingActivity && readingActivity.length > 0) {
			const activity = extractReadingActivity(readingActivity);

			if (activity.firstRead) {
				if (activity.firstRead.start) {
					availableData.firstReadStart = activity.firstRead.start;
				}
				if (activity.firstRead.end) {
					availableData.firstReadEnd = activity.firstRead.end;
				}
			}

			if (activity.lastRead) {
				if (activity.lastRead.start) {
					availableData.lastReadStart = activity.lastRead.start;
				}
				if (activity.lastRead.end) {
					availableData.lastReadEnd = activity.lastRead.end;
				}
			}

			if (activity.totalReads) {
				availableData.totalReads = activity.totalReads;
			}

			if (activity.readYears && activity.readYears.length > 0) {
				// readYears are strings from extractReadingActivity, convert to numbers
				availableData.readYears = activity.readYears.map((year) =>
					parseInt(year, 10),
				);
			}
		}

		return availableData;
	}
}
