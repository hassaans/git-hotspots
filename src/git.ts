import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Commit } from "./types.js";

const execFileAsync = promisify(execFile);

/**
 * Parse raw `git log --pretty=format:... --name-only` output into Commit[].
 *
 * Format per commit (blank lines separate header from files, and commits from each other):
 *   <hash>\n<author>\n<date>\n<message>\n\n[file1\nfile2\n...]\n
 */
export function parseGitLog(raw: string): Commit[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const commits: Commit[] = [];

  // Split on double-newline boundaries that precede a 40-char hex hash (full) or short hash
  // Each record: hash\nauthor\ndate\nmessage\n\nfile1\nfile2...
  const records = trimmed.split(/\n{2,}(?=[0-9a-f]{7,40}\n)/);

  for (const record of records) {
    const lines = record.split("\n");
    // First 4 non-empty lines are hash, author, date, message
    const nonEmpty = lines.filter((l) => l.length > 0);
    if (nonEmpty.length < 4) continue;

    const [hash, author, date, message, ...filePaths] = nonEmpty;
    commits.push({
      hash,
      author,
      date,
      message,
      files: filePaths.filter((f) => f.length > 0),
    });
  }

  return commits;
}

export interface GetGitLogOptions {
  cwd?: string;
  since?: string;
}

export async function getGitLog(options: GetGitLogOptions = {}): Promise<Commit[]> {
  const args = [
    "log",
    "--pretty=format:%H%n%an%n%ad%n%s",
    "--date=short",
    "--name-only",
  ];

  if (options.since) {
    args.push(`--since=${options.since}`);
  }

  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd: options.cwd,
      maxBuffer: 50 * 1024 * 1024,
    });
    return parseGitLog(stdout);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : String(err);
    const error = new Error(`git log failed: ${message}`);
    (error as NodeJS.ErrnoException).code = "1";
    throw error;
  }
}
