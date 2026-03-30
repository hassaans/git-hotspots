import { describe, it, expect } from "vitest";
import { analyzeCoupling } from "../src/analyze.js";
import type { Commit } from "../src/types.js";

const makeCommit = (hash: string, files: string[]): Commit => ({
  hash,
  author: "test",
  date: "2026-01-01",
  message: "test commit",
  files,
});

describe("analyzeCoupling", () => {
  it("returns empty results for empty commit list", () => {
    const result = analyzeCoupling([]);
    expect(result).toEqual([]);
  });

  it("returns empty results when commits have fewer than 2 files", () => {
    const commits = [
      makeCommit("aaa", ["a.ts"]),
      makeCommit("bbb", ["b.ts"]),
    ];
    const result = analyzeCoupling(commits);
    expect(result).toEqual([]);
  });

  it("computes coupling score as Jaccard similarity", () => {
    // a.ts and b.ts both in commit 1 and 2; a.ts also in commit 3 alone
    // sharedCommits(a,b) = 2, union(a,b) = 3 => score = 2/3
    const commits = [
      makeCommit("c1", ["a.ts", "b.ts"]),
      makeCommit("c2", ["a.ts", "b.ts"]),
      makeCommit("c3", ["a.ts"]),
    ];
    const result = analyzeCoupling(commits);
    expect(result).toHaveLength(1);
    expect(result[0].fileA).toBe("a.ts");
    expect(result[0].fileB).toBe("b.ts");
    expect(result[0].score).toBeCloseTo(2 / 3);
    expect(result[0].sharedCommits).toBe(2);
    expect(result[0].commitHashes).toEqual(["c1", "c2"]);
  });

  it("produces scores between 0 and 1 inclusive", () => {
    const commits = [
      makeCommit("c1", ["a.ts", "b.ts", "c.ts"]),
      makeCommit("c2", ["a.ts", "b.ts"]),
      makeCommit("c3", ["b.ts", "c.ts"]),
      makeCommit("c4", ["a.ts"]),
    ];
    const result = analyzeCoupling(commits);
    for (const pair of result) {
      expect(pair.score).toBeGreaterThanOrEqual(0);
      expect(pair.score).toBeLessThanOrEqual(1);
    }
  });

  it("deduplicates pairs: (A,B) and (B,A) produce one result", () => {
    const commits = [
      makeCommit("c1", ["b.ts", "a.ts"]), // note: b before a
      makeCommit("c2", ["a.ts", "b.ts"]),
    ];
    const result = analyzeCoupling(commits);
    expect(result).toHaveLength(1);
    // fileA should be lexicographically first
    expect(result[0].fileA).toBe("a.ts");
    expect(result[0].fileB).toBe("b.ts");
  });

  it("filters by minCoupling threshold", () => {
    // a-b: 2/3, a-c: 1/3, b-c: 1/3
    const commits = [
      makeCommit("c1", ["a.ts", "b.ts", "c.ts"]),
      makeCommit("c2", ["a.ts", "b.ts"]),
      makeCommit("c3", ["a.ts"]),
    ];
    const result = analyzeCoupling(commits, { minCoupling: 0.6 });
    expect(result).toHaveLength(1);
    expect(result[0].fileA).toBe("a.ts");
    expect(result[0].fileB).toBe("b.ts");
  });

  it("filters by minCommits threshold", () => {
    const commits = [
      makeCommit("c1", ["a.ts", "b.ts", "c.ts"]),
      makeCommit("c2", ["a.ts", "b.ts"]),
      makeCommit("c3", ["a.ts", "c.ts"]),
    ];
    // a-b: 2 shared, a-c: 2 shared, b-c: 1 shared
    const result = analyzeCoupling(commits, { minCommits: 2 });
    expect(result).toHaveLength(2);
    const pairs = result.map((r) => `${r.fileA}-${r.fileB}`);
    expect(pairs).toContain("a.ts-b.ts");
    expect(pairs).toContain("a.ts-c.ts");
  });

  it("combines minCoupling and minCommits filters", () => {
    const commits = [
      makeCommit("c1", ["a.ts", "b.ts", "c.ts"]),
      makeCommit("c2", ["a.ts", "b.ts"]),
      makeCommit("c3", ["a.ts", "c.ts"]),
      makeCommit("c4", ["c.ts"]),
    ];
    // a-b: shared=2, union=3, score=0.667
    // a-c: shared=2, union=4, score=0.5
    // b-c: shared=1, union=3, score=0.333
    const result = analyzeCoupling(commits, { minCoupling: 0.5, minCommits: 2 });
    expect(result).toHaveLength(2);
  });

  it("returns deterministic results for known fixture", () => {
    const commits = [
      makeCommit("c1", ["x.ts", "y.ts"]),
      makeCommit("c2", ["x.ts", "y.ts", "z.ts"]),
      makeCommit("c3", ["y.ts", "z.ts"]),
    ];
    const r1 = analyzeCoupling(commits);
    const r2 = analyzeCoupling(commits);
    expect(r1).toEqual(r2);

    // x-y: shared=2, union=3, score=2/3
    // x-z: shared=1, union=3, score=1/3
    // y-z: shared=2, union=3, score=2/3
    expect(r1).toHaveLength(3);
    const xy = r1.find((p) => p.fileA === "x.ts" && p.fileB === "y.ts")!;
    expect(xy.score).toBeCloseTo(2 / 3);
    expect(xy.sharedCommits).toBe(2);

    const xz = r1.find((p) => p.fileA === "x.ts" && p.fileB === "z.ts")!;
    expect(xz.score).toBeCloseTo(1 / 3);
    expect(xz.sharedCommits).toBe(1);

    const yz = r1.find((p) => p.fileA === "y.ts" && p.fileB === "z.ts")!;
    expect(yz.score).toBeCloseTo(2 / 3);
    expect(yz.sharedCommits).toBe(2);
  });

  it("sorts results by score descending", () => {
    const commits = [
      makeCommit("c1", ["a.ts", "b.ts", "c.ts"]),
      makeCommit("c2", ["a.ts", "b.ts"]),
      makeCommit("c3", ["c.ts"]),
    ];
    const result = analyzeCoupling(commits);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
    }
  });
});
