# Obsidian Hardcover Plugin

Syncs your [Hardcover](https://hardcover.app) library to your Obsidian vault, creating one note per book with metadata stored in frontmatter properties.

[![GitHub downloads](https://img.shields.io/github/downloads/aliceinwaterdeep/obsidian-hardcover/total)](https://github.com/aliceinwaterdeep/obsidian-hardcover/releases)

![obsidian-hardcover-demo](https://github.com/user-attachments/assets/c7d3f900-65b8-45c0-b89c-58a25410149d)

## ⚠️ Version 2.0.0 - Breaking Changes

v2.0.0 introduces customizable note templates and splits book/edition fields. **Your settings will be automatically migrated**. [See migration docs if you're curious](docs/v2-migration.md).

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
  - [Updating from Versions Before 1.1.0](#updating-from-versions-before-110)
- [Setup](#setup)
  - [Quick Access](#quick-access)
  - [Sync Process](#sync-process)
- [Settings Overview](#settings-overview)
  - [Note Template](#note-template)
  - [Wikilinks](#wikilinks)
  - [Filename Template](#filename-template)
  - [Grouping Options](#grouping-options)
- [Note Format](#note-format)
- [Changelog](#changelog)
- [Roadmap](#roadmap)
- [Documentation](#documentation)

## Features

- **Complete Library Sync**: Import your entire Hardcover library as Obsidian notes
- **Incremental Updates**: Only sync books that have changed since your last sync
- **Flexible Configuration**:
  - Define a template to control how your note looks (frontmatter and body)
  - Add custom properties to frontmatter
  - Template validation with error messages
- **Directory Organization**:
  - Group your book notes by author and/or series
- **Sync by status**:
  - Configure a filter to only sync books of a specific status (e.g. Want to Read)
- **User notes**: The plugin uses a delimiter system to separate plugin-generated content and user-added content. This means you can add your own personal notes to a book note below the delimiter and it will be preserved during syncs.

> [!WARNING]
> While the delimiter system protects your content during syncs, regular backups of your vault are still recommended. I am not responsible for any data loss.

## Requirements

- **Obsidian 1.11.1 or later**
- Hardcover API key (get it from [your account settings](https://hardcover.app/account/api))

> **Note for existing users:** Version 1.9.0 introduced this requirement. If you're on an older version of Obsidian, stay on plugin version 1.8.1 or earlier.

## Installation

### From Obsidian Community Plugins (Recommended)

1. Open Obsidian Settings
2. Go to **Community Plugins** -> Browse
3. Search for "Hardcover"
4. Click **Install**
5. Enable the plugin

### Manual Installation

1. Download the ZIP file from the [latest release](https://github.com/aliceinwaterdeep/obsidian-hardcover/releases/latest)
2. Extract the ZIP file to your vault's plugins folder: `YourVaultName/.obsidian/plugins/`
3. You should now have a folder: `YourVaultName/.obsidian/plugins/hardcover-X.X.X/` containing 3 files
4. Restart Obsidian or go to Settings -> Community plugins -> Reload plugins
5. Enable "Hardcover" in Settings -> Community plugins

### Updating from versions before 1.1.0

**Important:** The plugin folder name changed for Obsidian directory compliance.

If you installed this plugin manually before `1.1.0`:

1. **Backup your settings**:Copy `.obsidian/plugins/obsidian-hardcover-vX.X.X/data.json` somewhere safe
2. **Remove the old folder**: Delete `.obsidian/plugins/obsidian-hardcover-vX.X.X/`
3. **Install the new version** following the instructions above
4. **Restore settings**: Copy `data.json` to `.obsidian/plugins/hardcover/data.json`

**Note:** The new plugin creates a `hardcover` folder instead of `obsidian-hardcover`.

## Setup

1. Get your Hardcover API key from [Hardcover](https://hardcover.app/account/api)
2. Open Obsidian Settings and go to the "Hardcover" tab
3. Configure your API key using one of these methods:
   - **SecretStorage** (recommended): Store your API key securely using Obsidian's encrypted SecretStorage. Click "Link..." in the API key setting to create or select a secret.
   - **Environment file**: Create a `.env` file in your vault root with:

```
     HARDCOVER_API_KEY=your_api_key_here
```

> **Note:** If you use both methods, the `.env` file takes priority. SecretStorage provides encrypted storage, while `.env` is useful if you are syncing your vault with git.

4. Configure a target folder for your book notes (must be a subfolder, not vault root)
5. Customize which fields to include and their property names
6. Click "Sync now" to import your library

> [!TIP]
> If you want to test your setup before syncing everything, you can use the Debug menu to run a test sync with a limited number of books. Recommended for large libraries.

Hardcover API keys expire after 1 year. You can check the expiration date of your current key on [Hardcover](https://hardcover.app/account/api).

### Quick Access

Once set up, you can sync your Hardcover library in multiple ways:

- **Settings tab**: Click "Sync now" in the plugin settings
- **Command palette**: Press `Ctrl+P` or `Cmd+P` and search for "Sync library"
- **Ribbon icon**: Click the book icon in the left sidebar

### Sync Process

The plugin follows these steps when syncing:

1. Fetches books from the Hardcover API (in batches of 100)
2. Creates or updates notes for each book
3. Stores the sync timestamp for incremental updates

For large libraries, the plugin uses pagination and respects API rate limits. Hardcover limits requests to 60 per minute. The plugin handles this but very large libraries may take time.

- If some books fail to process, others will still be synced
- The timestamp is only updated if all books process successfully

## Settings Overview

### Custom Note Template

## Note Template

v2.0.0 introduces a fully customizable note template using variable substitution.

Edit your template in Settings -> Note Template:

```
---
title: {{editionTitle}}
cover: {{editionCover}}
releaseDate: {{editionReleaseDate}}
authors: {{editionAuthors}}
---

# {{editionTitle}}

![cover|300]({{editionCover}})

{{description}}

## Review
{{review}}

## Quotes
{{quotes}}
```

### Available Variables

**Book vs Edition Data:**

- Title: `{{bookTitle}}` / `{{editionTitle}}`
- Cover: `{{bookCover}}` / `{{editionCover}}`
- Release Date: `{{bookReleaseDate}}` / `{{editionReleaseDate}}`
- Authors: `{{bookAuthors}}` / `{{editionAuthors}}`
- Contributors: `{{bookContributors}}` / `{{editionContributors}}`

**Book Information:**

- `{{description}}` - Book description
- `{{url}}` - Hardcover URL
- `{{series}}` - Series information
- `{{genres}}` - Genre tags

**Edition Information:**

- `{{publisher}}` - Publisher name
- `{{isbn10}}` / `{{isbn13}}` - ISBN numbers

**Your Data:**

- `{{rating}}` - Your rating
- `{{status}}` - Reading status
- `{{review}}` - Your written review
- `{{quotes}}` - Highlights from reading journal
- `{{lists}}` - Your Hardcover lists

**Reading Activity:**

- `{{firstReadStart}}` / `{{firstReadEnd}}` - First read dates
- `{{lastReadStart}}` / `{{lastReadEnd}}` - Most recent read dates
- `{{totalReads}}` - Number of times read
- `{{readYears}}` - Years when read

You can also find the list of all available variables in the settings.

#### Custom properties

You can add custom properties that will be added to every note. Example:

```
---
title: {{editionTitle}}
tags: "#books"
---
```

**Important:** Template properties are regenerated every sync. These are meant for properties and values you want to apply to every book note and won't change manually (tags, dates using Templater, etc). For properties you need to change manually, you can manually add them to specific notes. If "Preserve custom frontmatter" (enabled by default) is enabled, they will be kept across syncs.

> [!WARNING]
> Custom properties follow the same YAML syntax as [Obsidian properties](https://help.obsidian.md/Editing+and+formatting/Properties). Common examples:
>
> - Tags: `myTag: "#books"` (quotes required for #)
> - Lists: `myTags: ["#fiction", "#2026"]`
> - Wikilinks: "[[My link]]"

### Wikilinks

Format certain fields as `[[wikilinks]]` in frontmatter and body:

- Authors
- Contributors
- Series
- Publisher
- Genres
- Lists

### Filename Template

Customize how note filenames are generated using variables like `{{editionTitle}}`, `{{bookAuthors}}`, `{{bookYear}}`, etc.

Default: `{{editionTitle}} ({{editionYear}})`

Notes are identified using the Hardcover Book ID (`hardcoverBookId` in the frontmatter) so you're free to choose whatever filename suits your vault.

### Grouping Options

- **Disabled** (default): All notes go in your target folder
- **Group by Author**: `Books/Brandon Sanderson/book1.md`, `Books/Martha Wells/book2.md`
- **Group by Series**: `Books/The Murderbot Diaries/book1.md`, `Books/Secret Projects/book2.md`
- **Group by Author -> Series**: `Books/Brandon Sanderson/Secret Projects/book1.md`

#### Author Name Format

When grouping by author, choose between:

- **First Name Last Name** (default): `Brandon Sanderson/`
- **Last Name, First Name**: `Sanderson, Brandon/`

#### Advanced Options

When grouping by author, you can configure how to handle edge cases:

**Missing Author Handling**

Some books may not have anyone marked as "Author" (graphic novels with Writers, books with only Editors, etc.). Choose how to handle these:

- **Use fallback priority** (default): Writer -> Editor -> first available contributor
- **Use fallback folder**: Places the book in a dedicated folder (customizable, default: "Various")

**Multiple Authors Handling**

Books with multiple authors (anthologies, essay collections) can be organized in two ways:

- **Use first author** (default): Places the book under the first author listed
- **Use collections folder**: Places the book in a dedicated folder (customizable, default: "Collections")

> **Note**: These advanced settings only affect folder organization. The frontmatter metadata always reflects the actual data from Hardcover.

#### Auto-organize Notes

By default, the plugin automatically moves and renames notes to match your grouping settings on every sync. If you prefer to manually organize your book notes:

- **Disable "Auto-organize notes"** to keep files where you've placed them
- Notes will stay in their current folders, but filenames will still update if you change the filename template
- New books will always follow your grouping settings

> **Note**: If you manually rename folders and then add new books to those authors/series, the plugin will create new folders following the grouping settings, potentially splitting your collection. You'll need to manually consolidate these folders if desired.

#### Important Notes

- **Multiple series**: Books in multiple series use the first series Hardcover provides for grouping, to avoid duplicate notes.

## Note Format

Each synced book creates a note with:

1. Frontmatter containing all used variables
2. Body containing all used variables
3. Hardcover delimiter line (`<!-- obsidian-hardcover-plugin-end -->`)

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
tags: ["#books", "#media"]
myCustomProp: hello
---

# Project Hail Mary

![Project Hail Mary Cover|300](https://images.hardcover.app/...)

## My Review

Lorem ipsum dolor sit amet, consectetur adipiscing elit...

## Quotes

> "Human beings have a remarkable ability to accept the abnormal and make it normal."

> "Grumpy. Angry. Stupid. How long since last sleep, question?"

<!-- obsidian-hardcover-plugin-end -->

## My Notes

These notes won't be overwritten during sync...
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full version history.

## Documentation

See [Documentation](docs/README.md).

## Roadmap

### Planned Features

Feel free to have a look at the [plugin board](https://github.com/users/aliceinwaterdeep/projects/1/views/2) to know what I'm working on and what's in the pipeline.

### Under Consideration

Ideas for new features are collected [here](https://github.com/aliceinwaterdeep/obsidian-hardcover/discussions/categories/ideas)! Feel free to upvote the features you're interested in or suggest a new one. New ideas are always welcome!

## Issues and Contributions

_Feel free to [open an issue](https://github.com/aliceinwaterdeep/obsidian-hardcover/issues) if you find bugs or have a feature idea!_

Contributions are more than welcome! It would be great if you could open an issue to discuss what you'd like to contribute to before opening a PR.

---

_Disclaimer: This plugin is not affiliated with Hardcover or Obsidian._
