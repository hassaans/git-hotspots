# git-hotspots

Identify frequently co-changed files in a git repository. Find hidden coupling between files by analyzing which files tend to change together across commits.

## Installation

```bash
npm install -g git-hotspots
```

Or run directly with npx:

```bash
npx git-hotspots
```

## Usage

Run inside any git repository:

```bash
git-hotspots
```

### Flags

| Flag | Description |
|------|-------------|
| `--json` | Output results as JSON |
| `--since <period>` | Only consider commits since this date (e.g. `"6 months ago"`, `2024-01-01`) |
| `--min-coupling <n>` | Minimum coupling score between 0 and 1 (default: all) |
| `--min-commits <n>` | Minimum number of shared commits (default: all) |
| `--exclude <patterns...>` | Additional glob patterns to exclude (e.g. `"*.md" "*.json"`) |
| `--limit <n>` | Maximum number of results to display |
| `-V, --version` | Output the version number |
| `-h, --help` | Display help |

## Example Output

### Terminal (default)

```
$ git-hotspots --limit 5

File A      File B            Score  Commits
----------  ----------------  -----  -------
.gitignore  LICENSE           1.00   1
.gitignore  src/types.ts      1.00   1
.gitignore  tsconfig.json     1.00   1
.gitignore  vitest.config.ts  1.00   1
LICENSE     src/types.ts      1.00   1
```

### JSON

```
$ git-hotspots --json --limit 3

[
  {
    "fileA": ".gitignore",
    "fileB": "LICENSE",
    "score": 1,
    "sharedCommits": 1,
    "commitHashes": ["b8598025f0086d4e5b697c3b6973286bb4f4ffa1"]
  },
  {
    "fileA": ".gitignore",
    "fileB": "src/types.ts",
    "score": 1,
    "sharedCommits": 1,
    "commitHashes": ["b8598025f0086d4e5b697c3b6973286bb4f4ffa1"]
  },
  ...
]
```

### Filtering

```bash
# Only recent changes
git-hotspots --since "3 months ago"

# High-coupling pairs with at least 5 shared commits
git-hotspots --min-coupling 0.7 --min-commits 5

# Exclude test and config files
git-hotspots --exclude "*.test.ts" "*.config.*"

# Top 10 results as JSON
git-hotspots --json --limit 10
```

## License

MIT
