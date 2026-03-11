import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const testFiles = [];

walk("src");

if (testFiles.length === 0) {
  console.error("No test files were found.");
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [
    "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
    "--test",
    "--experimental-strip-types",
    ...testFiles,
  ],
  {
    stdio: "inherit",
  },
);

if (typeof result.status === "number") {
  process.exit(result.status);
}

console.error(result.error ?? "The test runner exited without a status code.");
process.exit(1);

function walk(dirPath) {
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (entry.name.endsWith(".test.ts")) {
      testFiles.push(fullPath);
    }
  }
}
