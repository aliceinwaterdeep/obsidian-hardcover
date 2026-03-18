import {
	BookMetadataWithContributors,
	HardcoverUserBook,
	PluginSettings,
} from "src/types";
import { FileUtils } from "src/utils/FileUtils";
import { TemplateDataBuilder } from "./TemplateDataBuilder";

export class MetadataService {
	private templateDataBuilder: TemplateDataBuilder;

	constructor(settings: PluginSettings, fileUtils: FileUtils) {
		this.templateDataBuilder = new TemplateDataBuilder(settings, fileUtils);
	}

	updateSettings(settings: PluginSettings): void {
		this.templateDataBuilder.updateSettings(settings);
	}

	buildMetadata(
		userBook: HardcoverUserBook,
		bookToListsMap?: Map<number, string[]> | null,
	): BookMetadataWithContributors {
		const { frontmatter, variables, rawContributors } =
			this.templateDataBuilder.build(userBook, bookToListsMap);

		const metadata = {
			hardcoverBookId: userBook.book_id,
			frontmatter,
			variables,
		};

		return { metadata, rawContributors };
	}
}
