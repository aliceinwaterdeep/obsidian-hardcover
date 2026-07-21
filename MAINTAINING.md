# Maintaining

Notes for the maintainer (yes, basically a reminder to self :D), not contributor-facing. See [CONTRIBUTING.md](CONTRIBUTING.md) for that.

## Releasing a new version

1. Finish the work on the version branch (e.g. `2.2.0`). Make sure `CHANGELOG.md`'s top section (before the first `## ` heading) accurately lists everything going out in this release.
2. `yarn test && yarn build` -> check before bumping.
3. `yarn bump patch|minor|major` -> Bumps `package.json`/`manifest.json`/`versions.json` and inserts the `## <version>` heading in `CHANGELOG.md`, then commits.
4. `git push`, then merge that branch into `main` (or push directly if there's nothing to merge).
5. CI notices `manifest.json`'s version isn't tagged yet, tags it, builds, and opens a **draft** GitHub release with notes pulled from the matching `CHANGELOG.md` section. See `.github/workflows/release.yml`.
6. Review the draft release on GitHub, edit if needed, click **Publish**.

Obsidian's community plugin list picks up new versions from the published GitHub release automatically.
