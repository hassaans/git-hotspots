import { describe, it, expect } from "vitest";
import { filterFiles, DEFAULT_EXCLUDE_PATTERNS } from "../src/filter.js";

describe("filterFiles", () => {
  it("returns empty array for empty input", () => {
    expect(filterFiles([])).toEqual([]);
  });

  it("excludes package-lock.json by default", () => {
    expect(filterFiles(["src/index.ts", "package-lock.json"])).toEqual([
      "src/index.ts",
    ]);
  });

  it("excludes yarn.lock by default", () => {
    expect(filterFiles(["src/index.ts", "yarn.lock"])).toEqual([
      "src/index.ts",
    ]);
  });

  it("excludes pnpm-lock.yaml by default", () => {
    expect(filterFiles(["src/index.ts", "pnpm-lock.yaml"])).toEqual([
      "src/index.ts",
    ]);
  });

  it("excludes *.lock files by default", () => {
    expect(filterFiles(["src/index.ts", "Gemfile.lock", "poetry.lock"])).toEqual([
      "src/index.ts",
    ]);
  });

  it("excludes dist/** files by default", () => {
    expect(
      filterFiles(["src/index.ts", "dist/index.js", "dist/utils/helper.js"])
    ).toEqual(["src/index.ts"]);
  });

  it("preserves files not matching any exclusion pattern", () => {
    const files = ["src/app.ts", "README.md", "lib/utils.ts"];
    expect(filterFiles(files)).toEqual(files);
  });

  it("supports custom --exclude glob patterns", () => {
    const files = ["src/index.ts", "src/index.test.ts", "src/app.ts"];
    expect(filterFiles(files, ["**/*.test.ts"])).toEqual([
      "src/index.ts",
      "src/app.ts",
    ]);
  });

  it("applies both default and custom exclude patterns", () => {
    const files = [
      "src/index.ts",
      "package-lock.json",
      "docs/README.md",
    ];
    expect(filterFiles(files, ["docs/**"])).toEqual(["src/index.ts"]);
  });

  it("exports DEFAULT_EXCLUDE_PATTERNS", () => {
    expect(DEFAULT_EXCLUDE_PATTERNS).toContain("package-lock.json");
    expect(DEFAULT_EXCLUDE_PATTERNS).toContain("yarn.lock");
    expect(DEFAULT_EXCLUDE_PATTERNS).toContain("pnpm-lock.yaml");
    expect(DEFAULT_EXCLUDE_PATTERNS).toContain("*.lock");
    expect(DEFAULT_EXCLUDE_PATTERNS).toContain("dist/**");
  });
});
