import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseGitLog, getGitLog } from "../src/git.js";

const FIXTURE_LOG = `abc1234
Alice
2026-03-01
feat: add login

src/auth.ts
src/utils.ts

def5678
Bob
2026-03-02
fix: typo



9aa0001
Alice
2026-03-03
refactor: extract helper

src/helper.ts
`;

describe("parseGitLog", () => {
  it("parses multi-commit log into Commit[]", () => {
    const commits = parseGitLog(FIXTURE_LOG);
    expect(commits).toHaveLength(3);

    expect(commits[0]).toEqual({
      hash: "abc1234",
      author: "Alice",
      date: "2026-03-01",
      message: "feat: add login",
      files: ["src/auth.ts", "src/utils.ts"],
    });

    expect(commits[1]).toEqual({
      hash: "def5678",
      author: "Bob",
      date: "2026-03-02",
      message: "fix: typo",
      files: [],
    });

    expect(commits[2]).toEqual({
      hash: "9aa0001",
      author: "Alice",
      date: "2026-03-03",
      message: "refactor: extract helper",
      files: ["src/helper.ts"],
    });
  });

  it("returns empty array for empty input", () => {
    expect(parseGitLog("")).toEqual([]);
  });

  it("returns empty array for whitespace-only input", () => {
    expect(parseGitLog("  \n\n  ")).toEqual([]);
  });
});

describe("getGitLog", () => {
  it("returns parsed commits from a real git repo", async () => {
    // Run against the worktree itself (which is a git repo)
    const commits = await getGitLog({
      cwd: import.meta.dirname + "/..",
      since: "2000-01-01",
    });
    expect(Array.isArray(commits)).toBe(true);
    // The scaffold commit(s) should exist
    expect(commits.length).toBeGreaterThan(0);
    expect(commits[0]).toHaveProperty("hash");
    expect(commits[0]).toHaveProperty("files");
  });

  it("supports --since parameter", async () => {
    // A far-future date should yield no commits
    const commits = await getGitLog({
      cwd: import.meta.dirname + "/..",
      since: "2099-01-01",
    });
    expect(commits).toEqual([]);
  });

  it("throws with code 1 when run outside a git repo", async () => {
    await expect(
      getGitLog({ cwd: "/tmp" })
    ).rejects.toThrow();
  });
});
