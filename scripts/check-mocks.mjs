// Fails (exit 1) while any placeholder content remains in /content:
// values tagged "[mock]" or entries flagged `mock: true`.
// Run before launch: `node scripts/check-mocks.mjs` (see MOCKS.md).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("../content", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (/\.(md|mdoc|ya?ml|json)$/.test(name)) yield path;
  }
}

const found = [];
for (const file of walk(root)) {
  const text = readFileSync(file, "utf8");
  const rel = relative(root, file).replaceAll("\\", "/");
  // Ignore comments so notes like "# [mock] = placeholder" don't count.
  const lines = text.split("\n").map((l) => l.replace(/(^|\s)#.*$/, ""));
  const tags = lines.filter((l) => /\[mock\]/i.test(l)).length;
  const whole = lines.some((l) => /^mock:\s*true\s*$/.test(l));
  if (whole || tags) found.push(`${rel}  (${whole ? "invented entry" : `${tags} [mock] value(s)`})`);
}

if (found.length) {
  console.error(`✗ ${found.length} file(s) still contain mock content:\n  ` + found.join("\n  "));
  process.exit(1);
}
console.log("✓ No mock content left.");
