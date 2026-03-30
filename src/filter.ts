export const DEFAULT_EXCLUDE_PATTERNS: string[] = [
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "*.lock",
  "dist/**",
];

/**
 * Convert a simple glob pattern to a RegExp.
 * Supports *, **, and ? wildcards.
 */
function globToRegex(pattern: string): RegExp {
  let re = "";
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === "*" && pattern[i + 1] === "*") {
      // ** matches any path segments
      re += ".*";
      i += 2;
      if (pattern[i] === "/") i++; // skip trailing slash after **
    } else if (ch === "*") {
      // * matches anything except /
      re += "[^/]*";
      i++;
    } else if (ch === "?") {
      re += "[^/]";
      i++;
    } else if (".+^${}()|[]\\".includes(ch)) {
      re += "\\" + ch;
      i++;
    } else {
      re += ch;
      i++;
    }
  }
  return new RegExp("^" + re + "$");
}

/**
 * Filter out files matching exclusion glob patterns.
 * Applies DEFAULT_EXCLUDE_PATTERNS plus any custom patterns.
 */
export function filterFiles(
  files: string[],
  extraExclude: string[] = []
): string[] {
  if (files.length === 0) return [];

  const patterns = [...DEFAULT_EXCLUDE_PATTERNS, ...extraExclude];
  const regexes = patterns.map(globToRegex);

  return files.filter(
    (file) => !regexes.some((re) => re.test(file))
  );
}
