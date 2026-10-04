import { build } from "vite";
import { mkdir, readFile, readdir, writeFile, copyFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const project = process.cwd();
const fixtureDir = path.join(project, ".cache", "operations-qa");
await mkdir(fixtureDir, { recursive: true });
await build({
  configFile: false,
  resolve: { alias: { "@": project } },
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: { outDir: fixtureDir, emptyOutDir: false, lib: { entry: path.join(project, "components/admin/operations-browser.fixture.tsx"), formats: ["es"], fileName: () => "staff-fixture.js", cssFileName: "staff-fixture" }, minify: false },
});
const globals = (await readFile(path.join(project, "app/globals.css"), "utf8")).replace(/^@import[^;]+;/gm, "");
let fonts = "";
const chunks = path.join(project, ".next/dev/static/chunks");
for (const filename of await readdir(chunks)) {
  if (!filename.includes("internal_font_google_barlow") && !filename.includes("internal_font_google_source_sans")) continue;
  const css = await readFile(path.join(chunks, filename), "utf8");
  for (const match of css.matchAll(/url\("\.\.\/media\/([^"/]+)"\)/g)) {
    await mkdir(path.join(fixtureDir, "media"), { recursive: true });
    await copyFile(path.join(project, ".next/dev/static/media", match[1]), path.join(fixtureDir, "media", match[1]));
  }
  fonts += css.replaceAll("../media/", "./media/");
}
await writeFile(path.join(fixtureDir, "globals.css"), `${globals}\n${fonts}\n:root{--font-display:'Barlow Condensed';--font-sans:'Source Sans 3'}nav button{min-height:48px;padding:12px 20px;background:transparent;border:0;font-size:14px}nav button:hover{background:#f1f5fb}`);
await writeFile(path.join(fixtureDir, "index.html"), '<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Staff component QA — synthetic fixture</title><link rel="stylesheet" href="/globals.css"><link rel="stylesheet" href="/staff-fixture.css"></head><body><div id="root"></div><script type="module" src="/staff-fixture.js"></script></body></html>');
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2" };
if (!process.argv.includes("--build-only")) createServer(async (request, response) => {
  try {
    const relative = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const filename = path.resolve(fixtureDir, `.${relative === "/" ? "/index.html" : relative}`);
    if (!filename.startsWith(`${fixtureDir}${path.sep}`)) { response.writeHead(403); response.end("Forbidden"); return; }
    const content = await readFile(filename);
    response.writeHead(200, { "Content-Type": types[path.extname(filename)] ?? "application/octet-stream", "Cache-Control": "no-store" });
    response.end(content);
  } catch { response.writeHead(404); response.end("Fixture asset not found"); }
}).listen(3004, "127.0.0.1", () => { console.log("Staff component fixture: http://localhost:3004 — synthetic data, no academy API calls."); });
