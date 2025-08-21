import { EnvUtils } from "../utils/EnvUtils";

describe("EnvUtils", () => {
	let envUtils: EnvUtils;
	let mockVault: any;

	beforeEach(() => {
		mockVault = {
			adapter: {
				exists: jest.fn(),
				read: jest.fn(),
			},
		};
		envUtils = new EnvUtils(mockVault);
	});

	describe("readEnvFile", () => {
		test("returns null when .env file does not exist", async () => {
			mockVault.adapter.exists.mockResolvedValue(false);

			const result = await envUtils.readEnvFile();

			expect(result).toBeNull();
			expect(mockVault.adapter.exists).toHaveBeenCalledWith(".env");
		});
	});

	describe("parseEnvContent", () => {
		// accessing private method with any cast for testing
		const parseEnvContent = (content: string) =>
			(envUtils as any).parseEnvContent(content);

		test("handles basic key value pairs", () => {
			const content = "HARDCOVER_API_KEY=test123\nOTHER_VAR=value123";

			const result = parseEnvContent(content);

			expect(result).toEqual({
				HARDCOVER_API_KEY: "test123",
				OTHER_VAR: "value123",
			});
		});

		test("ignores empty lines and comments", () => {
			const content = `
# This is a comment
HARDCOVER_API_KEY=test123

# Another comment
OTHER_VAR=value123
`;

			const result = parseEnvContent(content);

			expect(result).toEqual({
				HARDCOVER_API_KEY: "test123",
				OTHER_VAR: "value123",
			});
		});

		test("handles quoted values", () => {
			const content = `HARDCOVER_API_KEY="test123"
OTHER_VAR='value123'`;

			const result = parseEnvContent(content);

			expect(result).toEqual({
				HARDCOVER_API_KEY: "test123",
				OTHER_VAR: "value123",
			});
		});

		test("handles malformed lines gracefully", () => {
			const content = `HARDCOVER_API_KEY=test123
INVALID_LINE_NO_EQUALS
=INVALID_EMPTY_KEY
OTHER_VAR=value123`;

			const result = parseEnvContent(content);

			expect(result).toEqual({
				HARDCOVER_API_KEY: "test123",
				OTHER_VAR: "value123",
			});
		});

		test("handles whitespace correctly", () => {
			const content = `  HARDCOVER_API_KEY  =  test123  
OTHER_VAR= value123 `;

			const result = parseEnvContent(content);

			expect(result).toEqual({
				HARDCOVER_API_KEY: "test123",
				OTHER_VAR: "value123",
			});
		});
	});

	describe("getHardcoverApiKey", () => {
		test("returns null when HARDCOVER_API_KEY is not in .env file", async () => {
			mockVault.adapter.exists.mockResolvedValue(true);
			mockVault.adapter.read.mockResolvedValue("OTHER_VAR=value123");

			const result = await envUtils.getHardcoverApiKey();

			expect(result).toBeNull();
		});

		test("returns null when HARDCOVER_API_KEY is empty", async () => {
			mockVault.adapter.exists.mockResolvedValue(true);
			mockVault.adapter.read.mockResolvedValue("HARDCOVER_API_KEY=");

			const result = await envUtils.getHardcoverApiKey();

			expect(result).toBeNull();
		});

		test("returns trimmed API key", async () => {
			mockVault.adapter.exists.mockResolvedValue(true);
			mockVault.adapter.read.mockResolvedValue("HARDCOVER_API_KEY=  test123  ");

			const result = await envUtils.getHardcoverApiKey();

			expect(result).toBe("test123");
		});

		test("works with multiple variables in .env file", async () => {
			mockVault.adapter.exists.mockResolvedValue(true);
			mockVault.adapter.read.mockResolvedValue(`
# API Configuration
HARDCOVER_API_KEY=test123
OTHER_SERVICE_KEY=abc456
`);

			const result = await envUtils.getHardcoverApiKey();

			expect(result).toBe("test123");
		});
	});
});
