// Browser smoke test. Serves the repo root, loads the page in Chromium and
// checks that it runs without errors and fits a phone screen.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
};

const server = http.createServer(async (req, res) => {
  try {
    let rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (rel.endsWith("/")) rel += "index.html";
    const file = path.join(root, rel);
    if (!file.startsWith(root + path.sep)) throw new Error("outside root");
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/`;

const problems = [];
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("pageerror", (e) => problems.push(`page error: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`console error: ${m.text()}`);
  });
  // Answer external hosts (Google Fonts) with an empty page, so the test does not need the network.
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) =>
    route.fulfill({ status: 200, contentType: "text/css", body: "" }),
  );

  await page.goto(url, { waitUntil: "load" });
  const ids = await page.evaluate(() => (window.PROJECTS || []).map((p) => p.id));
  if (ids.length === 0) problems.push("window.PROJECTS is empty or missing");
  for (const id of [...ids, "approach"]) {
    const found = await page.locator(`section#${id}`).count();
    if (found === 0) problems.push(`no <section id="${id}"> on the page`);
  }

  await page.setViewportSize({ width: 390, height: 800 });
  const { sw, iw } = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    iw: window.innerWidth,
  }));
  if (sw > iw) problems.push(`horizontal scroll at 390px: scrollWidth ${sw} > innerWidth ${iw}`);
} catch (e) {
  problems.push(`smoke test crashed: ${e.message}`);
} finally {
  if (browser) await browser.close();
  server.close();
}

if (problems.length) {
  console.error(`smoke failed with ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("smoke passed");
