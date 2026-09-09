import { HardcoverAPI } from "./HardcoverAPI";
import { DEFAULT_SETTINGS } from "../config/defaultSettings";

jest.mock("obsidian", () => ({
	Notice: jest.fn(),
	requestUrl: jest.fn(),
}));

describe("HardcoverAPI.fetchUserLists", () => {
	it("pages through lists until a short page is returned", async () => {
		const api = new HardcoverAPI({ settings: DEFAULT_SETTINGS } as any);
		const page = (n: number) =>
			Array.from({ length: n }, (_, i) => ({ name: `L${i}`, list_books: [] }));
		const graphqlRequest = jest
			.spyOn(api, "graphqlRequest")
			.mockResolvedValueOnce({ users_by_pk: { lists: page(100) } })
			.mockResolvedValueOnce({ users_by_pk: { lists: page(100) } })
			.mockResolvedValueOnce({ users_by_pk: { lists: page(35) } });
		jest.spyOn(api as any, "delay").mockResolvedValue(undefined);

		const lists = await api.fetchUserLists(42);

		expect(lists).toHaveLength(235);
		expect(graphqlRequest).toHaveBeenCalledTimes(3);
		expect(graphqlRequest.mock.calls.map((c) => c[1])).toEqual([
			{ userId: 42, offset: 0 },
			{ userId: 42, offset: 100 },
			{ userId: 42, offset: 200 },
		]);
	});
});
