import { getByPath, setByPath } from "./ObjectPath";

describe("ObjectPath", () => {
	describe("getByPath", () => {
		test("reads a flat key", () => {
			expect(getByPath({ targetFolder: "Books" }, "targetFolder")).toBe(
				"Books",
			);
		});

		test("reads a nested key", () => {
			const settings = { grouping: { groupBy: "author" } };
			expect(getByPath(settings, "grouping.groupBy")).toBe("author");
		});

		test("reads a numeric-keyed object entry", () => {
			const settings = { statusMapping: { 1: "Reading" } };
			expect(getByPath(settings, "statusMapping.1")).toBe("Reading");
		});

		test("returns undefined for a missing intermediate object", () => {
			const settings = { grouping: undefined };
			expect(getByPath(settings, "grouping.groupBy")).toBeUndefined();
		});
	});

	describe("setByPath", () => {
		test("writes a flat key", () => {
			const settings = { targetFolder: "Books" };
			setByPath(settings, "targetFolder", "Library");
			expect(settings.targetFolder).toBe("Library");
		});

		test("writes a nested key", () => {
			const settings = { grouping: { groupBy: "author" } };
			setByPath(settings, "grouping.groupBy", "series");
			expect(settings.grouping.groupBy).toBe("series");
		});

		test("writes a numeric-keyed object entry", () => {
			const settings: { statusMapping: Record<number, string> } = {
				statusMapping: {},
			};
			setByPath(settings, "statusMapping.1", "Reading");
			expect(settings.statusMapping[1]).toBe("Reading");
		});

		test("is a no-op when an intermediate object is missing", () => {
			const settings: { grouping?: { groupBy: string } } = {};
			expect(() => setByPath(settings, "grouping.groupBy", "series")).not
				.toThrow();
			expect(settings.grouping).toBeUndefined();
		});
	});
});
