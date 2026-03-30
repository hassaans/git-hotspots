#!/usr/bin/env node
import { Command } from "commander";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getGitLog } from "./git.js";
import { filterFiles } from "./filter.js";
import { analyzeCoupling } from "./analyze.js";
import { formatTerminal, formatJSON } from "./format.js";

const pkg = JSON.parse(
  readFileSync(join(import.meta.dirname, "..", "package.json"), "utf-8"),
);

const program = new Command()
  .name("git-hotspots")
  .description("Identify frequently co-changed files in a git repository")
  .version(pkg.version)
  .option("--json", "Output results as JSON")
  .option("--since <period>", "Only consider commits since this date (e.g. '6 months ago')")
  .option("--min-coupling <n>", "Minimum coupling score (0-1)", parseFloat)
  .option("--min-commits <n>", "Minimum shared commits", parseInt)
  .option("--exclude <patterns...>", "Additional glob patterns to exclude")
  .option("--limit <n>", "Maximum number of results to display", parseInt);

program.action(async (opts) => {
  try {
    const commits = await getGitLog({ since: opts.since });

    if (commits.length === 0) {
      const msg = opts.since
        ? `No commits found matching --since "${opts.since}"`
        : "No commits found in this repository";
      if (opts.json) {
        process.stdout.write(JSON.stringify([]));
      } else {
        process.stdout.write(msg + "\n");
      }
      return;
    }

    // Filter files in each commit
    const filtered = commits.map((c) => ({
      ...c,
      files: filterFiles(c.files, opts.exclude),
    }));

    const results = analyzeCoupling(filtered, {
      minCoupling: opts.minCoupling,
      minCommits: opts.minCommits,
    });

    if (opts.json) {
      process.stdout.write(formatJSON(results, { limit: opts.limit }) + "\n");
    } else {
      process.stdout.write(
        formatTerminal(results, { limit: opts.limit }) + "\n",
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Error: ${message}\n`);
    process.exitCode = 1;
  }
});

program.parse();
