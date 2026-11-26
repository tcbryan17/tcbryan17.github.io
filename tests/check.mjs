// Fast static checks. Node built-ins only, so they run without a browser.
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const fail = (msg) => errors.push(msg);

// 1. Syntax check of the scripts.
for (const file of ["app.js", "projects.js"]) {
  try {
    execFileSync(process.execPath, ["--check", path.join(root, file)], { stdio: "pipe" });
  } catch (e) {
    fail(`${file}: syntax error\n${String(e.stderr || e.message).trim()}`);
  }
}

// 2. Load projects.js in a sandbox with a fake window.
const sandbox = { window: {} };
vm.createContext(sandbox);
try {
  vm.runInContext(readFileSync(path.join(root, "projects.js"), "utf8"), sandbox, {
    filename: "projects.js",
  });
} catch (e) {
  fail(`projects.js: failed to run: ${e.message}`);
}

const { PROFILE, PROJECTS } = sandbox.window;
const ids = new Set();
if (!PROFILE || typeof PROFILE !== "object") fail("projects.js: window.PROFILE is missing");
if (!Array.isArray(PROJECTS) || PROJECTS.length === 0) {
  fail("projects.js: window.PROJECTS is missing or empty");
} else {
  const numbers = new Set();
  const statuses = ["live", "in-progress", "planned"];
  PROJECTS.forEach((p, i) => {
    const name = `PROJECTS[${i}] (${p && p.id})`;
    if (!p.id || typeof p.id !== "string") fail(`${name}: id must be a non-empty string`);
    else if (ids.has(p.id)) fail(`${name}: duplicate id "${p.id}"`);
    else ids.add(p.id);
    if (!p.number) fail(`${name}: number is missing`);
    else if (numbers.has(p.number)) fail(`${name}: duplicate number "${p.number}"`);
    else numbers.add(p.number);
    if (!p.title) fail(`${name}: title is missing`);
    if (!statuses.includes(p.status)) {
      fail(`${name}: status "${p.status}" is not one of ${statuses.join(", ")}`);
    }
    for (const key of ["demonstrates", "stack", "pipeline"]) {
      if (!Array.isArray(p[key])) fail(`${name}: ${key} must be an array`);
    }
    if (!p.links || typeof p.links !== "object" || Array.isArray(p.links)) {
      fail(`${name}: links must be an object`);
    }
  });
}

// 3. Anchors and local files referenced by index.html.
const html = readFileSync(path.join(root, "index.html"), "utf8");
const htmlIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
for (const m of html.matchAll(/href="#([^"]*)"/g)) {
  const target = m[1];
  if (!target) continue;
  if (!ids.has(target) && !htmlIds.has(target)) {
    fail(`index.html: href="#${target}" matches no project id or element id`);
  }
}
for (const m of html.matchAll(/\s(?:src|href)="([^"]+)"/g)) {
  const ref = m[1];
  if (/^(#|[a-z][a-z0-9+.-]*:|\/\/)/i.test(ref)) continue; // anchors, http:, mailto:, data:
  const file = ref.split(/[?#]/)[0];
  if (file && !existsSync(path.join(root, file))) {
    fail(`index.html: referenced file "${file}" does not exist`);
  }
}

if (errors.length) {
  console.error(`check failed with ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`check passed: ${PROJECTS.length} projects, ${htmlIds.size} ids in index.html`);
