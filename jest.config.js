module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	moduleNameMapping: {
		"^src/(.*)$": "<rootDir>/src/$1",
	},
	testMatch: ["**/*.test.ts"],
	testPathIgnorePatterns: ["/node_modules/", "/main.js"],
	rootDir: ".",
	modulePaths: ["<rootDir>"],
	moduleDirectories: ["node_modules", "<rootDir>"],
	setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
};
