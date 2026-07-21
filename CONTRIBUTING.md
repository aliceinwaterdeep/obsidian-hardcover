# Contributing

Thanks for taking an interest in this plugin! It's maintained by one person as a side project, so this doc is intentionally short.

## Dev setup

```bash
yarn install
yarn dev     # watch build
yarn test    # run the test suite
yarn build   # typecheck + production build
```

The plugin has zero runtime dependencies, please keep it that way. New functionality should be built on Obsidian's own API and the standard library rather than adding a package.

## Branching

- Active work usually happens on a version branch (e.g. `2.2.0`) rather than directly on `main`.
- If you're opening a PR, target that branch if one is open, otherwise target `main`.

## Proposing a feature

Small stuff (bug fixes, docs, small UI tweaks) —> just open a PR.

For anything bigger, a new setting, a change to sync/template/migration behavior, anything that touches how existing users' data is handled —> please open an issue or discussion first. It's much easier to align on approach before code is written.

## Opening a PR

- Keep it focused, one feature or fix per PR.
- Add/update tests for any behavior change (`yarn test` should pass).
- Add a `CHANGELOG.md` entry under the appropriate `### Added`/`### Changed`/`### Fixed` heading at the top of the file, describing the change from a user's perspective.
- **Don't bump the version** in `manifest.json`/`package.json`/`versions.json`, and don't add a `## <version>` heading to `CHANGELOG.md`. Releases (including tagging and versioning) are handled by the maintainer as a separate step.

## Code style

- Match the existing style in the file you're editing rather than introducing a new pattern.
- Avoid adding new abstractions/config options for a single use case, prefer the simplest change that solves the problem.
- PRs should reflect changes you understand and can explain. Please avoid submitting vibecoded features.

## Questions

Open an issue, or start a discussion, I'm happy to help!
