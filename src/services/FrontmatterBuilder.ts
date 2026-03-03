import { HARDCOVER_BOOKS_ROUTE, HARDCOVER_URL } from "src/config/constants";
import { HardcoverUserBook, PluginSettings } from "src/types";
import { FileUtils } from "src/utils/FileUtils";
import {
	extractAuthors,
	extractContributors,
	extractReadingActivity,
	extractSeriesInfo,
} from "./metadata/MetadataHelpers";

export class FrontmatterBuilder {
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
	): { frontmatter: Record<string, any>; rawContributors?: Record<any, any>[] } {
		const { frontmatterFields } = this.settings;
		const frontmatter: Record<string, any> = {};
		let rawContributors: Record<any, any>[] | undefined;

		const { book, edition, user_book_reads: readingActivity } = userBook;

		// Book title
		if (book?.title && frontmatterFields.bookTitle.enabled) {
			frontmatter[frontmatterFields.bookTitle.propertyName] =
				this.fileUtils.normalizeText(book.title);
		}

		// Edition title
		if (edition?.title && frontmatterFields.editionTitle.enabled) {
			frontmatter[frontmatterFields.editionTitle.propertyName] =
				this.fileUtils.normalizeText(edition.title);
		}

		// Rating
		if (userBook.rating !== null && frontmatterFields.rating.enabled) {
			frontmatter[frontmatterFields.rating.propertyName] = userBook.rating;
		}

		// Status
		if (userBook.status_id !== null && frontmatterFields.status.enabled) {
			frontmatter[frontmatterFields.status.propertyName] = this.mapStatus(
				userBook.status_id,
			);
		}

		// Book cover
		if (book?.cached_image?.url && frontmatterFields.bookCover.enabled) {
			frontmatter[frontmatterFields.bookCover.propertyName] =
				book.cached_image.url;
		}

		// Edition cover
		if (edition?.cached_image?.url && frontmatterFields.editionCover.enabled) {
			frontmatter[frontmatterFields.editionCover.propertyName] =
				edition.cached_image.url;
		}

		// Book authors
		if (book?.cached_contributors) {
			const authors = extractAuthors(book.cached_contributors);
			rawContributors = book.cached_contributors;

			if (frontmatterFields.bookAuthors.enabled && authors.length) {
				frontmatter[frontmatterFields.bookAuthors.propertyName] = authors;
			}
		}

		// Edition authors
		if (edition?.cached_contributors) {
			const authors = extractAuthors(edition.cached_contributors);
			// set fallback if book authors weren't available
			if (!rawContributors) {
				rawContributors = edition.cached_contributors;
			}

			if (frontmatterFields.editionAuthors.enabled && authors.length) {
				frontmatter[frontmatterFields.editionAuthors.propertyName] = authors;
			}
		}

		// Book contributors
		if (book?.cached_contributors) {
			const otherContributors = extractContributors(
				book.cached_contributors,
				this.fileUtils,
			);

			if (
				frontmatterFields.bookContributors.enabled &&
				otherContributors.length
			) {
				frontmatter[frontmatterFields.bookContributors.propertyName] =
					otherContributors.map((c) => `${c.name} (${c.role})`);
			}
		}

		// Edition contributors
		if (edition?.cached_contributors) {
			const otherContributors = extractContributors(
				edition.cached_contributors,
				this.fileUtils,
			);

			if (
				frontmatterFields.editionContributors.enabled &&
				otherContributors.length
			) {
				frontmatter[frontmatterFields.editionContributors.propertyName] =
					otherContributors.map((c) => `${c.name} (${c.role})`);
			}
		}

		// Book release date
		if (book?.release_date && frontmatterFields.bookReleaseDate.enabled) {
			frontmatter[frontmatterFields.bookReleaseDate.propertyName] =
				book.release_date;
		}

		// Edition release date
		if (edition?.release_date && frontmatterFields.editionReleaseDate.enabled) {
			frontmatter[frontmatterFields.editionReleaseDate.propertyName] =
				edition.release_date;
		}

		// Description
		if (frontmatterFields.description.enabled && book.description) {
			frontmatter[frontmatterFields.description.propertyName] =
				book.description;
		}

		// URL
		const bookUrl = book.slug
			? `${HARDCOVER_URL}/${HARDCOVER_BOOKS_ROUTE}/${book.slug}`
			: undefined;

		if (frontmatterFields.url.enabled && bookUrl) {
			frontmatter[frontmatterFields.url.propertyName] = bookUrl;
		}

		// Publisher
		if (edition.publisher?.name) {
			const publisherValue = this.fileUtils.normalizeText(
				edition.publisher.name,
			);

			if (frontmatterFields.publisher.enabled) {
				frontmatter[frontmatterFields.publisher.propertyName] = [
					publisherValue,
				];
			}
		}

		// ISBN-10
		if (frontmatterFields.isbn10.enabled && edition.isbn_10) {
			frontmatter[frontmatterFields.isbn10.propertyName] = edition.isbn_10;
		}

		// ISBN-13
		if (frontmatterFields.isbn13.enabled && edition.isbn_13) {
			frontmatter[frontmatterFields.isbn13.propertyName] = edition.isbn_13;
		}

		// Series
		if (book.book_series) {
			const seriesArray = extractSeriesInfo(book.book_series, this.fileUtils);

			if (seriesArray.length > 0 && frontmatterFields.series.enabled) {
				frontmatter[frontmatterFields.series.propertyName] = seriesArray;
			}
		}

		// Genres
		if (book.cached_tags && book.cached_tags.Genre) {
			const genres = book.cached_tags.Genre.map((tag: any) => tag.tag).filter(
				(genre: string) => !!genre,
			);

			if (genres.length > 0 && frontmatterFields.genres.enabled) {
				frontmatter[frontmatterFields.genres.propertyName] = genres;
			}
		}

		// Lists
		if (bookToListsMap) {
			const lists = bookToListsMap.get(userBook.book_id);
			if (lists && lists.length > 0 && frontmatterFields.lists.enabled) {
				frontmatter[frontmatterFields.lists.propertyName] = lists;
			}
		}

		// Reading activity
		if (
			frontmatterFields.firstRead.enabled ||
			frontmatterFields.lastRead.enabled ||
			frontmatterFields.totalReads.enabled
		) {
			const activity = extractReadingActivity(readingActivity);

			// add first read
			if (frontmatterFields.firstRead.enabled && activity.firstRead) {
				frontmatter[frontmatterFields.firstRead.startPropertyName] =
					activity.firstRead.start;

				frontmatter[frontmatterFields.firstRead.endPropertyName] =
					activity.firstRead.end;
			}

			// add last read
			if (frontmatterFields.lastRead.enabled && activity.lastRead) {
				frontmatter[frontmatterFields.lastRead.startPropertyName] =
					activity.lastRead.start;

				frontmatter[frontmatterFields.lastRead.endPropertyName] =
					activity.lastRead.end;
			}

			// add number of total reads
			if (frontmatterFields.totalReads.enabled && activity.totalReads) {
				frontmatter[frontmatterFields.totalReads.propertyName] =
					activity.totalReads;
			}

			// add read years
			if (
				frontmatterFields.readYears.enabled &&
				activity.readYears.length > 0
			) {
				frontmatter[frontmatterFields.readYears.propertyName] =
					activity.readYears;
			}
		}

		return { frontmatter, rawContributors };
	}

	private mapStatus(statusId: number): string[] {
		const statusText =
			this.settings.statusMapping[statusId] || `Unknown (${statusId})`;
		// return as array so obsidian property is a list
		return [statusText];
	}
}
