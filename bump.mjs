import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

// Bumps package.json/manifest.json/versions.json and adds a CHANGELOG.md
// heading, then commits. Pushing/merging that commit to main triggers CI
// to tag and draft a GitHub release (see .github/workflows/release.yml).
// Usage: node bump.mjs [patch|minor|major]

const bumpType = process.argv[2];
if (!["patch", "minor", "major"].includes(bumpType)) {
	console.error("Usage: node bump.mjs [patch|minor|major]");
	process.exit(1);
}

const gitStatus = execSync("git status --porcelain").toString();
if (gitStatus.trim()) {
	console.error(
		"Error: Working directory is not clean. Commit or stash your changes first.",
	);
	console.error(gitStatus);
	process.exit(1);
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
let [major, minor, patch] = pkg.version.split(".").map(Number);
if (bumpType === "major") {
	major += 1;
	minor = 0;
	patch = 0;
} else if (bumpType === "minor") {
	minor += 1;
	patch = 0;
} else {
	patch += 1;
}
const targetVersion = `${major}.${minor}.${patch}`;

const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = await rl.question(
	`Bump ${pkg.version} -> ${targetVersion}? (y/n) `,
);
rl.close();
if (!/^y$/i.test(answer.trim())) {
	console.log("Aborted.");
	process.exit(1);
}

pkg.version = targetVersion;
writeFileSync("package.json", JSON.stringify(pkg, null, "\t") + "\n");

// read minAppVersion from manifest.json and bump version to target version
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

// update versions.json with target version and minAppVersion from manifest.json
const versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));

// insert a version heading above the "Unreleased" notes in CHANGELOG.md,
// unless one is already there (added by hand before running this script)
const changelogHeader = "# Changelog\n\n";
const versionHeading = `## ${targetVersion}`;
let changelog = readFileSync("CHANGELOG.md", "utf8");
if (!changelog.startsWith(changelogHeader)) {
	throw new Error(`CHANGELOG.md must start with "${changelogHeader.trim()}"`);
}
if (!changelog.startsWith(`${changelogHeader}${versionHeading}`)) {
	changelog = changelog.replace(
		changelogHeader,
		`${changelogHeader}${versionHeading}\n\n`,
	);
	writeFileSync("CHANGELOG.md", changelog);
}

execSync("git add package.json manifest.json versions.json CHANGELOG.md");
execSync(`git commit -m "Bump version to ${targetVersion}"`);

console.log(
	"Done. Review with 'git show', then push/merge to main to trigger the release.",
);
