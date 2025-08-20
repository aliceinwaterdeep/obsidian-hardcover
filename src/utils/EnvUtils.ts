import { Vault, TFile } from "obsidian";

export class EnvUtils {
	private vault: Vault;

	constructor(vault: Vault) {
		this.vault = vault;
	}

	async readEnvFile(): Promise<Record<string, string> | null> {
		try {
			const envFile = this.vault.getAbstractFileByPath(".env");
			if (!envFile || !(envFile instanceof TFile)) {
				// file doesn't exist or is a folder
				return null;
			}

			const content = await this.vault.read(envFile);
			return this.parseEnvContent(content);
		} catch (error) {
			console.debug("Could not read .env file:", error);
			return null;
		}
	}

	// parse .env file content into key=value pairs
	private parseEnvContent(content: string): Record<string, string> {
		const env: Record<string, string> = {};
		const lines = content.split("\n");

		for (const line of lines) {
			const trimmed = line.trim();

			// skip empty lines and comments
			if (!trimmed || trimmed.startsWith("#")) {
				continue;
			}

			// look for key=value pattern
			const equalIndex = trimmed.indexOf("=");
			if (equalIndex != -1) {
				const key = trimmed.substring(0, equalIndex).trim();
				let value = trimmed.substring(equalIndex + 1).trim();

				if (
					(value.startsWith('"') && value.endsWith('"')) ||
					(value.startsWith("'") && value.endsWith("'"))
				) {
					value = value.slice(1, -1);
				}

				if (key) {
					env[key] = value;
				}
			}
		}

		return env;
	}

	async getHardcoverApiKey(): Promise<string | null> {
		const env = await this.readEnvFile();
		if (!env) {
			return null;
		}

		const hardcoverApiKey = env["HARDCOVER_API_KEY"];
		return hardcoverApiKey && hardcoverApiKey.trim() != ""
			? hardcoverApiKey.trim()
			: null;
	}

	async envFileExists(): Promise<boolean> {
		try {
			const envFile = this.vault.getAbstractFileByPath(".env");
			return envFile != null && envFile instanceof TFile;
		} catch {
			return false;
		}
	}
}
