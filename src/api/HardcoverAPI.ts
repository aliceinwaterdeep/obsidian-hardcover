import * as https from "https";
import {
	LibraryPageParams,
	FetchLibraryParams,
	PluginSettings,
	NodeNetworkError,
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

	async makeRequest(
		options: https.RequestOptions,
		data?: string
	): Promise<any> {
		return new Promise((resolve, reject) => {
			const req = https.request(options, (res) => {
				let responseData = "";

				res.on("data", (chunk) => {
					responseData += chunk;
				});

				res.on("end", () => {
					try {
						if (
							res.statusCode &&
							res.statusCode >= 200 &&
							res.statusCode < 300
						) {
							const jsonResponse = JSON.parse(responseData);
							resolve(jsonResponse);
						} else if (res.statusCode === 401 || res.statusCode === 403) {
							reject(
								new Error(
									"Authentication failed: Your Hardcover API key appears to be invalid or expired. Please check your settings and update it."
								)
							);
						} else if (res.statusCode === 429) {
							reject(
								new Error(
									"Rate limit exceeded: Too many requests to Hardcover API. Please try again in a few minutes."
								)
							);
						} else {
							reject(
								new Error(
									`API request failed with status ${res.statusCode}: ${responseData}`
								)
							);
						}
					} catch (error) {
						reject(new Error(`Failed to parse API response: ${error.message}`));
					}
				});
			});

			// timeout to prevent hanging requests
			req.setTimeout(15000, () => {
				req.destroy();
				reject(
					new Error(
						"Request timed out. The Hardcover API may be experiencing issues or your internet connection is unstable."
					)
				);
			});

			req.on("error", (error: NodeNetworkError) => {
				if (error.code === "ENOTFOUND") {
					reject(
						new Error(
							"Unable to connect to Hardcover API. Please check your internet connection and try again later."
						)
					);
				} else if (error.code === "ETIMEDOUT") {
					reject(
						new Error(
							"Connection to Hardcover API timed out. Please check your internet connection and try again."
						)
					);
				} else if (error.code === "ECONNREFUSED") {
					reject(
						new Error(
							"Connection to Hardcover API was refused. The service may be down or unreachable."
						)
					);
				} else {
					reject(new Error(`Network error: ${error.message}`));
				}
			});

			if (data) {
				req.write(data);
			}

			req.end();
		});
	}

	async graphqlRequest<T>(query: string, variables?: any): Promise<any> {
		// console.log(query);

		const data = JSON.stringify({
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

		const options = {
			hostname: HARDCOVER_API.GRAPHQL_URL,
			path: HARDCOVER_API.GRAPHQL_PATH,
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
				"Content-Length": data.length,
			},
		};

		const response: GraphQLResponse<T> = await this.makeRequest(options, data);

		if (response.errors && response.errors.length > 0) {
			throw new Error(`GraphQL Error: ${response.errors[0].message}`);
		}

		return response.data;
	}

	async fetchEntireLibrary({
		userId,
		totalBooks,
		updatedAfter,
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
	}: LibraryPageParams): Promise<any[]> {
		const query = this.queryBuilder.buildUserBooksQuery(
			offset,
			limit,
			updatedAfter
		);

		const variables = {
			userId,
			offset,
			limit,
			...(updatedAfter ? { updatedAfter } : {}),
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
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
