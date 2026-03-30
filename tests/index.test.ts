import { describe, it, expect } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";

const exec = promisify(execFile);
const ROOT = join(import.meta.dirname, "..");
const run = (args: string[], cwd?: string) =>
  exec("npx", ["tsx", join(ROOT, "src/index.ts"), ...args], {
    cwd: cwd ?? ROOT,
    timeout: 15_000,
  });

describe("CLI entry point", () => {
  it("--help exits 0 and prints usage", async () => {
    const { stdout } = await run(["--help"]);
    expect(stdout).toContain("Usage:");
    expect(stdout).toContain("--json");
    expect(stdout).toContain("--since");
  });

  it("--version exits 0", async () => {
    const { stdout } = await run(["--version"]);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("runs in own repo and exits 0", async () => {
    const { stdout } = await run([]);
    // Should produce either a table or a "no coupled files" message
    expect(stdout.length).toBeGreaterThan(0);
  });

  it("--json flag switches output to JSON", async () => {
    const { stdout } = await run(["--json"]);
    // Should be valid JSON (array)
    const parsed = JSON.parse(stdout);
    expect(Array.isArray(parsed) || typeof parsed === "string").toBe(true);
  });

  it("accepts --since flag", async () => {
    const { stdout } = await run(["--since", "1 year ago"]);
    expect(stdout.length).toBeGreaterThan(0);
  });

  it("accepts --min-coupling flag", async () => {
    const { stdout } = await run(["--min-coupling", "0.5"]);
    expect(stdout.length).toBeGreaterThan(0);
  });

  it("accepts --min-commits flag", async () => {
    const { stdout } = await run(["--min-commits", "2"]);
    expect(stdout.length).toBeGreaterThan(0);
  });

  it("accepts --exclude flag", async () => {
    const { stdout } = await run(["--exclude", "*.md"]);
    expect(stdout.length).toBeGreaterThan(0);
  });

  it("accepts --limit flag", async () => {
    const { stdout } = await run(["--limit", "5"]);
    expect(stdout.length).toBeGreaterThan(0);
  });

  it("exits 1 with error outside a git repo", async () => {
    try {
      await run([], "/tmp");
      expect.fail("should have thrown");
    } catch (err: unknown) {
      const e = err as { code?: number; stderr?: string };
      expect(e.code).toBe(1);
      expect(e.stderr).toBeTruthy();
    }
  });
});
