# Changelog

### 1.5.1

- Improvements to comply with Obsidian plugin review guidelines
- Due to the changes, plugin is now mobile compatible (removed desktop-only restriction)
- Improved performance by leveraging Obsidian's metadata cache
- Improved code quality

### 1.5.0

- New: Added support for ISBN-10 and ISBN-13 fields
- New: Added 'Last Name, First Name' format option for author directories
- Added a workaround for imperfect Hardcover metadata where author's role is author's own name
- Thanks to @coffeemonk!

### 1.4.0

- New: Lists field support - display your Hardcover lists in book notes
- Lists can be formatted as wikilinks to create linked notes
- Lists field is disabled by default, enable it in settings
- Thanks to @sisypheand for the suggestion!

### 1.3.2

- Refactored wikilink formatting to apply only during note generation for clean directory names (improved from 1.3.1 hotfix)

### 1.3.1

- Fixed an issue where enabling both wikilinks and grouping would cause directory names to be formatted as `[[wikilinks]]`

### 1.3.0

- New: Directory organization feature: group books by author, series, or author → series
- Choose your preferred structure in the settings
- Only affects newly synced books. Existing notes remain in place
- Use first author/series for books with multiple entries
- Thanks to @imcompiling for the suggestion!

### 1.2.0

- **New:** Wikilink support for authors, contributors, series, publisher, and genres
- Individual toggles per field in settings, disabled by default
- Thanks to @Saorsa32 for the suggestion!

### 1.1.2

- Removing logs to comply with Obsidian's guidelines. No functional changes

### 1.1.1

- Improvements to comply with Obsidian's review. No functional changes

### 1.1.0

- Plugin ID changed from `obsidian-hardcover` to `hardcover` to comply with Obsidian rules
- **Action required:** Users upgrading from v1.0.x must delete old folder and restore settings ([see README](README.md#updating-from-versions-before-110))
- Updated plugin description to remove "Obsidian" reference as per Obsidian guidelines
- Replaced `innerHTML` usage with DOM API methods

### 1.0.3

- Updated UI text to follow Obsidian's style guidelines (sentence case, headings)
- Replaced `Vault.modify` with `Vault.process` for better file handling during sync
- Reduced console logs noise in production

### 1.0.2

- Updated plugin metadata. No functional changes

### 1.0.1

- Added support for loading API token from `.env` file as alternative to plugin settings (thanks to @imcompiling for the suggestion!)
- Marked as desktop-only due to Node.js API usage (mobile users can still access synced notes)
- Added quick links to GitHub repo and issues in settings
- Changed license from MIT to GPL-3.0 to ensure continued open source development

### 1.0.0 - Initial Release

- Sync your Hardcover library to Obsidian notes
- Configurable metadata fields
- Custom filename templates
- Preserve user notes below delimiter line
- Command palette and ribbon icon for easy access
