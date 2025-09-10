import { TFile, Vault, Notice } from "obsidian";
import ObsidianHardcover from "src/main";
import { BookMetadata } from "src/types";

interface ReorganizationResult {
	movedCount: number;
	failedCount: number;
	errors: Array<{ filename: string; error: string }>;
}

export class FileReorganizationService {
	constructor(private vault: Vault, private plugin: ObsidianHardcover) {}

	async reorganizeFiles(): Promise<ReorganizationResult> {
		const result: ReorganizationResult = {
			movedCount: 0,
			failedCount: 0,
			errors: [],
		};

		try {
			// find all plugin-created notes
			const pluginNotes = await this.findBookNotes();

			if (pluginNotes.length === 0) {
				return result;
			}

			// calculate moves needed
			const movesToPerform = await this.calculateRequiredMoves(pluginNotes);

			// move files
			for (const move of movesToPerform) {
				try {
					await this.vault.rename(move.file, move.newPath);
					result.movedCount++;
				} catch (error) {
					result.failedCount++;
					result.errors.push({
						filename: move.file.name,
						error: error.message || "Unknown error",
					});
					console.error(`Failed to move ${move.file.path}:`, error);
				}
			}

			// show summary if there were any errors
			if (result.failedCount > 0) {
				new Notice(
					`Reorganization completed: ${result.movedCount} moved, ${result.failedCount} failed`,
					8000
				);
			}

			return result;
		} catch (error) {
			console.error("Error during file reorganization:", error);
			throw error;
		}
	}

	private async findBookNotes(): Promise<
		Array<{ file: TFile; hardcoverBookId: number }>
	> {
		const pluginNotes: Array<{ file: TFile; hardcoverBookId: number }> = [];
		const targetFolder = this.plugin.settings.targetFolder;

		try {
			const folder = this.vault.getFolderByPath(targetFolder);
			if (!folder) {
				return pluginNotes;
			}

			// recursively search through target folder and all subdirectories
			const searchFolder = async (currentFolder: any) => {
				for (const child of currentFolder.children) {
					if (child instanceof TFile && child.extension === "md") {
						// check if this file has hardcoverBookId in frontmatter to make sure we only move book notes
						const content = await this.vault.read(child);
						const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

						if (frontmatterMatch) {
							const frontmatter = frontmatterMatch[1];
							const idMatch = frontmatter.match(/hardcoverBookId:\s*(\d+)/);

							if (idMatch) {
								const hardcoverBookId = parseInt(idMatch[1]);
								pluginNotes.push({ file: child, hardcoverBookId });
							}
						}
					} else if (child.children) {
						// it's a folder, search recursively
						await searchFolder(child);
					}
				}
			};

			await searchFolder(folder);
			return pluginNotes;
		} catch (error) {
			console.error("Error finding plugin notes:", error);
			return pluginNotes;
		}
	}

	private async calculateRequiredMoves(
		pluginNotes: Array<{ file: TFile; hardcoverBookId: number }>
	): Promise<Array<{ file: TFile; newPath: string }>> {
		const movesToPerform: Array<{ file: TFile; newPath: string }> = [];

		for (const noteInfo of pluginNotes) {
			try {
				// extract only author/series metadata for directory calculation
				const bookMetadata = await this.extractMetadataFromNote(noteInfo.file);

				if (bookMetadata) {
					const directoryPath = this.plugin.noteService.buildDirectoryPath(
						bookMetadata,
						this.plugin.settings.grouping
					);

					// preserve the existing filename
					const existingFilename = noteInfo.file.name;

					// build new full path
					const targetFolder = this.plugin.settings.targetFolder;
					const newPath = directoryPath
						? `${targetFolder}/${directoryPath}/${existingFilename}`
						: `${targetFolder}/${existingFilename}`;

					// only add to moves if the path is actually different
					if (noteInfo.file.path !== newPath) {
						movesToPerform.push({
							file: noteInfo.file,
							newPath: newPath,
						});
					}
				}
			} catch (error) {
				console.error(
					`Error calculating move for ${noteInfo.file.path}:`,
					error
				);
			}
		}

		return movesToPerform;
	}

	private async extractMetadataFromNote(
		file: TFile
	): Promise<BookMetadata | null> {
		try {
			// use Obsidian  built in frontmatter cache
			const fileCache = this.plugin.app.metadataCache.getFileCache(file);
			const frontmatter = fileCache?.frontmatter;

			if (!frontmatter || !frontmatter.hardcoverBookId) {
				return null;
			}

			const metadata: BookMetadata = {
				hardcoverBookId: frontmatter.hardcoverBookId,
				bodyContent: {}, // not needed but required by type
			};

			const authorProperty =
				this.plugin.settings.fieldsSettings.authors.propertyName;
			const seriesProperty =
				this.plugin.settings.fieldsSettings.series.propertyName;

			if (frontmatter[authorProperty]) {
				metadata[authorProperty] = frontmatter[authorProperty];
			}

			if (frontmatter[seriesProperty]) {
				metadata[seriesProperty] = frontmatter[seriesProperty];
			}

			return metadata;
		} catch (error) {
			console.error(`Error extracting metadata from ${file.path}:`, error);
			return null;
		}
	}
}
