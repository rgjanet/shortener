// Reads every link definition in /links/*.yml and generates a static
// redirect page for each one in /public/<slug>/index.html.
//
// Run with: node scripts/build-redirects.js

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const LINKS_DIR = path.join(__dirname, "..", "links");
const PUBLIC_DIR = path.join(__dirname, "..", "public");

function isSafeSlug(slug) {
  // Prevent path traversal / weird slugs from becoming filesystem paths.
  return /^[a-zA-Z0-9_-]+$/.test(slug);
}

function isSafeUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildRedirectHtml(destination) {
  const safeUrl = escapeHtml(destination);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Redirecting…</title>
  <meta http-equiv="refresh" content="0; url=${safeUrl}" />
  <link rel="canonical" href="${safeUrl}" />
  <script>window.location.replace(${JSON.stringify(destination)});</script>
</head>
<body>
  <p>Redirecting to <a href="${safeUrl}">${safeUrl}</a>…</p>
</body>
</html>
`;
}

function main() {
  if (!fs.existsSync(LINKS_DIR)) {
    console.log("No links/ directory found — nothing to build.");
    return;
  }

  const files = fs
    .readdirSync(LINKS_DIR)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));

  if (files.length === 0) {
    console.log("No link files found in links/.");
    return;
  }

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  let built = 0;
  let skipped = 0;

  for (const file of files) {
    const fullPath = path.join(LINKS_DIR, file);
    let entry;
    try {
      entry = yaml.load(fs.readFileSync(fullPath, "utf8"));
    } catch (err) {
      console.error(`Skipping ${file}: could not parse YAML (${err.message})`);
      skipped++;
      continue;
    }

    const { slug, url } = entry || {};

    if (!slug || !isSafeSlug(slug)) {
      console.error(`Skipping ${file}: missing or invalid slug "${slug}"`);
      skipped++;
      continue;
    }

    if (!url || !isSafeUrl(url)) {
      console.error(`Skipping ${file}: missing or invalid url "${url}"`);
      skipped++;
      continue;
    }

    const outDir = path.join(PUBLIC_DIR, slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), buildRedirectHtml(url));
    built++;
  }

  console.log(`Built ${built} redirect page(s), skipped ${skipped}.`);
}

main();
