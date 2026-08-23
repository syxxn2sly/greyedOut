#!/usr/bin/env node
/**
 * Dumps lib/copy.ts to docs/copy.md and docs/copy.json for reading or marking
 * up outside the editor.
 *
 * The generated files are a view, never the source — edit lib/copy.ts and
 * re-run this. Functions are called with placeholder arguments so their shape
 * is visible; the placeholders are wrapped in {braces} and are not real text.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "docs");
mkdirSync(outDir, { recursive: true });

// copy.ts is plain data with no imports, so it can be evaluated directly once
// the TypeScript-only bits are stripped. That avoids adding a build step just
// to read the file.
/** Strip `name: Type` annotations from arrow-function parameter lists. */
const stripParamTypes = (s) =>
  s.replace(/\(([^()]*)\)(\s*=>)/g, (whole, params, arrow) => {
    if (!params.includes(":")) return whole;
    const bare = params
      .split(",")
      .map((p) => p.split(":")[0].trim())
      .filter(Boolean)
      .join(", ");
    return `(${bare})${arrow}`;
  });

const src = stripParamTypes(
  readFileSync(resolve(root, "lib/copy.ts"), "utf8")
    .replace(/^export const copy = /m, "return ")
    .replace(/ as const;\s*$/, ";")
    .replace(/^\/\*\*[\s\S]*?\*\/\s*/, ""),
);

// eslint-disable-next-line no-new-func
const copy = new Function(src)();

/** Functions are sampled so the report shows their shape, not just "ƒ". */
const PLACEHOLDERS = {
  wake: "{time}", time: "{time}", from: "{from}", to: "{to}", task: "{task}",
  tasks: "{tasks}", name: "{name}", label: "{label}", sub: "{sub}",
  open: "{n}", count: "{n}", n: "{n}", cal: "{cal}", pro: "{pro}",
  held: "{held}", total: "{total}", min: "{n}", item: "{item}",
};

const callSample = (fn) => {
  const args = (fn.toString().match(/\(([^)]*)\)/)?.[1] ?? "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => PLACEHOLDERS[a] ?? `{${a}}`);
  try {
    return fn(...args);
  } catch {
    return "(dynamic)";
  }
};

const walk = (node, path = []) => {
  const rows = [];
  for (const [key, value] of Object.entries(node)) {
    const here = [...path, key];
    if (typeof value === "string") rows.push({ key: here.join("."), text: value });
    else if (typeof value === "function")
      rows.push({ key: here.join("."), text: callSample(value), dynamic: true });
    else if (Array.isArray(value))
      value.forEach((v, i) =>
        rows.push({ key: `${here.join(".")}[${i}]`, text: String(v) }),
      );
    else if (value && typeof value === "object") rows.push(...walk(value, here));
  }
  return rows;
};

const rows = walk(copy);

// ── json ────────────────────────────────────────────────────────────────────
writeFileSync(
  resolve(outDir, "copy.json"),
  `${JSON.stringify(
    Object.fromEntries(rows.map((r) => [r.key, r.text])),
    null,
    2,
  )}\n`,
);

// ── markdown ────────────────────────────────────────────────────────────────
const sections = new Map();
for (const r of rows) {
  const section = r.key.split(".")[0];
  if (!sections.has(section)) sections.set(section, []);
  sections.get(section).push(r);
}

const words = rows.reduce((a, r) => a + r.text.trim().split(/\s+/).length, 0);

let md = `# Every word in Greyed Out

${rows.length} strings · roughly ${words} words. Generated from \`lib/copy.ts\` —
edit that file, not this one, then run \`npm run copy:report\`.

\`{braces}\` mark values filled in at runtime, not literal text.

`;

for (const [section, items] of sections) {
  md += `## ${section}\n\n| key | text |\n| --- | --- |\n`;
  for (const r of items) {
    const text = r.text.replace(/\|/g, "\\|").replace(/\n/g, " ");
    md += `| \`${r.key}\` | ${text} |\n`;
  }
  md += "\n";
}

writeFileSync(resolve(outDir, "copy.md"), md);

console.log(`${rows.length} strings · ~${words} words`);
console.log("docs/copy.md");
console.log("docs/copy.json");
