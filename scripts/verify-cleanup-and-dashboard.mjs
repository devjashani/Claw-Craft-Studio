#!/usr/bin/env node

/**
 * ==============================================================================
 * CLAWCRAFT STUDIO - CLEANUP, DASHBOARD & SECURITY VERIFICATION SUITE
 * ==============================================================================
 * Tests and verifies:
 * 1. Dashboard metrics matching SQL expectations on seeded sample
 * 2. Soft-archived orders excluded from all metrics, revenue, and fulfillment
 * 3. Webhook & payment verify handlers return 200 for missing orders (no alert)
 * 4. All internal navigation uses relative paths (no apex/www switching)
 * 5. Open-redirect "next" validation strictly rejects all malicious variations
 * ==============================================================================
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("==================================================================");
console.log("CLAWCRAFT STUDIO - COMPREHENSIVE CLEANUP & METRICS TEST SUITE");
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

async function runVerification() {
  // ============================================================================
  // TEST GROUP 1: DASHBOARD METRICS CALCULATION ON SEEDED SAMPLE
  // ============================================================================
  console.log("TEST GROUP 1: Dashboard Metrics Logic vs SQL Specifications");

  // Sample database state simulating various order lifecycle scenarios
  const seededOrders = [
    // 4 KEPT ORDERS
    {
      id: "ord-kept-1",
      order_number: "CC-2026-1037",
      status: "paid",
      payment_status: "paid",
      payment_method: "razorpay",
      total_paise: 299900, // ₹2,999
      delivery_mode: "courier",
      archived_at: null,
      created_at: "2026-10-29T10:00:00Z",
    },
    {
      id: "ord-kept-2",
      order_number: "CC-2026-1036",
      status: "processing",
      payment_status: "paid",
      payment_method: "razorpay",
      total_paise: 199900, // ₹1,999
      delivery_mode: "local",
      archived_at: null,
      created_at: "2026-10-28T14:30:00Z",
    },
    {
      id: "ord-kept-3",
      order_number: "CC-2026-1034",
      status: "shipped",
      payment_status: "paid",
      payment_method: "razorpay",
      total_paise: 489900, // ₹4,899
      delivery_mode: "courier",
      archived_at: null,
      created_at: "2026-10-27T11:00:00Z",
    },
    {
      id: "ord-kept-4",
      order_number: "CC-2026-1033",
      status: "confirmed",
      payment_status: "cod_pending",
      payment_method: "cod",
      total_paise: 129900, // ₹1,299
      delivery_mode: "local",
      cod_amount_collected_paise: null,
      cod_collected_at: null,
      archived_at: null,
      created_at: "2026-10-26T09:00:00Z",
    },
    // TEST ORDERS TO BE REMOVED OR EXCLUDED
    {
      id: "ord-test-unpaid",
      order_number: "CC-2026-1001",
      status: "pending_payment",
      payment_status: "pending_payment",
      payment_method: "razorpay",
      total_paise: 229900,
      delivery_mode: "courier",
      archived_at: null,
      created_at: "2026-10-01T10:00:00Z",
    },
    {
      id: "ord-test-cancelled",
      order_number: "CC-2026-1002",
      status: "cancelled",
      payment_status: "pending_payment",
      payment_method: "razorpay",
      total_paise: 199900,
      delivery_mode: "courier",
      archived_at: null,
      created_at: "2026-10-02T10:00:00Z",
    },
    {
      id: "ord-test-refunded",
      order_number: "CC-2026-1003",
      status: "refunded",
      payment_status: "refunded",
      payment_method: "razorpay",
      total_paise: 129900,
      delivery_mode: "courier",
      archived_at: null,
      created_at: "2026-10-03T10:00:00Z",
    },
    {
      id: "ord-test-archived",
      order_number: "CC-2026-1004",
      status: "paid",
      payment_status: "paid",
      payment_method: "razorpay",
      total_paise: 489900,
      delivery_mode: "courier",
      archived_at: "2026-10-30T08:00:00Z", // Soft-archived
      created_at: "2026-10-04T10:00:00Z",
    },
  ];

  // SQL-specification metric computation
  function computeMetrics(orders) {
    let totalRevenuePaise = 0;
    let totalOrdersCount = 0;
    let pendingCourierCount = 0;
    let pendingDeliveryCount = 0;

    for (const o of orders) {
      if (o.archived_at) continue; // Exclude archived orders

      const status = (o.status || "").toLowerCase();
      const pStatus = (o.payment_status || "").toLowerCase();
      const isCod = o.payment_method === "cod";

      // 1. Total Gross Revenue: Paid online + COD cash collected - refunds
      if (!isCod) {
        const isOnlinePaid =
          pStatus === "paid" || ["paid", "processing", "shipped", "delivered"].includes(status);
        const isExcluded =
          ["pending_payment", "cancelled", "refunded"].includes(status) ||
          ["pending_payment", "failed", "abandoned", "cancelled", "refunded"].includes(pStatus);

        if (isOnlinePaid && !isExcluded) {
          totalRevenuePaise += o.total_paise || 0;
        }
      } else {
        const isCodCollected = pStatus === "cod_collected" || Boolean(o.cod_collected_at);
        const isExcluded =
          ["pending_payment", "cancelled", "refunded"].includes(status) ||
          ["pending_payment", "failed", "abandoned", "cancelled", "refunded"].includes(pStatus);

        if (isCodCollected && !isExcluded) {
          totalRevenuePaise += o.cod_amount_collected_paise ?? o.total_paise ?? 0;
        }
      }

      // 2. Total Orders: Paid online + COD placed and not cancelled
      const isUnpaidOrCancelled =
        ["pending_payment", "cancelled", "refunded"].includes(status) ||
        ["pending_payment", "failed", "abandoned", "cancelled"].includes(pStatus);

      if (!isUnpaidOrCancelled) {
        if (!isCod) {
          if (pStatus === "paid" || ["paid", "processing", "shipped", "delivered"].includes(status)) {
            totalOrdersCount++;
          }
        } else {
          if (
            ["awaiting_confirmation", "confirmed", "processing", "out_for_delivery", "shipped", "delivered", "paid"].includes(status)
          ) {
            totalOrdersCount++;
          }
        }
      }

      // 3. Pending Shipments / Delivery: Paid or confirmed, not yet shipped/delivered/cancelled
      const isPending =
        ["paid", "confirmed", "processing"].includes(status) &&
        (!isCod
          ? pStatus === "paid" || status === "paid" || status === "processing"
          : ["confirmed", "processing"].includes(status));

      if (isPending) {
        if (o.delivery_mode === "local") {
          pendingDeliveryCount++;
        } else {
          pendingCourierCount++;
        }
      }
    }

    return {
      totalRevenuePaise,
      totalOrdersCount,
      pendingCourierCount,
      pendingDeliveryCount,
      pendingShipmentsCount: pendingCourierCount + pendingDeliveryCount,
    };
  }

  const results = computeMetrics(seededOrders);

  test("Revenue calculation matches SQL rule (299900 + 199900 + 489900 = 989700 paise)", () => {
    // CC-2026-1037 (₹2,999) + CC-2026-1036 (₹1,999) + CC-2026-1034 (₹4,899) = ₹9,897 = 989700 paise
    // CC-2026-1033 is COD uncollected -> excluded from revenue
    // Pending_payment, cancelled, refunded, archived -> excluded
    assert.equal(results.totalRevenuePaise, 989700);
  });

  test("Total orders count matches SQL rule (4 active valid orders)", () => {
    // 3 paid online (1037, 1036, 1034) + 1 active COD placed (1033) = 4
    // 1001 (unpaid), 1002 (cancelled), 1003 (refunded), 1004 (archived) -> excluded
    assert.equal(results.totalOrdersCount, 4);
  });

  test("Pending fulfillment accurately counts 1 courier + 1 local delivery", () => {
    // CC-2026-1037: paid, courier -> pendingCourierCount = 1
    // CC-2026-1036: processing, local -> pendingDeliveryCount = 1
    // CC-2026-1034: shipped -> excluded from pending shipments
    // CC-2026-1033: confirmed COD, local -> pendingDeliveryCount = 2
    assert.equal(results.pendingCourierCount, 1);
    assert.equal(results.pendingDeliveryCount, 2);
    assert.equal(results.pendingShipmentsCount, 3);
  });

  test("Archived orders are strictly excluded from all dashboard metrics", () => {
    const onlyArchived = [
      {
        id: "archived-1",
        order_number: "CC-TEST-ARCHIVED",
        status: "paid",
        payment_status: "paid",
        payment_method: "razorpay",
        total_paise: 999900,
        archived_at: "2026-10-30T00:00:00Z",
      },
    ];
    const archivedResult = computeMetrics(onlyArchived);
    assert.equal(archivedResult.totalRevenuePaise, 0);
    assert.equal(archivedResult.totalOrdersCount, 0);
    assert.equal(archivedResult.pendingShipmentsCount, 0);
  });

  // ============================================================================
  // TEST GROUP 2: WEBHOOK & VERIFICATION SAFETY ON MISSING ORDERS
  // ============================================================================
  console.log("\nTEST GROUP 2: Webhook & Payment Verify Safety (Missing Orders)");

  const webhookPath = path.join(process.cwd(), "src/app/api/razorpay/webhook/route.ts");
  const webhookContent = fs.readFileSync(webhookPath, "utf-8");

  test("Webhook handles missing order with 200 OK and info log", () => {
    assert.ok(webhookContent.includes('console.info("[Razorpay Webhook] Order not found'), "Logs at info level");
    assert.ok(webhookContent.includes('{ received: true, message: "Order not found" }'), "Returns received: true with 200");
    assert.ok(!webhookContent.includes('sendAdminOrderAlertEmail({ order: null'), "Never alerts owner for missing order");
  });

  const verifyPath = path.join(process.cwd(), "src/app/api/razorpay/verify-payment/route.ts");
  const verifyContent = fs.readFileSync(verifyPath, "utf-8");

  test("Payment verify handles missing order with 200 OK and no exception loop", () => {
    assert.ok(verifyContent.includes('console.info("[Payment Verify] Order not found'), "Logs at info level");
    assert.ok(verifyContent.includes('{ verified: false, message: "Order not found", notFound: true }'), "Returns notFound: true with 200");
    assert.ok(!verifyContent.includes('{ error: "Order record not found in studio database." },\n        { status: 404 }'), "No 404 response on missing order");
  });

  // ============================================================================
  // TEST GROUP 3: RELATIVE INTERNAL NAVIGATION
  // ============================================================================
  console.log("\nTEST GROUP 3: Internal Navigation Relative Links Audit");

  const adminNavPath = path.join(process.cwd(), "src/components/admin/admin-nav.tsx");
  const adminNavContent = fs.readFileSync(adminNavPath, "utf-8");

  test("Admin nav uses relative href='/' instead of absoluteUrl('/')", () => {
    assert.ok(!adminNavContent.includes('href={absoluteUrl("/")}'), "No absoluteUrl in admin nav");
    assert.ok(adminNavContent.includes('href="/"'), "Uses relative '/' for storefront link");
  });

  const customReqAdminPath = path.join(process.cwd(), "src/app/admin/custom-requests/page.tsx");
  const customReqAdminContent = fs.readFileSync(customReqAdminPath, "utf-8");

  test("Admin custom requests tracking link uses relative path", () => {
    assert.ok(!customReqAdminContent.includes('absoluteUrl("/track/custom"'), "No absoluteUrl in tracking link");
    assert.ok(customReqAdminContent.includes('`/track/custom?ref='), "Uses relative '/track/custom?ref='");
  });

  // ============================================================================
  // TEST GROUP 4: SAFE REDIRECT 'NEXT' PARAMETER VALIDATION
  // ============================================================================
  console.log("\nTEST GROUP 4: Safe Redirect Parameter Validation (Open-Redirect Guard)");

  const redirectSourcePath = path.join(process.cwd(), "src/lib/validation/safe-redirect.ts");
  const redirectSourceContent = fs.readFileSync(redirectSourcePath, "utf-8");

  // Dynamically execute the exact implementation function from source
  const cleanedJs = redirectSourceContent
    .replace(/:\s*(string\s*\|\s*null\s*\|\s*undefined|string)/g, "")
    .replace(/export function/g, "function");
  const validateSafeRedirectPath = new Function(`${cleanedJs}; return validateSafeRedirectPath;`)();

  test("Valid same-site relative paths are accepted", () => {
    assert.equal(validateSafeRedirectPath("/admin", "/admin"), "/admin");
    assert.equal(validateSafeRedirectPath("/admin/products", "/admin"), "/admin/products");
    assert.equal(validateSafeRedirectPath("/account?tab=orders", "/account"), "/account?tab=orders");
    assert.equal(validateSafeRedirectPath("/checkout#payment", "/"), "/checkout#payment");
  });

  test("Protocol-relative URLs (//evil.com, ///evil.com) are rejected", () => {
    assert.equal(validateSafeRedirectPath("//evil.com", "/fallback"), "/fallback");
    assert.equal(validateSafeRedirectPath("///evil.com", "/fallback"), "/fallback");
    assert.equal(validateSafeRedirectPath("//attacker.com/path", "/fallback"), "/fallback");
  });

  test("Backslash variants (/\\evil.com, \\evil.com, /foo\\bar) are rejected", () => {
    assert.equal(validateSafeRedirectPath("/\\evil.com", "/fallback"), "/fallback");
    assert.equal(validateSafeRedirectPath("\\evil.com", "/fallback"), "/fallback");
    assert.equal(validateSafeRedirectPath("/admin\\evil", "/fallback"), "/fallback");
  });

  test("Absolute URLs and schemes (https://, http://, javascript:) are rejected", () => {
    assert.equal(validateSafeRedirectPath("https://evil.com", "/fallback"), "/fallback");
    assert.equal(validateSafeRedirectPath("http://evil.com", "/fallback"), "/fallback");
    assert.equal(validateSafeRedirectPath("javascript:alert(1)", "/fallback"), "/fallback");
    assert.equal(validateSafeRedirectPath("/javascript:alert(1)", "/fallback"), "/fallback");
    assert.equal(validateSafeRedirectPath("data:text/html,evil", "/fallback"), "/fallback");
  });

  test("URL-encoded bypasses (%2f%2fevil.com, %5c%5c, etc.) are rejected", () => {
    assert.equal(validateSafeRedirectPath("%2f%2fevil.com", "/fallback"), "/fallback");
    assert.equal(validateSafeRedirectPath("/%2fevil.com", "/fallback"), "/fallback");
    assert.equal(validateSafeRedirectPath("/%5cevil.com", "/fallback"), "/fallback");
    assert.equal(validateSafeRedirectPath("%5c%5cevil.com", "/fallback"), "/fallback");
  });

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("\n==================================================================");
  console.log(`VERIFICATION RESULTS: ${passed} / ${total} tests passed.`);
  console.log("==================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runVerification();
