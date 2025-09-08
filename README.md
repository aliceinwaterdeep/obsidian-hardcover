# Obsidian Hardcover Plugin

Syncs your [Hardcover](https://hardcover.app) library to your Obsidian vault, creating one note per book with metadata stored in frontmatter properties.

[![GitHub downloads](https://img.shields.io/github/downloads/aliceinwaterdeep/obsidian-hardcover/total)](https://github.com/aliceinwaterdeep/obsidian-hardcover/releases)

![obsidian-hardcover-demo](https://github.com/user-attachments/assets/876fcc8b-d05c-4d1f-b26b-566d572421c6)

## Features

- **Complete Library Sync**: Import your entire Hardcover library as Obsidian notes
- **Incremental Updates**: Only sync books that have changed since your last sync
- **Rich Metadata**: Store book information as frontmatter properties:
  - Basic info: Title, authors, publisher, release date
  - Reading data: Status, rating, read dates
  - Content: Description, genres, series information
- **Customizable Format**:
  - Choose which data to include in your notes
  - Configure property names to match your personal system
  - Select data source preferences (book vs. edition level)
- **User notes**: The plugin uses a delimiter system to separate plugin-generated content and user-added content. This means you can add your own notes (thoughts, quotes...) to a book note below the delimiter and it will be preserved during syncs.

> [!WARNING]
> While the delimiter system protects your content during syncs, regular backups of your vault are still recommended. I am not responsible for any data loss.

## Manual Installation

1. Download the ZIP file from the [latest release](https://github.com/aliceinwaterdeep/obsidian-hardcover/releases/latest)
2. Extract the ZIP file to your vault's plugins folder: `YourVaultName/.obsidian/plugins/`
3. You should now have a folder: `YourVaultName/.obsidian/plugins/hardcover-X.X.X/` containing 3 files
4. Restart Obsidian or go to Settings → Community plugins → Reload plugins
5. Enable "Hardcover" in Settings → Community plugins

### Updating from versions before 1.1.0

**Important:** The plugin folder name changed for Obsidian directory compliance.

If you installed this plugin manually before `1.1.0`:

1. **Backup your settings**:Copy `.obsidian/plugins/obsidian-hardcover-vX.X.X/data.json` somewhere safe
2. **Remove the old folder**: Delete `.obsidian/plugins/obsidian-hardcover-vX.X.X/`
3. **Install the new version** following the instructions above
4. **Restore settings**: Copy `data.json` to `.obsidian/plugins/hardcover/data.json`

**Note:** The new plugin creates a `hardcover` folder instead of `obsidian-hardcover`.

### Setup

1. Get your Hardcover API key from [Hardcover](https://hardcover.app/account/api)
2. Open Obsidian Settings and go to the "Hardcover" tab
3. Configure your API key using one of these methods:

   - **Settings**: Enter your API key directly in the plugin settings
   - **Environment file**: Create a `.env` file in your vault root with:
     ```
     HARDCOVER_API_KEY=your_api_key_here
     ```

   > **Note:** If you use both methods, the `.env` file takes priority. The `.env` approach is recommended if you sync your vault with git to keep your API key out of backups.

4. Configure a target folder for your book notes (must be a subfolder, not vault root)
5. Customize which fields to include and their property names
6. Click "Sync now" to import your library

- **Precedence:** If both methods are configured, the `.env` file takes priority.

> [!TIP]
> If you want to test your setup before syncing everything, you can use the Debug menu to run a test sync with a limited number of books. Recommended for large libraries.

Hardcover API keys expire after 1 year. You can check the expiration date of your current key on [Hardcover](https://hardcover.app/account/api).

## Quick Access

Once set up, you can sync your Hardcover library in multiple ways:

- **Settings tab**: Click "Sync now" in the plugin settings
- **Command palette**: Press `Ctrl+P` or `Cmd+P` and search for "Sync library"
- **Ribbon icon**: Click the book icon in the left sidebar

## Sync Process

The plugin follows these steps when syncing:

1. Fetches books from the Hardcover API (in batches of 100)
2. Creates or updates notes for each book
3. Stores the sync timestamp for incremental updates

For large libraries, the plugin uses pagination and respects API rate limits. Hardcover limits requests to 60 per minute. The plugin handles this but very large libraries may take time.

- If some books fail to process, others will still be synced
- The timestamp is only updated if all books process successfully

## Configuration Options

### Fields

Configure which fields to include in your book notes:

- **Title**: Book or edition title
- **Description**: Book synopsis/summary
- **Cover**: Book or edition cover image
- **Release Date**: Book or edition publication date
- **Series**: Series name and position (e.g. "The Murderbot Diaries #1")
- **Authors**: The main writer/s of the book
- **Contributors**: Other contributors (translators, narrators, etc.)
- **Publisher**: Publishing house name
- **URL**: Link to the book on Hardcover
- **Genres**: Book genre tags
- **Status**: Reading status (Want to Read, Currently Reading, etc.) - you can customize the text
- **Rating**: Your 1-5 star rating
- **Review**: Your written review
- **First Read**: Start and end dates of your first read
- **Last Read**: Start and end dates of your most recent read
- **Total Reads**: Number of times you've read the book
- **Read Years**: List of years when you read the book

> [!WARNING]
> The `review` field on the API currently has some inconsistencies, so reviews might not show up in an optimal format until the issue is solved on Hardcover.

### Wikilinks

You can decide to format some fields as wikilinks to create linked notes.

- **Authors**: `[[Author Name]]`
- **Contributors**: `[[Jay Rubin|Jay Rubin (Translator)]]`
- **Series**: `[[Series Name|Series Name #3]]
- **Publisher**: `[[Publisher Name]]`
- **Genres**: `[[Genre Name]]`

### Filename Template

Customize how filenames are generated using variables:

- `${title}` - Book title
- `${authors}` - Main author names
- `${year}` - Publication year

Default format: `${title} (${year})`

Notes are identified using the Hardcover Book ID (`hardcoverBookId` in the frontmatter) so you're free to choose whatever filename suits your vault.

## Note Format

Each synced book creates a note with:

1. Frontmatter metadata containing all selected fields
2. Title heading
3. Cover image (if enabled)
4. Your review (if enabled and available)
5. Hardcover delimiter line (`<!-- obsidian-hardcover-plugin-end -->`)

Content below the delimiter line is preserved during syncs, so you can add your own notes without fear of losing them during updates.

> [!WARNING]
> While the delimiter system protects your content during syncs, regular backups of your vault are still recommended. I am not responsible for any data loss.

Example:

```markdown
---
hardcoverBookId: 12345
title: "Project Hail Mary"
authors: ["Andy Weir"]
rating: "5/5"
status: ["Read"]
releaseDate: "2021-05-04"
---

# Project Hail Mary

![Project Hail Mary Cover|300](https://images.hardcover.app/...)

## My Review

Lorem ipsum dolor sit amet, consectetur adipiscing elit...

<!-- obsidian-hardcover-plugin-end -->

## My Notes

These notes won't be overwritten during sync...
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full version history.

## Roadmap

### Planned Features

- **Directory organization** - Group books by author, series, or both ([#2](https://github.com/aliceinwaterdeep/obsidian-hardcover/issues/2))
- Add property to display reading progress for in-progress books

### Under Consideration

- Add optional timestamps (createdDate/lastModifiedDate) to frontmatter
- Allow custom note template for body content
- Improve read dates handling: only show both `firstRead` `lastRead` when they differ, otherwise show a single `readDate`
- Provide edition title as a separate field alongside book title
- Make cover image dimensions configurable in settings

_Feel free to [open an issue](https://github.com/aliceinwaterdeep/obsidian-hardcover/issues) if you find bugs or have a feature idea!_

---

_Disclaimer: This plugin is not affiliated with Hardcover or Obsidian._
