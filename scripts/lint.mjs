import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["src"];
const SOURCE_FILE_PATTERN = /\.(ts|tsx|js|mjs)$/;

const checks = [
  {
    message: "Avoid committing console.log/debug calls.",
    pattern: /\bconsole\.(?:log|debug)\s*\(/,
  },
  {
    message: "Remove debugger statements before commit.",
    pattern: /\bdebugger\b/,
  },
  {
    message: "Remove eslint-disable comments until ESLint is introduced.",
    pattern: /eslint-disable(?:-next-line|-line)?/,
  },
];

const failures = [];
let checkedFileCount = 0;

for (const root of ROOTS) {
  walk(root);
}

if (failures.length > 0) {
  console.error("lint failed");

  for (const failure of failures) {
    console.error(`${failure.file}:${failure.line} ${failure.message}`);
  }

  process.exit(1);
}

console.log(`lint passed (${checkedFileCount} files checked)`);

function walk(dirPath) {
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!SOURCE_FILE_PATTERN.test(entry.name)) {
      continue;
    }

    checkedFileCount += 1;

    const source = readFileSync(fullPath, "utf8");
    const lines = source.split("\n");

    for (const check of checks) {
      for (const [index, line] of lines.entries()) {
        if (!check.pattern.test(line)) {
          continue;
        }

        failures.push({
          file: fullPath,
          line: index + 1,
          message: check.message,
        });
      }
    }
  }
}
