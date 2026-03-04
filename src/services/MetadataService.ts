import {
	BookMetadataWithContributors,
	HardcoverUserBook,
	PluginSettings,
} from "src/types";
import { FileUtils } from "src/utils/FileUtils";
import { AvailableDataBuilder } from "./AvailableDataBuilder";
import { FrontmatterBuilder } from "./FrontmatterBuilder";

export class MetadataService {
	private frontmatterBuilder: FrontmatterBuilder;
	private availableDataBuilder: AvailableDataBuilder;

	constructor(settings: PluginSettings, fileUtils: FileUtils) {
		this.frontmatterBuilder = new FrontmatterBuilder(settings, fileUtils);
		this.availableDataBuilder = new AvailableDataBuilder(settings, fileUtils);
	}

	updateSettings(settings: PluginSettings): void {
		this.frontmatterBuilder.updateSettings(settings);
		this.availableDataBuilder.updateSettings(settings);
	}

	buildMetadata(
		userBook: HardcoverUserBook,
		bookToListsMap?: Map<number, string[]> | null,
	): BookMetadataWithContributors {
		const { frontmatter, rawContributors } = this.frontmatterBuilder.build(
			userBook,
			bookToListsMap,
		);

		const availableData = this.availableDataBuilder.build(
			userBook,
			bookToListsMap,
		);

		const metadata = {
			hardcoverBookId: userBook.book_id,
			frontmatter,
			availableData,
		};

		return { metadata, rawContributors };
	}
}
