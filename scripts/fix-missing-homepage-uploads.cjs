/**
 * Replace homepage CMS /uploads/... URLs that are missing on disk
 * with the matching default asset (or a safe Unsplash fallback).
 *
 * Run on the app host from the standalone app root:
 *   node scripts/fix-missing-homepage-uploads.cjs
 */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const FALLBACK =
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1000&q=80";

function fileExists(publicRelUrl) {
  const clean = publicRelUrl.split("?")[0];
  if (!clean.startsWith("/")) return true;
  return fs.existsSync(path.join(process.cwd(), "public", clean));
}

function walkReplace(node, defaultsNode, changed) {
  if (Array.isArray(node)) {
    const defs = Array.isArray(defaultsNode) ? defaultsNode : [];
    return node.map((item, i) =>
      walkReplace(item, defs[i], changed),
    );
  }
  if (node && typeof node === "object") {
    const out = { ...node };
    for (const key of Object.keys(out)) {
      const val = out[key];
      const defVal =
        defaultsNode && typeof defaultsNode === "object"
          ? defaultsNode[key]
          : undefined;
      if (typeof val === "string" && val.includes("/uploads/")) {
        if (!fileExists(val)) {
          const replacement =
            typeof defVal === "string" && !defVal.includes("/uploads/")
              ? defVal
              : FALLBACK;
          out[key] = replacement;
          changed.push({ from: val, to: replacement, key });
        }
      } else if (val && typeof val === "object") {
        out[key] = walkReplace(val, defVal, changed);
      }
    }
    return out;
  }
  return node;
}

async function main() {
  // Prefer built-in defaults from the packaged app if present via JSON dump;
  // otherwise only FALLBACK is used when defaultsNode is missing.
  let defaults = null;
  const defaultsPath = path.join(
    process.cwd(),
    "scripts",
    "homepage-defaults-snapshot.json",
  );
  if (fs.existsSync(defaultsPath)) {
    defaults = JSON.parse(fs.readFileSync(defaultsPath, "utf8"));
  }

  const prisma = new PrismaClient();
  const row = await prisma.homepageConfig.findUnique({
    where: { id: "default" },
  });
  if (!row) {
    console.log("No HomepageConfig row");
    await prisma.$disconnect();
    return;
  }

  const changed = [];
  const next = walkReplace(row.data, defaults, changed);

  if (changed.length === 0) {
    console.log("Nothing to fix");
    await prisma.$disconnect();
    return;
  }

  await prisma.homepageConfig.update({
    where: { id: "default" },
    data: { data: next },
  });

  console.log(`Fixed ${changed.length} missing upload URLs:`);
  for (const c of changed) {
    console.log(`- ${c.key}: ${c.from} -> ${c.to}`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
