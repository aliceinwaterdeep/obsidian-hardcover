import { TFile } from "obsidian";
import { BookMetadata } from "src/types";
import ObsidianHardcover from "src/main";

export class FrontmatterManager {
	constructor(private plugin: ObsidianHardcover) {}

	prepareFrontmatter(bookMetadata: BookMetadata): Record<string, unknown> {
		const frontmatterData: Record<string, unknown> = {
			hardcoverBookId: bookMetadata.hardcoverBookId,
			...bookMetadata.frontmatter,
		};
		const prepared: Record<string, unknown> = {};

		// get managed order from template
		const managedOrder = this.getManagedOrder(frontmatterData);

		// add properties in the order they appear in the template
		for (const propName of managedOrder) {
			if (!Object.prototype.hasOwnProperty.call(frontmatterData, propName))
				continue;

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

	getManagedOrder(frontmatterData: Record<string, unknown>): string[] {
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

	updateFrontmatterObject(
		frontmatter: Record<string, unknown>,
		newData: Record<string, unknown>,
		managedKeys: Set<string>,
		preserveCustomFrontmatter: boolean,
		managedOrder: string[],
	): void {
		const original = { ...frontmatter };
		const originalKeys = Object.keys(frontmatter);
		const added = new Set<string>();

		const managedOrderToUse =
			managedOrder && managedOrder.length > 0
				? managedOrder
				: Object.keys(newData);

		const newManagedValues = new Map<string, string>();
		for (const key of managedKeys) {
			if (key in newData) {
				newManagedValues.set(JSON.stringify(newData[key]), key);
			}
		}

		for (const key of originalKeys) {
			delete frontmatter[key];
		}

		for (const key of managedOrderToUse) {
			if (key in newData) {
				frontmatter[key] = newData[key];
				added.add(key);
			}
		}

		if (preserveCustomFrontmatter) {
			for (const key of originalKeys) {
				if (!managedKeys.has(key) && !added.has(key)) {
					const oldValue = original[key];
					const serialized = JSON.stringify(oldValue);

					if (newManagedValues.has(serialized)) {
						// value matches a managed key = likely a rename, skip it
					} else {
						frontmatter[key] = oldValue;
					}
				}
			}
		}
	}
}
