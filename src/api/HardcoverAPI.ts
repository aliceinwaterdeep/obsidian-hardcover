import { requestUrl } from "obsidian";

import {
	LibraryPageParams,
	FetchLibraryParams,
	PluginSettings,
	UserList,
} from "../types";
import { GetUserIdResponse, GraphQLResponse, HardcoverUser } from "src/types";
import { QueryBuilder } from "./QueryBuilder";
import { RateLimiter, LogCallback } from "./RateLimiter";
import { HARDCOVER_API } from "src/config/constants";
import ObsidianHardcover from "src/main";

export interface SyncInfo {
	userId: number;
	booksCount: number;
	userLists?: UserList[];
}

export type StatusCallback = (message: string) => void;

export class HardcoverAPI {
	private settings: PluginSettings;
	private queryBuilder: QueryBuilder;
	private plugin: ObsidianHardcover;
	private rateLimiter: RateLimiter;
	private statusCallback: StatusCallback | null = null;

	constructor(plugin: ObsidianHardcover) {
		this.queryBuilder = new QueryBuilder(plugin.settings);
		this.plugin = plugin;
		this.settings = plugin.settings;
		this.rateLimiter = new RateLimiter();
	}

	/**
	 * Set a callback for status updates (shown in the sync notice).
	 */
	setStatusCallback(callback: StatusCallback | null): void {
		this.statusCallback = callback;

		// Also set up debug logging for the rate limiter
		if (callback && this.settings.debugLogging) {
			this.rateLimiter.setLogCallback((msg) => {
				this.debugLog(msg);
				callback(msg);
			});
		} else {
			this.rateLimiter.setLogCallback(null);
		}
	}

	private debugLog(message: string): void {
		if (this.settings.debugLogging) {
			console.log(`[Hardcover Sync] ${message}`);
		}
	}

	private updateStatus(message: string): void {
		if (this.statusCallback) {
			this.statusCallback(message);
		}
		this.debugLog(message);
	}

	// Update the query if settings change
	updateSettings(settings: PluginSettings) {
		this.settings = settings;
		this.queryBuilder = new QueryBuilder(settings); // update query builder
	}

	async graphqlRequest<T>(query: string, variables?: any): Promise<any> {
		// console.log(query);

		const body = JSON.stringify({
			query,
			variables,
		});
		// use resolved API key, or fall back to settings
		let apiKey = await this.plugin.getApiKey();

		if (!apiKey || apiKey == "") {
			throw new Error(
				"No API key configured. Please set HARDCOVER_API_KEY in .env file or plugin settings."
			);
		}

		// remove Bearer if it exists since HC currently includes it in the string it copies
		if (apiKey.toLowerCase().startsWith("bearer ")) {
			apiKey = apiKey.substring(7);
		}

		const maxRetries = 3;
		let retryCount = 0;

		while (retryCount <= maxRetries) {
			try {
				// Throttle requests to respect rate limits
				await this.rateLimiter.throttle();

				const response = await requestUrl({
					url: `https://${HARDCOVER_API.GRAPHQL_URL}${HARDCOVER_API.GRAPHQL_PATH}`,
					method: "POST",
					headers: {
						Authorization: `Bearer ${apiKey}`,
						"Content-Type": "application/json",
					},
					body: body,
					throw: false,
				});

				// handle HTTP errors
				if (response.status === 401 || response.status === 403) {
					throw new Error(
						"Authentication failed: Your Hardcover API key appears to be invalid or expired. Please check your settings and update it."
					);
				} else if (response.status === 429) {
					// Rate limit hit - use exponential backoff and retry
					retryCount++;
					if (retryCount > maxRetries) {
						throw new Error(
							"Rate limit exceeded: Too many requests to Hardcover API. Please try again in a few minutes."
						);
					}
					const backoffMs = Math.pow(2, retryCount) * 5000; // 10s, 20s, 40s
					const backoffSecs = Math.round(backoffMs / 1000);
					this.updateStatus(
						`429 Rate limited! Backing off ${backoffSecs}s (retry ${retryCount}/${maxRetries})...`
					);
					await this.delay(backoffMs);
					continue;
				} else if (response.status < 200 || response.status >= 300) {
					throw new Error(
						`API request failed with status ${response.status}: ${response.text}`
					);
				}

				const data: GraphQLResponse<T> = response.json;

				// handle GraphQL errors
				if (data.errors && data.errors.length > 0) {
					throw new Error(`GraphQL Error: ${data.errors[0].message}`);
				}

				return data.data;
			} catch (error) {
				if (error.message.includes("net::ERR")) {
					throw new Error(
						"Unable to connect to Hardcover API. Please check your internet connection and try again later."
					);
				}
				throw error;
			}
		}

		throw new Error(
			"Rate limit exceeded after retries. Please try again later."
		);
	}

