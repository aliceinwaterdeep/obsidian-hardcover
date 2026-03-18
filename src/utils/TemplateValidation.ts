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

	const closingMatch = template.match(/\n---\n/);
	if (!closingMatch) {
		return {
			valid: false,
			error:
				"Template must have closing --- delimiter with newlines before and after",
		};
	}

	return { valid: true };
}
