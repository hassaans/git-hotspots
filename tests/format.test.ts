import { describe, it, expect } from "vitest";
import { formatTerminal, formatJSON } from "../src/format.js";
import type { CouplingResult } from "../src/analyze.js";

const sampleResults: CouplingResult[] = [
  {
    fileA: "src/foo.ts",
    fileB: "src/bar.ts",
    score: 0.857,
    sharedCommits: 6,
    commitHashes: ["aaa", "bbb", "ccc", "ddd", "eee", "fff"],
  },
  {
    fileA: "src/baz.ts",
    fileB: "src/qux.ts",
    score: 0.5,
    sharedCommits: 3,
    commitHashes: ["aaa", "bbb", "ccc"],
  },
  {
    fileA: "src/a.ts",
    fileB: "src/b.ts",
    score: 0.333,
    sharedCommits: 2,
    commitHashes: ["aaa", "bbb"],
  },
];

describe("formatTerminal", () => {
  it("shows fileA, fileB, coupling score, and shared commit count columns", () => {
    const output = formatTerminal(sampleResults);
    // Header row should contain all four column names
    expect(output).toContain("File A");
    expect(output).toContain("File B");
    expect(output).toContain("Score");
    expect(output).toContain("Commits");
    // Data rows should contain values
    expect(output).toContain("src/foo.ts");
    expect(output).toContain("src/bar.ts");
    expect(output).toContain("0.86");
    expect(output).toContain("6");
  });

  it("respects --limit flag", () => {
    const output = formatTerminal(sampleResults, { limit: 1 });
    expect(output).toContain("src/foo.ts");
    expect(output).not.toContain("src/baz.ts");
    expect(output).not.toContain("src/a.ts");
  });

  it("prints informative message for empty results", () => {
    const output = formatTerminal([]);
    expect(output).toContain("No coupled files found");
  });

  it("does not throw when stdout is not a TTY (piped)", () => {
    // formatTerminal returns a string, no TTY dependency
    expect(() => formatTerminal(sampleResults)).not.toThrow();
  });
});

describe("formatJSON", () => {
  it("outputs valid JSON array of CouplingResult objects", () => {
    const output = formatJSON(sampleResults);
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toEqual(sampleResults[0]);
  });

  it("respects --limit flag", () => {
    const output = formatJSON(sampleResults, { limit: 2 });
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(2);
  });

  it("outputs empty array for no results", () => {
    const output = formatJSON([]);
    const parsed = JSON.parse(output);
    expect(parsed).toEqual([]);
  });

  it("prints informative message for empty results when emptyMessage is true", () => {
    const output = formatJSON([], { emptyMessage: true });
    expect(output).toContain("No coupled files found");
  });
});
