import { TFile } from "obsidian";
import { BookMetadata } from "src/types";
import ObsidianHardcover from "src/main";

export class FrontmatterManager {
	constructor(private plugin: ObsidianHardcover) {}

	prepareFrontmatter(bookMetadata: BookMetadata): Record<string, any> {
		const frontmatterData: Record<string, any> = {
			hardcoverBookId: bookMetadata.hardcoverBookId,
			...bookMetadata.frontmatter,
		};
		const prepared: Record<string, any> = {};

		// get managed order from template
		const managedOrder = this.getManagedOrder(frontmatterData);

		// add properties in the order they appear in the template
		for (const propName of managedOrder) {
			if (!frontmatterData.hasOwnProperty(propName)) continue;

			const value = frontmatterData[propName];

			// skip undefined/null values
			if (value === undefined || value === null) continue;

			// remove all \n sequences and replace with spaces to avoid frontmatter issues
			if (propName === "description" && typeof value === "string") {
				const cleanValue = value.replace(/\\n/g, " ").trim();
				// remove any multiple spaces that might result
				const finalValue = cleanValue.replace(/\s+/g, " ");
				prepared[propName] = finalValue;
			} else {
				// for everything else, just add it directly: Obsidian's processFrontMatter will handle arrays, strings, etc.
				prepared[propName] = value;
			}
		}

		return prepared;
	}

	getManagedFrontmatterKeys(): Set<string> {
		const keys = new Set<string>();

		// hardcoverBookId is always managed
		keys.add("hardcoverBookId");

		// parse the noteTemplate to extract property names from YAML block
		const template = this.plugin.settings.noteTemplate;

		// extract YAML block
		const yamlMatch = template.match(/^---\n([\s\S]*?)\n---/);

		if (yamlMatch && yamlMatch[1]) {
			const yamlContent = yamlMatch[1];

			// extract property names (everything before the first : on each line)
			const lines = yamlContent.split("\n");
			for (const line of lines) {
				const trimmed = line.trim();
				if (trimmed && !trimmed.startsWith("#")) {
					const colonIndex = trimmed.indexOf(":");
					if (colonIndex > 0) {
						const propName = trimmed.substring(0, colonIndex).trim();
						keys.add(propName);
					}
				}
			}
		}

		return keys;
	}

	getManagedOrder(frontmatterData: Record<string, any>): string[] {
		const order: string[] = [];

		// hardcoverBookId always comes first
		if ("hardcoverBookId" in frontmatterData) {
			order.push("hardcoverBookId");
		}

		// parse the noteTemplate to get the order from YAML block
		const template = this.plugin.settings.noteTemplate;

		// extract YAML block
		const yamlMatch = template.match(/^---\n([\s\S]*?)\n---/);

		if (yamlMatch && yamlMatch[1]) {
			const yamlContent = yamlMatch[1];

			// extract property names in order
			const lines = yamlContent.split("\n");
			for (const line of lines) {
				const trimmed = line.trim();
				if (trimmed && !trimmed.startsWith("#")) {
					const colonIndex = trimmed.indexOf(":");
					if (colonIndex > 0) {
						const propName = trimmed.substring(0, colonIndex).trim();
						// add to order if it exists in the data and isn't already added
						if (propName in frontmatterData && !order.includes(propName)) {
							order.push(propName);
						}
					}
				}
			}
		}

		return order;
	}

	extractFrontmatter(
		content: string,
		file: TFile,
	): {
		bodyText: string;
	} {
		const cache = this.plugin.app.metadataCache.getFileCache(file);
		const frontmatterEnd = cache?.frontmatterPosition?.end;

		if (frontmatterEnd !== undefined) {
			const endOffset = frontmatterEnd.offset;
			const bodyText = content.slice(endOffset);
			return { bodyText };
		}

		return { bodyText: content };
	}
}
