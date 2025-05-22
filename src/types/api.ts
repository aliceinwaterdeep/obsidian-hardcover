// Node.js network error type
export interface NodeNetworkError extends Error {
	code?: string;
	errno?: number;
	syscall?: string;
	hostname?: string;
	host?: string;
	port?: number;
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
}

export interface FetchLibraryParams {
	userId: number;
	totalBooks: number;
	updatedAfter?: string;
	onProgress?: (current: number, total: number) => void;
}

export interface HardcoverUserBook {
	book_id: number;
	updated_at: string;
	rating: number | null;
	status_id: number;
	review: string | null;
	review_raw: string | null;
	book: HardcoverBook;
	edition: HardcoverEdition;
	user_book_reads: HardcoverUserBooksReads[];
}

interface HardcoverBook {
	title: string;
	description: string | null;
	release_date: string;
	cached_image: Record<string, any>;
	slug: string;
	cached_contributors: Record<string, any>[];
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
	title: string;
	release_date: string;
	cached_image: Record<string, any>;
	cached_contributors: Record<string, any>[];
	publisher: {
		name: string;
	};
}

export interface HardcoverUserBooksReads {
	started_at: string;
	finished_at: string;
}

export interface HardcoverBookSeries {
	series: {
		name: string;
	};
	position: number;
}