	async fetchEntireLibrary({
		userId,
		totalBooks,
		updatedAfter,
		statusFilter,
		onProgress,
	}: FetchLibraryParams): Promise<any[]> {
		if (totalBooks === 0) {
			return [];
		}

		const pageSize = 100;
		const concurrentRequests = 3; // Fetch 3 pages at once
		const allBooks: any[] = [];

		// Build list of offsets for all pages
		const offsets: number[] = [];
		for (let i = 0; i < totalBooks; i += pageSize) {
			offsets.push(i);
		}

		const totalPages = offsets.length;
		this.debugLog(
			`Fetching ${totalBooks} books in ${totalPages} pages (${concurrentRequests} concurrent)`
		);

		// Process pages in parallel batches
		for (let i = 0; i < offsets.length; i += concurrentRequests) {
			const batch = offsets.slice(i, i + concurrentRequests);
			const batchNum = Math.floor(i / concurrentRequests) + 1;
			const totalBatches = Math.ceil(offsets.length / concurrentRequests);

			this.updateStatus(
				`Fetching batch ${batchNum}/${totalBatches} (pages ${i + 1}-${Math.min(i + concurrentRequests, totalPages)})`
			);

			// Fetch batch in parallel
			const results = await Promise.all(
				batch.map((offset) =>
					this.fetchLibraryPage({
						userId,
						offset,
						limit: pageSize,
						updatedAfter,
						statusFilter,
					})
				)
			);

			// Flatten and add to allBooks
			for (const pageBooks of results) {
				allBooks.push(...pageBooks);
			}

			this.debugLog(
				`Batch ${batchNum} complete: ${allBooks.length} books fetched so far`
			);

			// Report progress after each batch
			if (onProgress) {
				const processed = Math.min(allBooks.length, totalBooks);
				onProgress(processed, totalBooks);
			}

			// Check if we've received fewer books than expected (end of data)
			const lastBatch = results[results.length - 1];
			if (lastBatch.length < pageSize) {
				this.debugLog(`Last batch had ${lastBatch.length} books, ending fetch`);
				break;
			}
		}

		this.debugLog(`Fetch complete: ${allBooks.length} total books`);
		return allBooks;
	}

	async fetchLibraryPage({
		userId,
		offset,
		limit = 100,
		updatedAfter,
		statusFilter,
	}: LibraryPageParams): Promise<any[]> {
		const query = this.queryBuilder.buildUserBooksQuery(
			offset,
			limit,
			updatedAfter,
			statusFilter
		);

		const variables: Record<string, any> = {
			userId,
			offset,
			limit,
		};

		if (updatedAfter) {
			variables.updatedAfter = updatedAfter;
		}

		if (statusFilter && statusFilter.length > 0) {
			variables.statusIds = statusFilter;
		}

		const data = await this.graphqlRequest(query, variables);
		return data.user_books;
	}

	async fetchBooksCount(userId: number): Promise<number> {
		const query = `
			query GetBooksCount {
				user_books_aggregate(where: {user_id: {_eq: ${userId}}}) {
					aggregate {
						count
					}
				}
			}
		`;

		const data = await this.graphqlRequest(query);
		const {
			user_books_aggregate: {
				aggregate: { count },
			},
		} = data;

		return count;
	}

	async fetchUserLists(userId: number): Promise<UserList[]> {
		const query = `
		query GetUserLists($userId: Int!) {
			users_by_pk(id: $userId) {
				lists {
					name
					list_books {
						book_id
					}
				}
			}
		}
	`;

		const variables = { userId };
		const data = await this.graphqlRequest(query, variables);

		return data.users_by_pk?.lists || [];
	}

	async fetchUserId(): Promise<HardcoverUser | undefined> {
		const query = `
			query GetUserId {
				me {
					id
				}
			}
		`;

		const data = await this.graphqlRequest<GetUserIdResponse>(query);
		return data.me[0];
	}

	/**
	 * Combined query to fetch user ID, book count, and optionally user lists in a single request.
	 * This saves 2-3 API calls per sync compared to calling each method separately.
	 */
	async fetchSyncInfo(
		includeLists: boolean,
		statusFilter?: number[]
	): Promise<SyncInfo> {
		// Build the aggregate where clause
		let aggregateWhere = "";
		if (statusFilter && statusFilter.length > 0) {
			aggregateWhere = `(where: {status_id: {_in: [${statusFilter.join(",")}]}})`;
		}

		// Build the query dynamically based on what we need
		const listsFragment = includeLists
			? `
			lists {
				name
				list_books {
					book_id
				}
			}
		`
			: "";

		const query = `
			query GetSyncInfo {
				me {
					id
					user_books_aggregate${aggregateWhere} {
						aggregate {
							count
						}
					}
					${listsFragment}
				}
			}
		`;

		const data = await this.graphqlRequest(query);
		const user = data.me[0];

		if (!user?.id) {
			throw new Error("No user ID found in response");
		}

		const result: SyncInfo = {
			userId: user.id,
			booksCount: user.user_books_aggregate?.aggregate?.count ?? 0,
		};

		if (includeLists && user.lists) {
			result.userLists = user.lists;
		}

		return result;
	}

	private async delay(ms: number): Promise<void> {
		return new Promise((resolve) => window.setTimeout(resolve, ms));
	}
}
