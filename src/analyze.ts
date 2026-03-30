import type { Commit } from "./types.js";

export interface CouplingResult {
  fileA: string;
  fileB: string;
  score: number;
  sharedCommits: number;
  commitHashes: string[];
}

export interface AnalyzeOptions {
  minCoupling?: number;
  minCommits?: number;
}

/**
 * Build a co-occurrence matrix from commits and compute coupling scores
 * for all file pairs using Jaccard similarity.
 *
 * Score = |commits containing both A and B| / |commits containing A or B|
 */
export function analyzeCoupling(
  commits: Commit[],
  options: AnalyzeOptions = {},
): CouplingResult[] {
  if (commits.length === 0) return [];

  const { minCoupling = 0, minCommits = 1 } = options;

  // Map each file to the set of commit hashes it appears in
  const fileCommits = new Map<string, Set<string>>();
  for (const commit of commits) {
    for (const file of commit.files) {
      let set = fileCommits.get(file);
      if (!set) {
        set = new Set();
        fileCommits.set(file, set);
      }
      set.add(commit.hash);
    }
  }

  const files = [...fileCommits.keys()].sort();
  const results: CouplingResult[] = [];

  // Iterate all unique pairs (i < j ensures deduplication and lexicographic order)
  for (let i = 0; i < files.length; i++) {
    const fileA = files[i];
    const commitsA = fileCommits.get(fileA)!;

    for (let j = i + 1; j < files.length; j++) {
      const fileB = files[j];
      const commitsB = fileCommits.get(fileB)!;

      // Intersection: commits containing both files
      const shared: string[] = [];
      for (const hash of commitsA) {
        if (commitsB.has(hash)) shared.push(hash);
      }

      if (shared.length === 0) continue;

      // Union size for Jaccard
      const unionSize = commitsA.size + commitsB.size - shared.length;
      const score = unionSize > 0 ? shared.length / unionSize : 0;

      if (score < minCoupling || shared.length < minCommits) continue;

      results.push({
        fileA,
        fileB,
        score,
        sharedCommits: shared.length,
        commitHashes: shared.sort(),
      });
    }
  }

  // Sort by score descending, then by fileA/fileB for stability
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.fileA !== b.fileA) return a.fileA < b.fileA ? -1 : 1;
    return a.fileB < b.fileB ? -1 : 1;
  });

  return results;
}
