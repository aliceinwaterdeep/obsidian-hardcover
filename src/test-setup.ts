// mock  obsidian modules globally
jest.mock(
	"obsidian",
	() => ({
		Vault: jest.fn(),
		TFile: jest.fn(),
		Plugin: jest.fn(),
	}),
	{ virtual: true }
);

(global as any).IS_DEV = false;
