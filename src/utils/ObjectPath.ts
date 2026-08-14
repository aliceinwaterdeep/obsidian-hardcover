export function getByPath(obj: unknown, path: string): unknown {
	return path.split(".").reduce<unknown>((acc, segment) => {
		if (acc && typeof acc === "object") {
			return (acc as Record<string, unknown>)[segment];
		}
		return undefined;
	}, obj);
}

export function setByPath(obj: unknown, path: string, value: unknown): void {
	const segments = path.split(".");
	const lastSegment = segments.pop();
	if (!lastSegment) return;

	const target = segments.reduce<unknown>((acc, segment) => {
		if (acc && typeof acc === "object") {
			return (acc as Record<string, unknown>)[segment];
		}
		return undefined;
	}, obj);

	if (target && typeof target === "object") {
		(target as Record<string, unknown>)[lastSegment] = value;
	}
}
