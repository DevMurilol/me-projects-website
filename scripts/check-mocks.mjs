// Fails (exit 1) while any placeholder content remains: values tagged "[mock]" or entries
// flagged `mock: true` in /content, and any mock marker in the built pages (dist/).
// Runs after every `npm run build`. On Cloudflare preview branches it only warns, so
// placeholders can be reviewed on a preview URL but never reach production (main).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("../content", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (/\.(md|mdoc|ya?ml|json|html)$/.test(name)) yield path;
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

// Also check the built site (if present): catches "[mock]" written straight into a page template.
const dist = new URL("../dist", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
let hasDist = true;
try {
  statSync(dist);
} catch {
  hasDist = false;
}
if (hasDist) {
  for (const file of walk(dist)) {
    if (!file.endsWith(".html")) continue;
    const html = readFileSync(file, "utf8");
    if (html.includes('class="mock"') || /\[mock\]/i.test(html.replace(/<script[\s\S]*?<\/script>/g, ""))) {
      found.push(`dist/${relative(dist, file).replaceAll("\\", "/")}  (rendered page)`);
    }
  }
}

if (found.length) {
  console.error(`✗ ${found.length} file(s) still contain mock content:\n  ` + found.join("\n  "));
  const branch = process.env.CF_PAGES_BRANCH;
  if (branch && branch !== "main") {
    console.warn(`Preview branch "${branch}": allowed here, but must be fixed before merging to main.`);
    process.exit(0);
  }
  process.exit(1);
}
console.log("✓ No mock content left.");
