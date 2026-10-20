/**
 * Automated Measurement & Collision Verification Script
 * Measures bounding boxes of all header elements across 10 viewports:
 * 360, 768, 1024, 1100, 1200, 1280, 1366, 1440, 1536, 1920.
 *
 * Asserts:
 *  (a) No two links/buttons intersect (badges inside their own items are permitted).
 *  (b) Nothing extends beyond the viewport width.
 *  (c) document.documentElement.scrollWidth <= window.innerWidth (zero horizontal scroll).
 *
 * Run with: node scripts/verify-header-bounds.mjs
 */

import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const WIDTHS = [360, 768, 1024, 1100, 1200, 1280, 1366, 1440, 1536, 1920];
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ARTIFACT_DIR = "/Users/devjashani/.gemini/antigravity-ide/brain/d17332ca-8b7c-492b-81c0-271345df852e";

async function run() {
  console.log("==========================================================================");
  console.log("CLAWCRAFT STUDIO - HEADER BOUNDING RECT MEASUREMENT & COLLISION AUDIT");
  console.log("==========================================================================\n");

  if (!fs.existsSync(CHROME_PATH)) {
    throw new Error(`Google Chrome binary not found at: ${CHROME_PATH}`);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Set mock / demo admin authentication cookie
  await page.setCookie({
    name: "clawcraft_admin_session",
    value: "user_studio%40clawcraft.in",
    domain: "localhost",
    path: "/",
    httpOnly: true,
  });

  const results = [];
  let allPassed = true;

  for (const urlPath of ["/admin", "/admin/settings"]) {
    console.log(`\n--- TESTING ROUTE: ${urlPath} ---`);

    for (const width of WIDTHS) {
      await page.setViewport({ width, height: 900 });
      await page.goto(`http://localhost:3000${urlPath}`, { waitUntil: "networkidle2" });
      await page.waitForSelector("header");

      // Take requested screenshots at 1200 and 1440 for /admin/settings
      if (urlPath === "/admin/settings" && (width === 1200 || width === 1440)) {
        const screenshotPath = path.join(ARTIFACT_DIR, `admin_header_${width}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`  [Screenshot captured at ${width}px]: ${screenshotPath}`);
      }

      // Collect bounding rects of all visible interactive elements in header
      const data = await page.evaluate((vpWidth) => {
        const header = document.querySelector("header");
        if (!header) return { error: "Header element not found" };

        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;
        const noHorizontalScroll = scrollWidth <= innerWidth;

        // Query all visible links and buttons inside the header
        const interactiveElements = Array.from(header.querySelectorAll("a, button"));
        const visibleItems = [];

        for (const el of interactiveElements) {
          const style = window.getComputedStyle(el);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.opacity === "0"
          ) {
            continue;
          }

          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            // Check if element is inside an active mobile drawer (if closed, top will be offscreen or hidden)
            const parentDrawer = el.closest(".lg\\:hidden");
            // If inside mobile drawer and mobile menu is closed, ignore
            if (parentDrawer && style.display === "none") continue;

            const text = (el.innerText || el.getAttribute("aria-label") || el.title || el.className)
              .replace(/\s+/g, " ")
              .trim();

            visibleItems.push({
              tag: el.tagName.toLowerCase(),
              text: text.slice(0, 30),
              top: Math.round(rect.top),
              bottom: Math.round(rect.bottom),
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            });
          }
        }

        // Check for collisions between visible interactive items (excluding child badges)
        const collisions = [];
        for (let i = 0; i < visibleItems.length; i++) {
          for (let j = i + 1; j < visibleItems.length; j++) {
            const a = visibleItems[i];
            const b = visibleItems[j];

            // Subpixel tolerance: 1px
            const intersects = !(
              a.right <= b.left + 1 ||
              a.left >= b.right - 1 ||
              a.bottom <= b.top + 1 ||
              a.top >= b.bottom - 1
            );

            if (intersects) {
              collisions.push({ itemA: a.text, itemB: b.text, a, b });
            }
          }
        }

        // Check if any element overflows the viewport width
        const overflows = visibleItems.filter((item) => item.right > vpWidth + 2 || item.left < -2);

        return {
          scrollWidth,
          innerWidth,
          noHorizontalScroll,
          visibleItemsCount: visibleItems.length,
          collisions,
          overflows,
        };
      }, width);

      const passCollisions = data.collisions.length === 0;
      const passNoOverflow = data.overflows.length === 0;
      const passScroll = data.noHorizontalScroll;
      const passOverall = passCollisions && passNoOverflow && passScroll;

      if (!passOverall) {
        allPassed = false;
      }

      results.push({
        route: urlPath,
        width,
        visibleCount: data.visibleItemsCount,
        noCollisions: passCollisions ? "PASS (0)" : `FAIL (${data.collisions.length})`,
        withinViewport: passNoOverflow ? "PASS" : `FAIL (${data.overflows.length})`,
        noHorizontalScroll: passScroll ? `PASS (${data.scrollWidth}px)` : `FAIL (${data.scrollWidth}px > ${width}px)`,
        status: passOverall ? "PASS" : "FAIL",
      });

      if (!passOverall) {
        console.error(`  [FAIL at ${width}px]:`, {
          collisions: data.collisions,
          overflows: data.overflows,
          scrollWidth: data.scrollWidth,
          innerWidth: data.innerWidth,
        });
      }
    }
  }

  await browser.close();

  // Print results table
  console.log("\n==========================================================================");
  console.log("FINAL BOUNDS & COLLISION TEST SUMMARY TABLE");
  console.log("==========================================================================");
  console.table(results);

  if (!allPassed) {
    console.error("\nSome viewports failed bounding rect verification!");
    process.exit(1);
  } else {
    console.log("\nALL VIEWPORTS (360px to 1920px) PASSED COLLISION & OVERFLOW ASSERTIONS!");
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
