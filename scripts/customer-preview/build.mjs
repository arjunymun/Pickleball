import { build } from "vite";
import { mkdir, readFile, readdir, writeFile, copyFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const project = process.cwd();
const fixtureDir = path.join(project, ".cache", "customer-qa");
await mkdir(fixtureDir, { recursive: true });
await build({
  configFile: false,
  resolve: { alias: { "@": project, "next/link": path.join(project, "scripts/customer-preview/next-link.tsx"), "next/navigation": path.join(project, "scripts/customer-preview/next-navigation.ts"), "next/image": path.join(project, "scripts/customer-preview/next-image.tsx") } },
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: { outDir: fixtureDir, emptyOutDir: true, lib: { entry: path.join(project, "scripts/customer-preview/customer-browser.fixture.tsx"), formats: ["es"], fileName: () => "customer-fixture.js", cssFileName: "customer-fixture" }, minify: false },
});
const globals = (await readFile(path.join(project, "app/globals.css"), "utf8")).replace(/^@import[^;]+;/gm, "");
let fonts = "";
const chunks = path.join(project, ".next/dev/static/chunks");
try {
  for (const filename of await readdir(chunks)) {
    if (!filename.includes("internal_font_google_barlow") && !filename.includes("internal_font_google_source_sans")) continue;
    const css = await readFile(path.join(chunks, filename), "utf8");
    for (const match of css.matchAll(/url\("\.\.\/media\/([^"/]+)"\)/g)) {
      await mkdir(path.join(fixtureDir, "media"), { recursive: true });
      await copyFile(path.join(project, ".next/dev/static/media", match[1]), path.join(fixtureDir, "media", match[1]));
    }
    fonts += css.replaceAll("../media/", "./media/");
  }
} catch { /* The system fonts in app/globals.css remain the fallback when Next has not generated font assets. */ }
await writeFile(path.join(fixtureDir, "globals.css"), `${globals}\n${fonts}\n:root{--font-display:'Barlow Condensed';--font-sans:'Source Sans 3'}`);
await mkdir(path.join(fixtureDir, "images"), { recursive: true });
for (const filename of ["academy-daylight.jpg", "academy-evening.jpg", "academy-courts.jpg"]) await copyFile(path.join(project, "public/images", filename), path.join(fixtureDir, "images", filename));
await writeFile(path.join(fixtureDir, "index.html"), '<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Customer component QA — synthetic fixture</title><link rel="stylesheet" href="/globals.css"><link rel="stylesheet" href="/customer-fixture.css"></head><body><div id="root"></div><script type="module" src="/customer-fixture.js"></script></body></html>');
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".jpg": "image/jpeg" };
if (!process.argv.includes("--build-only")) createServer(async (request, response) => {
  try {
    const relative = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    let filename = path.resolve(fixtureDir, `.${relative === "/" ? "/index.html" : relative}`);
    if (!filename.startsWith(`${fixtureDir}${path.sep}`)) { response.writeHead(403); response.end("Forbidden"); return; }
    let content;
    try { content = await readFile(filename); }
    catch {
      if (path.extname(relative)) throw new Error("Missing fixture asset");
      filename = path.join(fixtureDir, "index.html");
      content = await readFile(filename);
    }
    response.writeHead(200, { "Content-Type": types[path.extname(filename)] ?? "application/octet-stream", "Cache-Control": "no-store" });
    response.end(content);
  } catch { response.writeHead(404); response.end("Fixture asset not found"); }
}).listen(3005, "127.0.0.1", () => { console.log("Customer component fixture: http://localhost:3005 — synthetic data, no academy API calls."); });
