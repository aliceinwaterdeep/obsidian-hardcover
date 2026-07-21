export interface SyncInfo {
	userId: number;
	booksCount: number;
	userLists?: UserList[];
}

export interface HardcoverUser {
	id: number;
}

export interface GetUserIdResponse {
	me: HardcoverUser[];
}

export interface GraphQLResponse<T> {
	data?: T;
	errors?: Array<{
		message: string;
	}>;
}

export interface LibraryPageParams {
	userId: number;
	offset: number;
	limit: number;
	updatedAfter?: string;
	status?: number[];
	bookIds?: number[];
}

export interface FetchLibraryParams {
	userId: number;
	totalBooks: number;
	updatedAfter?: string;
	status?: number[];
	onProgress?: (current: number, total: number) => void;
}

export interface HardcoverUserBook {
	book_id: number;
	updated_at: string;
	rating: number | null;
	status_id: number;
	review_markdown: string | null;
	review_raw: string | null;
	book: HardcoverBook;
	edition: HardcoverEdition;
	user_book_reads: HardcoverUserBooksReads[];
	reading_journals?: ReadingJournalQuote[];
}

interface HardcoverBook {
	id: number;
	title: string;
	description: string | null;
	release_date: string;
	cached_image: HardcoverCachedImage;
	slug: string;
	cached_contributors: HardcoverContributor[];
	book_series: HardcoverBookSeries[];
	cached_tags?: {
		Genre?: Array<{
			tag: string;
			tagSlug: string;
			category: string;
			categorySlug: string;
			spoilerRatio: number;
			count: number;
		}>;
	} | null;
}

interface HardcoverEdition {
	id: number;
	title: string;
	release_date: string;
	cached_image: HardcoverCachedImage;
	cached_contributors: HardcoverContributor[];
	publisher: {
		name: string;
	};
	isbn_10: string | null;
	isbn_13: string | null;
}

export interface HardcoverCachedImage {
	url: string;
}

export interface HardcoverContributor {
	contribution: string | null;
	author: { name: string } | null;
}

export interface HardcoverUserBooksReads {
	started_at: string | null;
	finished_at: string | null;
}

export interface HardcoverBookSeries {
	series: {
		name: string;
	};
	position: number;
}

export interface UserList {
	name: string;
	list_books: Array<{
		book_id: number;
	}>;
}

export interface ReadingJournalQuote {
	entry: string;
}

export interface UserBooksQueryResponse {
	user_books: HardcoverUserBook[];
}

export interface BooksCountResponse {
	user_books_aggregate: {
		aggregate: {
			count: number;
		};
	};
}

export interface UserLibraryInfoResponse {
	me: Array<{
		id: number;
		user_books_aggregate?: {
			aggregate?: {
				count?: number;
			};
		};
		lists?: UserList[];
	}>;
}

export interface UserListsResponse {
	users_by_pk: {
		lists: UserList[];
	} | null;
}
