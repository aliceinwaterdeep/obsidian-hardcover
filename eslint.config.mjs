import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";

export default tseslint.config(
	{
		ignores: [
			"**/*.test.ts",
			"src/test-setup.ts",
			"main.js",
			"esbuild.config.mjs",
			"bump.mjs",
			"jest.config.js",
			"eslint.config.mjs",
			"docs/**",
		],
	},
	{
		files: ["src/**/*.ts"],
		extends: [...tseslint.configs.recommended],
		plugins: { obsidianmd },
		languageOptions: {
			parserOptions: {
				project: "./tsconfig.json",
			},
		},
		rules: {
			"@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
			"@typescript-eslint/no-empty-function": "off",
			// type-aware rules that require parserOptions.project
			"@typescript-eslint/no-unnecessary-type-assertion": "warn",
			"@typescript-eslint/no-misused-promises": "error",
			"@typescript-eslint/no-deprecated": "warn",
			"no-console": ["warn", { allow: ["warn", "error", "debug"] }],
			"obsidianmd/settings-tab/prefer-setting-definitions": "warn",
		},
	},
);
