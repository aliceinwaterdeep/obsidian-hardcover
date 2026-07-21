import { PluginSettings } from "src/types";

export class QueryBuilder {
	private settings: PluginSettings;
	private requiredFields: Set<string>;

	constructor(settings: PluginSettings) {
		this.settings = settings;
		this.requiredFields = this.determineRequiredFields();
	}

	private determineRequiredFields(): Set<string> {
		const required = new Set<string>();
		const { noteTemplate, filenameTemplate } = this.settings;

		required.add("hardcoverBookId");

		// step 1: parse noteTemplate for {{variables}} (both YAML and body)
		const noteVarMatches = noteTemplate.match(/\{\{(\w+)\}\}/g);
		if (noteVarMatches) {
			for (const match of noteVarMatches) {
				// extract variable name: {{bookTitle}} -> bookTitle
				const varName = match.replace(/\{\{|\}\}/g, "");
				required.add(varName);
			}
		}

		// step 2: parse filename template for {{variables}}
		const filenameVarMatches = filenameTemplate.match(/\{\{(\w+)\}\}/g);
		if (filenameVarMatches) {
			for (const match of filenameVarMatches) {
				// extract variable name: {{editionTitle}} -> editionTitle
				const varName = match.replace(/\{\{|\}\}/g, "");

				// handle  year variables
				if (varName === "bookYear") {
					required.add("bookReleaseDate");
				} else if (varName === "editionYear") {
					required.add("editionReleaseDate");
				} else {
					required.add(varName);
				}
			}
		}

		return required;
	}

	buildUserBooksQuery(
		_offset: number,
		_limit: number,
		updatedAfter?: string,
		status?: number[],
		bookIds?: number[],
	): string {
		const userBooksFields = this.buildUserBooksFields();
		const bookFields = this.buildBookFields();
		const editionFields = this.buildEditionFields();
		const readsFields = this.buildReadsFields();
		const hasStatusFilter = status && status.length > 0;
		const hasBookIdsFilter = bookIds && bookIds.length > 0;

		// build where clause with optional timestamp, status, and book id filters
		let whereClause = `where: {user_id: {_eq: $userId}`;
		if (updatedAfter) {
			whereClause += `, updated_at: {_gt: $updatedAfter}`;
		}
		if (hasStatusFilter) {
			whereClause += `, status_id: {_in: $statusIds}`;
		}
		if (hasBookIdsFilter) {
			whereClause += `, book_id: {_in: $bookIds}`;
		}
		whereClause += `}`;

		let variableDeclarations = "$userId: Int!, $offset: Int!, $limit: Int!";
		if (updatedAfter) {
			variableDeclarations += ", $updatedAfter: timestamptz!";
		}
		if (hasStatusFilter) {
			variableDeclarations += ", $statusIds: [Int!]!";
		}
		if (hasBookIdsFilter) {
			variableDeclarations += ", $bookIds: [Int!]!";
		}

		return `
            query GetUserLibrary(${variableDeclarations}) {
                user_books(
                    ${whereClause}
                    order_by: {book_id: asc}
                    offset: $offset
                    limit: $limit
                ) {
                    # Core fields - always included
                    book_id
                    updated_at
                    
                    ${userBooksFields}
                    
                    book {
                        ${bookFields}
                    }
                    
                    edition {
                        ${editionFields}
                    }
                    
                    ${readsFields}
                }
            }
        `;
	}

	private buildUserBooksFields(): string {
		const fields: string[] = [];

		// helper to check if we need a field
		const needsField = (fieldKey: string): boolean => {
			return this.requiredFields.has(fieldKey);
		};

		if (needsField("rating")) {
			fields.push("rating");
		}

		if (needsField("status")) {
			fields.push("status_id");
		}

		if (needsField("review")) {
			// review_raw is a fallback in case review_markdown returns null
			fields.push("review_markdown");
			fields.push("review_raw");
		}

		if (needsField("quotes")) {
			fields.push(`reading_journals(
                where: {event: {_eq: "quote"}}
                order_by: {created_at: asc}
            ) {
                entry
            }`);
		}

		return fields.join("\n                    ");
	}

	private buildBookFields(): string {
		const fields: string[] = ["title"]; // always include at least title

		// helper to check if we need a field
		const needsField = (fieldKey: string): boolean => {
			return this.requiredFields.has(fieldKey);
		};

		if (needsField("bookId")) {
			fields.push("id");
		}

		if (needsField("bookTitle")) {
			// title already in fields array
		}

		if (needsField("bookCover")) {
			fields.push("cached_image");
		}

		if (needsField("bookReleaseDate")) {
			fields.push("release_date");
		}

		if (needsField("bookAuthors") || needsField("bookContributors")) {
			fields.push("cached_contributors");
		}

		if (needsField("description")) {
			fields.push("description");
		}

		if (needsField("url")) {
			fields.push("slug");
		}

		if (needsField("series")) {
			fields.push(`book_series {
		series {
			name
		}
		position
	}`);
		}

		if (needsField("genres")) {
			fields.push("cached_tags");
		}

		return fields.join("\n                        ");
	}

	private buildEditionFields(): string {
		const fields: string[] = ["title"]; // always include at least title

		// helper to check if we need a field
		const needsField = (fieldKey: string): boolean => {
			return this.requiredFields.has(fieldKey);
		};

		if (needsField("editionId")) {
			fields.push("id");
		}

		if (needsField("editionCover")) {
			fields.push("cached_image");
		}

		if (needsField("editionReleaseDate")) {
			fields.push("release_date");
		}

		if (needsField("editionAuthors") || needsField("editionContributors")) {
			fields.push("cached_contributors");
		}

		if (needsField("publisher")) {
			fields.push(`publisher {
		name
	}`);
		}

		if (needsField("isbn10")) {
			fields.push("isbn_10");
		}

		if (needsField("isbn13")) {
			fields.push("isbn_13");
		}

		return fields.join("\n                        ");
	}

	private buildReadsFields(): string {
		// helper to check if we need a field
		const needsField = (fieldKey: string): boolean => {
			return this.requiredFields.has(fieldKey);
		};

		// only include reads if any read-related fields are needed
		if (
			needsField("firstRead") ||
			needsField("lastRead") ||
			needsField("totalReads") ||
			needsField("readYears") ||
			needsField("firstReadStart") ||
			needsField("firstReadEnd") ||
			needsField("lastReadStart") ||
			needsField("lastReadEnd")
		) {
			return `user_book_reads(order_by: {started_at: asc}) {
                        started_at
                        finished_at
                    }`;
		}

		return "";
	}
}
