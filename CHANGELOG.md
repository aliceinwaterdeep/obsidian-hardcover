# Changelog

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

- Added support for loading API token from `.env` file as alternative to plugin settings
- Marked as desktop-only due to Node.js API usage (mobile users can still access synced notes)
- Added quick links to GitHub repo and issues in settings
- Changed license from MIT to GPL-3.0 to ensure continued open source development

### 1.0.0 - Initial Release

- Sync your Hardcover library to Obsidian notes
- Configurable metadata fields
- Custom filename templates
- Preserve user notes below delimiter line
- Command palette and ribbon icon for easy access
