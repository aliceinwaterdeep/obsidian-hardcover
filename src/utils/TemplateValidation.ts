import { parseYaml } from "obsidian";

export interface ValidationResult {
	valid: boolean;
	error?: string;
}

export function validateNoteTemplate(template: string): ValidationResult {
	if (!template.startsWith("---\n")) {
		return {
			valid: false,
			error: "Template must start with --- followed by a newline",
		};
	}

	const yamlMatch = template.match(/^---\n([\s\S]*?)\n---/);
	if (!yamlMatch || !yamlMatch[1]) {
		return {
			valid: false,
			error:
				"Template must have closing --- delimiter with newlines before and after",
		};
	}

	const yamlContent = yamlMatch[1];

	// wrap {{variables}} for validation
	const yamlForValidation = yamlContent.replace(
		/:\s*(\{\{(\w+)\}\})/g,
		': "$1"',
	);

	try {
		const parsed = parseYaml(yamlForValidation);

		// check for null values (unquoted tags or other YAML issues)
		if (parsed) {
			for (const [key, value] of Object.entries(parsed)) {
				if (value === null || value === undefined) {
					return {
						valid: false,
						error: `Property "${key}" is empty. Tags need quotes: ${key}: "#tag"`,
					};
				}
			}
		}
	} catch (e) {
		return { valid: false, error: `YAML syntax error: ${e.message}` };
	}

	return { valid: true };
}
