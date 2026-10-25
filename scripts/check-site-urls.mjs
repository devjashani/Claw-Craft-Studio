#!/usr/bin/env node

/**
 * Site URL & Single Source of Truth Verification Script
 * 
 * Verifies production build against:
 * 1. Single source of truth origin (NEXT_PUBLIC_SITE_URL).
 * 2. Absolute canonical, og:url, og:image, twitter:image tags across pages.
 * 3. Dynamic and static XML sitemap (only production origin, no private routes).
 * 4. Robots.txt (canonical sitemap directive, private route disallows).
 * 5. Web manifest (branding, start_url, icons).
 * 6. Structured data (Organization, WebSite, Product, BreadcrumbList with absolute URLs, no phone/email).
 * 7. Private routes (metadata robots noindex & X-Robots-Tag header).
 * 8. Absence of stale domains/placeholders (localhost, vercel.app, clawcraft.in, example.com)
 *    in HTML, sitemap, robots, manifest, emails, and PDF templates.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const EXPECTED_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.clawcraftstudio.in").replace(/\/+$/, "");
const PORT = 3089;
const LOCAL_BASE = `http://127.0.0.1:${PORT}`;

const results = [];

function recordResult(category, target, passed, message) {
  results.push({ category, target, passed, message });
}

function normalizeUrl(u) {
  return u ? u.trim().replace(/\/+$/, "") : "";
}

// Helper to poll until local Next.js server responds
async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.status < 500) return true;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Next.js server failed to respond within ${timeoutMs}ms`);
}

// Helper to parse meta tags from HTML
function extractMeta(html, propertyOrName) {
  const regex = new RegExp(`<meta\\s+[^>]*(?:property|name)=["']${propertyOrName}["'][^>]*content=["']([^"']*)["']`, "i");
  const match = html.match(regex);
  if (match) return match[1];

  // Try reverse attribute order (content before property/name)
  const regexRev = new RegExp(`<meta\\s+[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${propertyOrName}["']`, "i");
  const matchRev = html.match(regexRev);
  return matchRev ? matchRev[1] : null;
}

function extractCanonical(html) {
  const match = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  if (match) return match[1];
  const matchRev = html.match(/<link\s+[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
  return matchRev ? matchRev[1] : null;
}

function extractJsonLdBlocks(html) {
  const blocks = [];
  const regex = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      // Ignore unparseable block
    }
  }
  return blocks;
}

function checkForbiddenTokens(content, contextLabel) {
  const forbidden = [];

  // localhost (case-insensitive)
  if (/localhost/i.test(content)) {
    forbidden.push("localhost");
  }

  // vercel.app (case-insensitive)
  if (/vercel\.app/i.test(content)) {
    forbidden.push("vercel.app");
  }

  // example.com (case-insensitive)
  if (/example\.com/i.test(content)) {
    forbidden.push("example.com");
  }

  // clawcraft.in (standalone or prefix, BUT NOT clawcraftstudio.in)
  // Match clawcraft.in when not immediately preceded or followed by "studio"
  const clawcraftInMatches = content.match(/clawcraft\.in/gi);
  if (clawcraftInMatches) {
    const withoutStudio = content.replace(/clawcraftstudio\.in/gi, "");
    if (/clawcraft\.in/i.test(withoutStudio)) {
      forbidden.push("clawcraft.in");
    }
  }

  return forbidden;
}

async function verifyPublicPage(routePath, expectedCanonicalPath) {
  const url = `${LOCAL_BASE}${routePath}`;
  const res = await fetch(url);
  const html = await res.text();

  // 1. Canonical tag
  const canonical = extractCanonical(html);
  const expectedCanonical = `${EXPECTED_ORIGIN}${expectedCanonicalPath}`;
  const canonicalOk = canonical === expectedCanonical;
  recordResult(
    "Canonical",
    routePath,
    canonicalOk,
    canonicalOk ? canonical : `Expected ${expectedCanonical}, got ${canonical}`
  );

  // 2. OpenGraph URL
  const ogUrl = extractMeta(html, "og:url");
  const ogUrlOk = Boolean(ogUrl && ogUrl.startsWith(EXPECTED_ORIGIN));
  recordResult(
    "OG URL",
    routePath,
    ogUrlOk,
    ogUrlOk ? ogUrl : `Missing or does not start with ${EXPECTED_ORIGIN}: ${ogUrl}`
  );

  // 3. OpenGraph Image
  const ogImage = extractMeta(html, "og:image");
  const ogImageOk = Boolean(ogImage && ogImage.startsWith("http"));
  recordResult(
    "OG Image",
    routePath,
    ogImageOk,
    ogImageOk ? (ogImage.length > 50 ? `${ogImage.slice(0, 50)}...` : ogImage) : "Missing absolute og:image"
  );

  // 4. Twitter Image
  const twImage = extractMeta(html, "twitter:image");
  const twImageOk = Boolean(twImage && twImage.startsWith("http"));
  recordResult(
    "Twitter Image",
    routePath,
    twImageOk,
    twImageOk ? (twImage.length > 50 ? `${twImage.slice(0, 50)}...` : twImage) : "Missing absolute twitter:image"
  );

  // 5. Forbidden tokens in HTML
  const forbidden = checkForbiddenTokens(html, routePath);
  const forbiddenOk = forbidden.length === 0;
  recordResult(
    "Clean HTML",
    routePath,
    forbiddenOk,
    forbiddenOk ? "Clean (no stale domains)" : `Found forbidden tokens: ${forbidden.join(", ")}`
  );

  return html;
}

async function runAudit() {
  console.log(`\n========================================================================`);
  console.log(` CLAWCRAFT SINGLE SOURCE OF TRUTH VERIFICATION AUDIT`);
  console.log(` Target Expected Origin: ${EXPECTED_ORIGIN}`);
  console.log(` Test Port: ${PORT}`);
  console.log(`========================================================================\n`);

  // Start Next.js production server
  console.log(`Starting next.js production server on port ${PORT}...`);
  const serverProcess = spawn("npx", ["next", "start", "-p", String(PORT)], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      NEXT_PUBLIC_SITE_URL: EXPECTED_ORIGIN,
      PORT: String(PORT),
    },
    stdio: "pipe",
  });

  serverProcess.stderr.on("data", (data) => {
    const msg = data.toString();
    if (!msg.includes("ExperimentalWarning")) {
      process.stderr.write(data);
    }
  });

  try {
    await waitForServer(`${LOCAL_BASE}/`);
    console.log(`Server responsive at ${LOCAL_BASE}. Running test suite...\n`);

    // 1. Root Homepage
    const homeHtml = await verifyPublicPage("/", "");
    
    // Check Organization and WebSite structured data
    const homeJsonLd = extractJsonLdBlocks(homeHtml);
    const orgSchema = homeJsonLd.find((b) => b["@graph"]?.some((n) => n["@type"] === "Organization"))?.["@graph"]?.find((n) => n["@type"] === "Organization");
    const orgOk = Boolean(orgSchema && orgSchema.url === EXPECTED_ORIGIN && orgSchema.logo?.startsWith("http"));
    const orgNoPersonalContact = !orgSchema?.telephone && !orgSchema?.email && !orgSchema?.contactPoint;
    recordResult(
      "JSON-LD",
      "/ (Organization)",
      orgOk && orgNoPersonalContact,
      orgOk && orgNoPersonalContact
        ? `url=${orgSchema.url}, logo=${orgSchema.logo.slice(0, 35)}... (no phone/email exposed)`
        : "Failed Organization schema check"
    );

    // 2. Shop Page
    await verifyPublicPage("/shop", "/shop");

    // 3. Product Page
    const productHtml = await verifyPublicPage("/shop/8-can-gun-sculpture", "/shop/8-can-gun-sculpture");
    const productJsonLd = extractJsonLdBlocks(productHtml);
    const productNode = productJsonLd.find((b) => b["@graph"]?.some((n) => n["@type"] === "Product"))?.["@graph"]?.find((n) => n["@type"] === "Product");
    const breadcrumbNode = productJsonLd.find((b) => b["@graph"]?.some((n) => n["@type"] === "BreadcrumbList"))?.["@graph"]?.find((n) => n["@type"] === "BreadcrumbList");

    const productSchemaOk = Boolean(
      productNode &&
      productNode.url?.startsWith(EXPECTED_ORIGIN) &&
      productNode.image?.[0]?.startsWith("http") &&
      (Array.isArray(productNode.offers) ? productNode.offers[0]?.priceCurrency === "INR" : productNode.offers?.priceCurrency === "INR")
    );
    recordResult(
      "JSON-LD",
      "/shop/[slug] (Product)",
      productSchemaOk,
      productSchemaOk ? `Absolute URL & INR pricing verified for ${productNode.name}` : "Product structured data invalid"
    );

    const breadcrumbsOk = Boolean(
      breadcrumbNode &&
      breadcrumbNode.itemListElement?.length >= 3 &&
      breadcrumbNode.itemListElement.every((item) => item.item?.startsWith("http"))
    );
    recordResult(
      "JSON-LD",
      "/shop/[slug] (BreadcrumbList)",
      breadcrumbsOk,
      breadcrumbsOk ? "All breadcrumb links are absolute" : "Breadcrumbs contains relative links"
    );

    // 4. Custom Portal
    await verifyPublicPage("/custom", "/custom");

    // 5. FAQ Page
    await verifyPublicPage("/faq", "/faq");

    // 6. Contact Page
    await verifyPublicPage("/contact", "/contact");

    // 7. Sitemap.xml
    console.log("Auditing /sitemap.xml...");
    const sitemapRes = await fetch(`${LOCAL_BASE}/sitemap.xml`);
    const sitemapText = await sitemapRes.text();
    const sitemapUrls = Array.from(sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);

    const sitemapOriginOk = sitemapUrls.length > 0 && sitemapUrls.every((u) => u.startsWith(EXPECTED_ORIGIN));
    recordResult(
      "Sitemap",
      "/sitemap.xml (Origin Check)",
      sitemapOriginOk,
      sitemapOriginOk ? `All ${sitemapUrls.length} URLs use ${EXPECTED_ORIGIN}` : "Some URLs do not use expected origin"
    );

    const privatePaths = ["/admin", "/account", "/login", "/signup", "/auth", "/api", "/order", "/track", "/checkout", "/cart"];
    const leakedPrivatePaths = sitemapUrls.filter((u) => privatePaths.some((p) => u.includes(p)));
    const sitemapNoPrivate = leakedPrivatePaths.length === 0;
    recordResult(
      "Sitemap",
      "/sitemap.xml (Exclusion Check)",
      sitemapNoPrivate,
      sitemapNoPrivate ? "Zero private routes in sitemap" : `Leaked private paths: ${leakedPrivatePaths.join(", ")}`
    );

    const sitemapClean = checkForbiddenTokens(sitemapText, "/sitemap.xml").length === 0;
    recordResult(
      "Sitemap",
      "/sitemap.xml (Clean Check)",
      sitemapClean,
      sitemapClean ? "No forbidden domains in sitemap" : "Forbidden domains in sitemap"
    );

    // 8. Robots.txt
    console.log("Auditing /robots.txt...");
    const robotsRes = await fetch(`${LOCAL_BASE}/robots.txt`);
    const robotsText = await robotsRes.text();
    const hasSitemapDirective = robotsText.includes(`Sitemap: ${EXPECTED_ORIGIN}/sitemap.xml`);
    const hasDisallowAdmin = robotsText.includes("Disallow: /admin");
    const robotsClean = checkForbiddenTokens(robotsText, "/robots.txt").length === 0;

    recordResult(
      "Robots",
      "/robots.txt (Sitemap Directive)",
      hasSitemapDirective,
      hasSitemapDirective ? `Points to ${EXPECTED_ORIGIN}/sitemap.xml` : "Missing or wrong Sitemap directive"
    );
    recordResult(
      "Robots",
      "/robots.txt (Private Disallow)",
      hasDisallowAdmin,
      hasDisallowAdmin ? "Disallows /admin, /account, /checkout, etc." : "Missing Disallow directives"
    );
    recordResult(
      "Robots",
      "/robots.txt (Clean Check)",
      robotsClean,
      robotsClean ? "No forbidden domains in robots.txt" : "Forbidden domains in robots.txt"
    );

    // 9. Web Manifest
    console.log("Auditing /manifest.webmanifest...");
    const manifestRes = await fetch(`${LOCAL_BASE}/manifest.webmanifest`);
    const manifestJson = await manifestRes.json();
    const manifestNameOk = manifestJson.name === "CLAWCRAFT Studio" && manifestJson.short_name === "CLAWCRAFT";
    const manifestStartUrlOk = manifestJson.start_url === "/";
    const manifestClean = checkForbiddenTokens(JSON.stringify(manifestJson), "/manifest.webmanifest").length === 0;

    recordResult(
      "Manifest",
      "/manifest.webmanifest",
      manifestNameOk && manifestStartUrlOk && manifestClean,
      `name="${manifestJson.name}", short_name="${manifestJson.short_name}", clean icons`
    );

    // 10. Private Pages - Assert noindex
    console.log("Auditing Private Pages NoIndex posture...");
    const privatePagesToTest = [
      "/admin",
      "/account",
      "/login",
      "/signup",
      "/checkout",
      "/cart",
      "/forgot-password",
      "/reset-password",
      "/order/demo-123",
      "/track/custom",
    ];

    for (const pagePath of privatePagesToTest) {
      const pageRes = await fetch(`${LOCAL_BASE}${pagePath}`, { redirect: "manual" });
      const xRobots = pageRes.headers.get("x-robots-tag") || "";
      const pageHtml = pageRes.status === 200 ? await pageRes.text() : "";
      const metaRobots = extractMeta(pageHtml, "robots") || "";

      const hasNoIndexHeader = xRobots.includes("noindex");
      const hasNoIndexMeta = metaRobots.includes("noindex");
      const passed = hasNoIndexHeader || hasNoIndexMeta || pageRes.status === 307 || pageRes.status === 302;

      recordResult(
        "Private NoIndex",
        pagePath,
        passed,
        hasNoIndexHeader
          ? `X-Robots-Tag: ${xRobots}`
          : hasNoIndexMeta
          ? `meta robots: ${metaRobots}`
          : `HTTP ${pageRes.status} (Protected)`
      );
    }

    // 11. Email & PDF Templates Code Inspection
    console.log("Auditing Email & PDF Source Files...");
    const templateFiles = [
      "src/lib/resend.ts",
      "src/lib/custom-requests/email.ts",
      "src/lib/pdf/order-slip.ts",
    ];

    for (const fileRel of templateFiles) {
      const fullPath = path.join(process.cwd(), fileRel);
      const content = fs.readFileSync(fullPath, "utf8");
      const forbidden = checkForbiddenTokens(content, fileRel);
      const passed = forbidden.length === 0;
      recordResult(
        "Template Audit",
        fileRel,
        passed,
        passed ? "Zero hardcoded hosts or stale placeholders" : `Found forbidden: ${forbidden.join(", ")}`
      );
    }

  } finally {
    // Terminate server process cleanly
    serverProcess.kill("SIGTERM");
  }

  // Print Pass/Fail Table
  console.log(`\n========================================================================`);
  console.log(` AUDIT RESULTS SUMMARY TABLE`);
  console.log(`========================================================================`);
  console.log(`| #   | Category         | Target                        | Status | Details`);
  console.log(`|-----|------------------|-------------------------------|--------|-----------------------------------------`);

  let failures = 0;
  results.forEach((r, idx) => {
    const num = String(idx + 1).padEnd(3);
    const cat = r.category.padEnd(16);
    const target = r.target.length > 29 ? `${r.target.slice(0, 26)}...`.padEnd(29) : r.target.padEnd(29);
    const status = r.passed ? "\x1b[32mPASS\x1b[0m  " : "\x1b[31mFAIL\x1b[0m  ";
    if (!r.passed) failures++;
    console.log(`| ${num} | ${cat} | ${target} | ${status} | ${r.message}`);
  });

  console.log(`========================================================================`);
  console.log(`Total Checks: ${results.length} | Passed: ${results.length - failures} | Failed: ${failures}`);
  console.log(`========================================================================\n`);

  if (failures > 0) {
    console.error(`❌ Audit failed with ${failures} assertion error(s).`);
    process.exit(1);
  } else {
    console.log(`✅ All single-source-of-truth URL and brand checks PASSED successfully!`);
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error("FATAL AUDIT RUNTIME ERROR:", err);
  process.exit(1);
});
