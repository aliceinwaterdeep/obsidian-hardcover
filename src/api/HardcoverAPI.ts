import { Notice, requestUrl } from "obsidian";

import {
	LibraryPageParams,
	FetchLibraryParams,
	PluginSettings,
	UserList,
	SyncInfo,
} from "../types";
import { GetUserIdResponse, GraphQLResponse, HardcoverUser } from "src/types";
import { QueryBuilder } from "./QueryBuilder";
import { HARDCOVER_API } from "src/config/constants";
import ObsidianHardcover from "src/main";

export class HardcoverAPI {
	private settings: PluginSettings;
	private queryBuilder: QueryBuilder;
	private plugin: ObsidianHardcover;

	constructor(plugin: ObsidianHardcover) {
		this.queryBuilder = new QueryBuilder(plugin.settings);
		this.plugin = plugin;
		this.settings = plugin.settings;
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
					new Notice(
						`Rate limited. Retrying in ${backoffSecs}s (attempt ${retryCount}/${maxRetries})...`
					);
					await this.delay(backoffMs);
					continue; // retry the request
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
		status,
		onProgress,
	}: FetchLibraryParams): Promise<any[]> {
		if (totalBooks === 0) {
			return [];
		}

		// add delay based on library size to respect the the 60 req/min limit
		const getDelayMs = (totalBooks: number): number => {
			if (totalBooks < 200) return 0;
			if (totalBooks < 500) return 500;
			if (totalBooks < 1000) return 1000;
			return 1500;
		};

		const delayMs = getDelayMs(totalBooks);

		const pageSize = 100;
		const allBooks: any[] = [];
		let currentOffset = 0;

		while (currentOffset < totalBooks) {
			// calculate the actual limit for this page (could be less than pageSize for the last page)
			const limit = Math.min(pageSize, totalBooks - currentOffset);

			// Fetch page
			const booksPage = await this.fetchLibraryPage({
				userId,
				offset: currentOffset,
				limit,
				updatedAfter,
				status,
			});
			allBooks.push(...booksPage);

			// if less books than requested or reached the total, exit
			if (booksPage.length < limit || allBooks.length >= totalBooks) {
				break;
			}

			if (delayMs > 0) {
				await this.delay(delayMs);
			}

			// Update offset for next page
			currentOffset += booksPage.length;

			// Report progress
			if (onProgress) {
				const processed = Math.min(currentOffset, totalBooks);
				onProgress(processed, totalBooks);
			}
		}

		return allBooks.slice(0, totalBooks);
	}

	async fetchLibraryPage({
		userId,
		offset,
		limit = 100,
		updatedAfter,
		status,
	}: LibraryPageParams): Promise<any[]> {
		const query = this.queryBuilder.buildUserBooksQuery(
			offset,
			limit,
			updatedAfter,
			status
		);

		const variables = {
			userId,
			offset,
			limit,
			...(updatedAfter ? { updatedAfter } : {}),
			...(status && status.length > 0 ? { statusIds: status } : {}),
		};

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

	async fetchUserLibraryInfo(
		includeLists: boolean,
		status?: number[]
	): Promise<SyncInfo> {
		// build the aggregate where clause
		let aggregateWhere = "";
		if (status && status.length > 0) {
			aggregateWhere = `(where: {status_id: {_in: [${status.join(",")}]}})`;
		}

		// build the query dynamically based on what we need
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

	private async delay(ms: number): Promise<void> {
		return new Promise((resolve) => window.setTimeout(resolve, ms));
	}
}
