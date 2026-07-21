import { extractReadingActivity } from "./MetadataHelpers";
import { HardcoverUserBooksReads } from "src/types";

describe("extractReadingActivity", () => {
	test("returns empty activity when reads is empty", () => {
		expect(extractReadingActivity([])).toEqual({
			firstRead: null,
			lastRead: null,
			totalReads: 0,
			readYears: [],
		});
	});

	test("counts a read with both started_at and finished_at", () => {
		const reads: HardcoverUserBooksReads[] = [
			{ started_at: "2023-01-01", finished_at: "2023-01-15" },
		];

		const activity = extractReadingActivity(reads);

		expect(activity.totalReads).toBe(1);
		expect(activity.readYears).toEqual(["2023"]);
		expect(activity.firstRead).toEqual({
			start: "2023-01-01",
			end: "2023-01-15",
		});
		expect(activity.lastRead).toEqual({
			start: "2023-01-01",
			end: "2023-01-15",
		});
	});

	test("does not count a read with only started_at (in progress)", () => {
		const reads: HardcoverUserBooksReads[] = [
			{ started_at: "2023-01-01", finished_at: null },
		];

		const activity = extractReadingActivity(reads);

		expect(activity.totalReads).toBe(0);
		expect(activity.readYears).toEqual([]);
		expect(activity.firstRead).toBeNull();
		expect(activity.lastRead).toBeNull();
	});

	test("counts a read with only finished_at", () => {
		const reads: HardcoverUserBooksReads[] = [
			{ started_at: null, finished_at: "2023-06-01" },
		];

		const activity = extractReadingActivity(reads);

		expect(activity.totalReads).toBe(1);
		expect(activity.readYears).toEqual(["2023"]);
		expect(activity.firstRead).toEqual({ start: null, end: "2023-06-01" });
	});

	test("excludes in progress reads from totalReads while counting completed ones", () => {
		const reads: HardcoverUserBooksReads[] = [
			{ started_at: "2022-01-01", finished_at: "2022-01-15" },
			{ started_at: "2023-05-01", finished_at: null },
		];

		const activity = extractReadingActivity(reads);

		expect(activity.totalReads).toBe(1);
		expect(activity.readYears).toEqual(["2022"]);
	});

	test("orders firstRead/lastRead by finished_at and dedupes/sorts readYears", () => {
		const reads: HardcoverUserBooksReads[] = [
			{ started_at: "2023-11-01", finished_at: "2023-11-20" },
			{ started_at: "2021-01-01", finished_at: "2021-02-01" },
			{ started_at: "2022-06-01", finished_at: "2022-06-10" },
		];

		const activity = extractReadingActivity(reads);

		expect(activity.totalReads).toBe(3);
		expect(activity.readYears).toEqual(["2021", "2022", "2023"]);
		expect(activity.firstRead).toEqual({
			start: "2021-01-01",
			end: "2021-02-01",
		});
		expect(activity.lastRead).toEqual({
			start: "2023-11-01",
			end: "2023-11-20",
		});
	});
});
