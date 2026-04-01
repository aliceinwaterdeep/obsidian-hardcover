# Migrating to v2.0.0

## Overview

Version 2.0.0 introduces a **customizable note template** and split **book/edition data**. This is a breaking change.

> **Note:** This guide is for reference only. Migration happens automatically when you upgrade, you don't need to do anything. The migration will preserve your customizations, and your notes will look identical after upgrade.

---

## Changes

### 1. Body Content is Now Template-Based

**Before v2.0.0:**

- Note body structure was hardcoded
- Frontmatter: toggle based configuration (enable/disable fields, set property names)
- Order and formatting were fixed

**After v2.0.0:**

- Single unified template for both frontmatter and body
- Use `{{variables}}` to place content
- Complete control over order, formatting, headings, and layout

**Migration:** The old body structure is automatically converted to a template that produces identical notes, including custom headings.

---

### 2. Book and Edition Fields are Separate

**Before v2.0.0:**

- Fields like "title", "authors", "cover" had a source preference (book or edition)
- You chose one source per field

**After v2.0.0:**

- Fields are split: `bookTitle`/`editionTitle`, `bookAuthors`/`editionAuthors`, etc.
- Each has its own enable toggle for frontmatter
- Both are available as template variables

**Migration:**

- Your old source preferences determine which version gets enabled
- Your custom property names are preserved
- Templates use the version you had selected

**Example:**

- You had: `title` with source="edition", propertyName="customTitle"

- You now have: `editionTitle` enabled with propertyName="customTitle", `bookTitle` disabled

---

### 3. Wikilinks are Global Settings

**Before v2.0.0:**

- Wikilinks toggles were in each frontmatter property setting

**After v2.0.0:**

- Wikilinks settings are moved to their own section
- They are applied to both frontmatter and body content

**Migration:** Old wikilink settings are extracted and moved to global settings.

---

## What happens during migration

When you upgrade to v2.0.0, the plugin automatically:

1. **Splits combined fields** into book/edition versions
2. **Preserves your custom property names** on the enabled version
3. **Builds a template** from your old enabled fields and custom headings
4. **Extracts wikilink settings** to global configuration
5. **Extracts quotes format** to dedicated setting
6. **Updates filename template** syntax from `${}` to `{{}}`
7. **Removes obsolete settings** (dataSourcePreferences, field-level wikilinks)

**Your notes will look identical after migration.**

---

## After Migration

### 1. Review your note template

Settings -> Note Template

Your old structure was converted to a template. Check if it looks correct. Example:

```
---
title: {{editionTitle}}
cover: {{bookCover}}
---

# {{editionTitle}}
![{{editionTitle}} Cover|300]({{editionCover}})

{{description}}

## Review
{{review}}

## Quotes
{{quotes}}
```

### 2. Verify wikilink settings

Settings -> Wikilinks -> Configure wikilinks

Your old wikilink settings should be reflected here.

### 4. Run a test sync

1. Backup your vault just in case
2. Use Debug -> Test sync with 1-5 books
3. Verify notes look correct
4. If satisfied, sync your full library

---

## Troubleshooting

### My notes look different after migration

This shouldn't happen if migration worked correctly. Please check that the Note Template in settings matches your old structure.

If something's wrong, manually adjust the template to match your old notes, then run the sync again.

### Can I roll back to v1.x?

Yes, but:

1. Uninstall v2.0.0
2. Manually install v1.9.0 from releases
3. Your notes will remain unchanged
4. You'll need to reconfigure settings

---

## Getting Help

If you encounter issues, feel free to reach out or open an issue with:

- What happened vs what you expected
- Your v1.x settings (if you have them)
- Screenshots if helpful

I'll do my best to help
