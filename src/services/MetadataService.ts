import { BookMetadataWithContributors, HardcoverUserBook, PluginSettings } from "src/types";
import { FileUtils } from "src/utils/FileUtils";
import { BodyContentBuilder } from "./BodyContentBuilder";
import { FrontmatterBuilder } from "./FrontmatterBuilder";

export class MetadataService {
	private frontmatterBuilder: FrontmatterBuilder;
	private bodyContentBuilder: BodyContentBuilder;

	constructor(settings: PluginSettings, fileUtils: FileUtils) {
		this.frontmatterBuilder = new FrontmatterBuilder(settings, fileUtils);
		this.bodyContentBuilder = new BodyContentBuilder(settings, fileUtils);
	}

	updateSettings(settings: PluginSettings): void {
		this.frontmatterBuilder.updateSettings(settings);
		this.bodyContentBuilder.updateSettings(settings);
	}

	buildMetadata(
		userBook: HardcoverUserBook,
		bookToListsMap?: Map<number, string[]> | null,
	): BookMetadataWithContributors {
		const { frontmatter, rawContributors } = this.frontmatterBuilder.build(
			userBook,
			bookToListsMap,
		);

		const bodyContent = this.bodyContentBuilder.build(userBook, bookToListsMap);

		const metadata = {
			hardcoverBookId: userBook.book_id,
			frontmatter,
			bodyContent,
		};

		return { metadata, rawContributors };
	}
}
