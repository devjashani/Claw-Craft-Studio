/**
 * Verification Test Script for Admin Attention Counts, Badges, Header Layout, and Settings
 * Run with: node scripts/test-admin-attention-counts.mjs
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("==================================================================");
console.log("CLAWCRAFT STUDIO - ADMIN HEADER & ATTENTION VERIFICATION SUITE");
console.log("==================================================================\n");

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
  }
}

async function runTests() {
  // 1. AUDIT & CONSTANTS INTEGRITY
  console.log("TEST GROUP 1: Attention Constants & Status Mapping (src/lib/admin/attention.ts)");

  const attentionFilePath = path.join(process.cwd(), "src/lib/admin/attention.ts");
  const attentionContent = fs.readFileSync(attentionFilePath, "utf-8");

  test("Constant ATTENTION_ORDER_STATUSES includes 'paid'", () => {
    assert.match(attentionContent, /ATTENTION_ORDER_STATUSES.*\[.*"paid".*\]/s);
  });

  test("Constant ATTENTION_ORDER_STATUSES strictly excludes pending_payment, failed, processing, etc.", () => {
    const match = attentionContent.match(/export const ATTENTION_ORDER_STATUSES[^;]+/);
    assert.ok(match, "ATTENTION_ORDER_STATUSES definition found");
    const definition = match[0];
    assert.ok(!definition.includes('"pending_payment"'), "Must NOT include pending_payment");
    assert.ok(!definition.includes('"processing"'), "Must NOT include processing");
    assert.ok(!definition.includes('"shipped"'), "Must NOT include shipped");
    assert.ok(!definition.includes('"delivered"'), "Must NOT include delivered");
    assert.ok(!definition.includes('"cancelled"'), "Must NOT include cancelled");
    assert.ok(!definition.includes('"refunded"'), "Must NOT include refunded");
  });

  test("Constant ATTENTION_INQUIRY_STATUSES strictly includes 'new' and excludes downstream stages", () => {
    const match = attentionContent.match(/export const ATTENTION_INQUIRY_STATUSES[^;]+/);
    assert.ok(match, "ATTENTION_INQUIRY_STATUSES definition found");
    const definition = match[0];
    assert.ok(definition.includes('"new"'), "Must include 'new'");
    assert.ok(!definition.includes('"reviewing"'), "Must NOT include reviewing");
    assert.ok(!definition.includes('"quoted"'), "Must NOT include quoted");
    assert.ok(!definition.includes('"accepted"'), "Must NOT include accepted");
    assert.ok(!definition.includes('"in_progress"'), "Must NOT include in_progress");
    assert.ok(!definition.includes('"completed"'), "Must NOT include completed");
  });

  test("Sound configuration helpers exist, dispatches ADMIN_SOUND_CHANGE_EVENT, and handles localStorage safely", () => {
    assert.ok(attentionContent.includes("getAdminSoundEnabled"), "getAdminSoundEnabled exists");
    assert.ok(attentionContent.includes("setAdminSoundEnabled"), "setAdminSoundEnabled exists");
    assert.ok(attentionContent.includes("playNotificationChime"), "playNotificationChime exists");
    assert.ok(attentionContent.includes("ADMIN_SOUND_CHANGE_EVENT"), "ADMIN_SOUND_CHANGE_EVENT exists");
    assert.ok(attentionContent.includes("try {"), "localStorage access is wrapped in try/catch");
  });

  // 2. BADGE COMPONENT & CORNER POSITIONING
  console.log("\nTEST GROUP 2: Badge UI Logic, 99+ Cap, & Corner Positioning (src/components/admin/admin-nav-badge.tsx)");

  const badgeFilePath = path.join(process.cwd(), "src/components/admin/admin-nav-badge.tsx");
  const badgeContent = fs.readFileSync(badgeFilePath, "utf-8");

  test("Badge component caps counts at '99+' and hides when count <= 0", () => {
    assert.ok(badgeContent.includes('if (count <= 0) return null'), "Hidden when count <= 0");
    assert.ok(badgeContent.includes('count > 99 ? "99+" : String(count)'), "Caps at 99+");

    const formatBadge = (c) => (c <= 0 ? null : c > 99 ? "99+" : String(c));
    assert.equal(formatBadge(0), null);
    assert.equal(formatBadge(-1), null);
    assert.equal(formatBadge(1), "1");
    assert.equal(formatBadge(11), "11");
    assert.equal(formatBadge(42), "42");
    assert.equal(formatBadge(99), "99");
    assert.equal(formatBadge(100), "99+");
    assert.equal(formatBadge(999), "99+");
  });

  test("Badge is absolutely positioned at top-right corner with 2px ring separation", () => {
    assert.ok(badgeContent.includes("-top-2"), "Positioned at top -8px (-top-2)");
    assert.ok(badgeContent.includes("-right-2"), "Positioned at right -8px (-right-2)");
    assert.ok(badgeContent.includes("absolute"), "Must be absolutely positioned");
    assert.ok(badgeContent.includes("shadow-[0_0_0_2px_#111214"), "2px ring separation in header background color (#111214)");
  });

  test("Badge contains accessible aria-label, sr-only element, and motion-safe ping animation", () => {
    assert.ok(badgeContent.includes("role=\"status\""), "Includes role=status");
    assert.ok(badgeContent.includes("aria-label="), "Includes aria-label");
    assert.ok(badgeContent.includes("sr-only"), "Includes sr-only screen reader announcement");
    assert.ok(badgeContent.includes("motion-safe:animate-ping"), "Ping animation uses motion-safe for reduced motion");
  });

  // 3. HEADER LAYOUT, OVERFLOW FIX, & ACCOUNT BLOCK
  console.log("\nTEST GROUP 3: Header 3-Zone Layout, Overflow Fix, & Account Block (src/components/admin/admin-nav.tsx)");

  const navFilePath = path.join(process.cwd(), "src/components/admin/admin-nav.tsx");
  const navContent = fs.readFileSync(navFilePath, "utf-8");

  test("Header removed the old 'SOUND ON/OFF' button completely", () => {
    assert.ok(!navContent.includes("SOUND ON"), "SOUND ON text must be gone from header");
    assert.ok(!navContent.includes("SOUND OFF"), "SOUND OFF text must be gone from header");
  });

  test("Header layout has three zones: Left, Centre (flex-1 min-w-0), and Right (shrink-0)", () => {
    assert.ok(navContent.includes("flex-1 min-w-0"), "Nav zone has flex-1 min-w-0");
    assert.ok(navContent.includes("shrink-0"), "Account block is shrink-0 to prevent viewport overflow");
    assert.ok(navContent.includes("overflow-visible"), "Header and nav allow corner badges to be visible without clipping");
  });

  test("Account block displays truncated email with title attribute and Artisan Admin subtitle", () => {
    assert.ok(navContent.includes("title={userEmail}"), "Email has title attribute with full userEmail");
    assert.ok(navContent.includes("truncate max-w-[180px]"), "Email is truncated with max-width ~180px");
    assert.ok(navContent.includes("Artisan Admin"), "Contains 'Artisan Admin' subtitle");
    assert.ok(navContent.includes("Store"), "Keep 'Store' link always visible");
    assert.ok(navContent.includes("LogOut"), "Keep Sign Out button always visible");
  });

  test("Responsive rules use 'lg' breakpoint for desktop vs mobile drawer", () => {
    assert.ok(navContent.includes("hidden lg:flex"), "Desktop nav uses lg:flex");
    assert.ok(navContent.includes("lg:hidden"), "Mobile menu button and drawer use lg:hidden");
  });

  // 4. ADMIN SETTINGS PAGE NOTIFICATIONS & SOUND CONTROLS
  console.log("\nTEST GROUP 4: Admin Settings Notifications & Sound Controls (src/app/admin/settings/page.tsx)");

  const settingsFilePath = path.join(process.cwd(), "src/app/admin/settings/page.tsx");
  const settingsContent = fs.readFileSync(settingsFilePath, "utf-8");

  test("Settings page has 'Play a sound when a new order or inquiry arrives' toggle", () => {
    assert.ok(settingsContent.includes("Play a sound when a new order or inquiry arrives"), "Toggle text present");
    assert.ok(settingsContent.includes("Live Audio Notifications"), "Audio notifications section present");
  });

  test("Settings page has 'Play test sound' button and browser blocked hint", () => {
    assert.ok(settingsContent.includes("Play test sound"), "Play test sound button exists");
    assert.ok(settingsContent.includes("Your browser blocks sounds until you click anywhere on the page once"), "Browser permission hint present");
  });

  test("Settings synchronizes sound state live with attention hook", () => {
    assert.ok(settingsContent.includes("ADMIN_SOUND_CHANGE_EVENT"), "Settings listens to/uses ADMIN_SOUND_CHANGE_EVENT");
  });

  // 5. SERVER API ROUTE & CLIENT POLLING LOGIC
  console.log("\nTEST GROUP 5: Server API Route Security & Zero PII Guarantee");

  const routeFilePath = path.join(process.cwd(), "src/app/api/admin/notification-counts/route.ts");
  const routeContent = fs.readFileSync(routeFilePath, "utf-8");

  test("API route uses assertAdminApi() server authentication and no-store header", () => {
    assert.ok(routeContent.includes("assertAdminApi"), "Must call assertAdminApi");
    assert.ok(routeContent.includes("no-store"), "Must have no-store header");
  });

  test("API query selects only exact count and identifiers (zero PII exposure)", () => {
    assert.ok(!routeContent.includes("customer_name"), "Must NOT query customer_name");
    assert.ok(!routeContent.includes("customer_email"), "Must NOT query customer_email");
    assert.ok(!routeContent.includes("customer_phone"), "Must NOT query customer_phone");
    assert.ok(!routeContent.includes("shipping_address"), "Must NOT query shipping_address");
    assert.ok(routeContent.includes("order_number"), "Selects order_number for latestOrder");
    assert.ok(routeContent.includes("ref_code"), "Selects ref_code for latestInquiry");
  });

  const hookFilePath = path.join(process.cwd(), "src/lib/admin/use-admin-counts.ts");
  const hookContent = fs.readFileSync(hookFilePath, "utf-8");

  test("Hook listens to ADMIN_SOUND_CHANGE_EVENT for live preference updates without reload", () => {
    assert.ok(hookContent.includes("ADMIN_SOUND_CHANGE_EVENT"), "Hook listens to ADMIN_SOUND_CHANGE_EVENT");
    assert.ok(hookContent.includes("storage"), "Hook listens to storage event");
  });

  test("Hook toasts only on count increase and updates tab title", () => {
    assert.ok(hookContent.includes("isFirstLoadRef.current"), "Guards initial load against toast");
    assert.ok(hookContent.includes("newOrders > prevOrdersRef.current"), "Only toasts on order count increase");
    assert.ok(hookContent.includes("newInquiries > prevInquiriesRef.current"), "Only toasts on inquiry count increase");
    assert.ok(hookContent.includes("document.title = `(${total})"), "Sets (N) prefix when total > 0");
  });

  // SUMMARY
  console.log("\n==================================================================");
  console.log(`VERIFICATION RESULTS: ${passed} / ${total} tests passed.`);
  console.log("==================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
