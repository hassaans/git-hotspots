import type { CouplingResult } from "./analyze.js";

export interface FormatOptions {
  limit?: number;
  emptyMessage?: boolean;
}

export function formatTerminal(
  results: CouplingResult[],
  options: FormatOptions = {},
): string {
  if (results.length === 0) {
    return "No coupled files found";
  }

  const items = options.limit ? results.slice(0, options.limit) : results;

  // Column definitions
  const headers = ["File A", "File B", "Score", "Commits"];

  // Build rows
  const rows = items.map((r) => [
    r.fileA,
    r.fileB,
    r.score.toFixed(2),
    String(r.sharedCommits),
  ]);

  // Calculate column widths
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((row) => row[i].length)),
  );

  // Format a single row with padding
  const fmtRow = (cells: string[]) =>
    cells.map((c, i) => c.padEnd(widths[i])).join("  ");

  const headerLine = fmtRow(headers);
  const separator = widths.map((w) => "-".repeat(w)).join("  ");
  const dataLines = rows.map(fmtRow);

  return [headerLine, separator, ...dataLines].join("\n");
}

export function formatJSON(
  results: CouplingResult[],
  options: FormatOptions = {},
): string {
  if (results.length === 0 && options.emptyMessage) {
    return "No coupled files found";
  }

  const items = options.limit ? results.slice(0, options.limit) : results;
  return JSON.stringify(items, null, 2);
}
