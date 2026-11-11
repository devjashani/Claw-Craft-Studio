import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import http from "http";
import puppeteer from "puppeteer-core";

const PHASE = process.argv.includes("--phase=after") ? "after" : "before";
const PORT = 3009;
const BASE_URL = `http://localhost:${PORT}`;
const SCREENSHOT_DIR = path.resolve(process.cwd(), `.screenshots/${PHASE}`);

const PAGES = [
  { name: "home", path: "/" },
  { name: "shop", path: "/shop" },
  { name: "product-8-can-gun", path: "/shop/8-can-gun-sculpture" },
  { name: "about", path: "/about" },
  { name: "custom", path: "/custom" },
  { name: "contact", path: "/contact" },
];

const VIEWPORTS = [
  { label: "desktop", width: 1280, height: 900 },
  { label: "mobile", width: 390, height: 844 },
];

function checkServerReady() {
  return new Promise((resolve) => {
    const req = http.get(BASE_URL, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await checkServerReady()) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function fetchHeaders(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE_URL}${urlPath}`, { method: "HEAD" }, (res) => {
      resolve({ statusCode: res.statusCode, headers: res.headers });
    });
    req.on("error", reject);
    req.end();
  });
}

function fetchBody(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BASE_URL}${urlPath}`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.on("error", reject);
  });
}

async function main() {
  console.log(`\n==================================================`);
  console.log(`SCREENSHOT & AUDIT CAPTURE: PHASE [${PHASE.toUpperCase()}]`);
  console.log(`==================================================\n`);

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  let serverProcess = null;
  const isRunning = await checkServerReady();
  if (!isRunning) {
    console.log(`Starting Next.js production server on port ${PORT}...`);
    serverProcess = spawn("npx", ["next", "start", "-p", String(PORT)], {
      stdio: "pipe",
      env: { ...process.env, PORT: String(PORT) },
    });
    serverProcess.stderr.on("data", (d) => process.stderr.write(d.toString()));
    const ready = await waitForServer();
    if (!ready) {
      if (serverProcess) serverProcess.kill();
      throw new Error(`Server failed to start on port ${PORT}`);
    }
    console.log(`Server ready on ${BASE_URL}`);
  } else {
    console.log(`Server is already running on ${BASE_URL}`);
  }

  // 1. Inspect Response Headers & Special Endpoints
  console.log(`\n--- Inspecting Public Endpoints & Headers ---`);
  const checkPaths = ["/", "/shop", "/about", "/contact", "/custom", "/sitemap.xml", "/robots.txt", "/manifest.webmanifest"];
  const headerSummary = {};
  for (const p of checkPaths) {
    try {
      const res = await fetchBody(p);
      headerSummary[p] = {
        status: res.statusCode,
        "x-powered-by": res.headers["x-powered-by"] || null,
        "content-type": res.headers["content-type"] || null,
        "content-length": res.headers["content-length"] || res.body.length,
      };
      console.log(`Endpoint ${p.padEnd(24)} -> ${res.statusCode} | x-powered-by: ${res.headers["x-powered-by"] || "(none)"}`);
    } catch (e) {
      console.error(`Failed to fetch ${p}:`, e.message);
    }
  }

  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, `headers-${PHASE}.json`),
    JSON.stringify(headerSummary, null, 2),
    "utf8"
  );

  // 2. Capture Screenshots using Puppeteer
  console.log(`\n--- Launching Headless Chrome via Puppeteer ---`);
  const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();

  for (const p of PAGES) {
    const fullUrl = `${BASE_URL}${p.path}`;
    console.log(`\nNavigating to ${p.name} (${fullUrl})...`);

    for (const vp of VIEWPORTS) {
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
      });

      await page.goto(fullUrl, { waitUntil: "networkidle0", timeout: 20000 }).catch(async () => {
        // Fallback if animations/connections keep network open
        await page.goto(fullUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
      });

      // Wait a moment for fonts and layouts to settle
      await new Promise((r) => setTimeout(r, 1200));

      const filename = `${p.name}-${vp.label}-${vp.width}.png`;
      const filepath = path.join(SCREENSHOT_DIR, filename);
      await page.screenshot({ path: filepath, fullPage: true });
      console.log(`  ✓ Saved screenshot: ${filename} (${vp.width}x${vp.height})`);
    }
  }

  await browser.close();
  console.log(`\nBrowser closed successfully.`);

  if (serverProcess) {
    serverProcess.kill();
    console.log(`Production server stopped.`);
  }

  console.log(`\nPhase [${PHASE.toUpperCase()}] screenshots and audit saved to ${SCREENSHOT_DIR}\n`);
}

main().catch((err) => {
  console.error("Audit screenshot failed:", err);
  process.exit(1);
});
