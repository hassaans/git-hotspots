export interface Commit {
  hash: string;
  author: string;
  date: string;
  message: string;
  files: string[];
}

export interface CouplingPair {
  fileA: string;
  fileB: string;
  couplingCount: number;
  commitHashes: string[];
}
