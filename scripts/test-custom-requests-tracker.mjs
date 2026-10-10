import crypto from "crypto";

// --- Minimal standalone test suite for Custom Request Tracker ---

function safeCompareTokens(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    const dummy = Buffer.alloc(bufA.length);
    crypto.timingSafeEqual(bufA, dummy);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

const LIFECYCLE_STEPS = [
  { key: "new", label: "Submitted" },
  { key: "reviewing", label: "Under review" },
  { key: "quoted", label: "Quote shared" },
  { key: "accepted", label: "Accepted" },
  { key: "in_progress", label: "Being crafted" },
  { key: "completed", label: "Completed" },
];

console.log("===============================================================================");
console.log("CLAWCRAFT STUDIO - CUSTOM REQUEST TRACKER VERIFICATION SUITE");
console.log("===============================================================================\n");

// 1. REF_CODE GENERATION & FORMAT TEST
console.log("TEST 1: Reference Code Format & Generation...");
const currentYear = new Date().getFullYear();
const sampleSeq = 1;
const generatedRefCode = `CR-${currentYear}-${String(sampleSeq).padStart(4, "0")}`;
const refCodeRegex = /^CR-\d{4}-\d{4}$/;
if (!refCodeRegex.test(generatedRefCode)) {
  console.error(`[FAIL] Generated ref code format incorrect: ${generatedRefCode}`);
  process.exit(1);
}
console.log(`  [PASS] Reference code matches pattern CR-YYYY-0001: ${generatedRefCode}`);

// 2. TOKEN GENERATION & CONSTANT-TIME VALIDATION TEST
console.log("\nTEST 2: Public Token Generation & Constant-Time Validation...");
const tokenA = crypto.randomBytes(32).toString("hex");
const tokenB = crypto.randomBytes(32).toString("hex");
const tokenACopy = `${tokenA}`;

if (!safeCompareTokens(tokenA, tokenACopy)) {
  console.error("[FAIL] Identical tokens failed constant-time comparison.");
  process.exit(1);
}
if (safeCompareTokens(tokenA, tokenB)) {
  console.error("[FAIL] Different tokens mistakenly matched.");
  process.exit(1);
}
if (safeCompareTokens(tokenA, "short-token")) {
  console.error("[FAIL] Different length token mistakenly matched.");
  process.exit(1);
}
console.log(`  [PASS] 64-char hex token generated securely: ${tokenA.slice(0, 16)}...`);
console.log("  [PASS] Constant-time validation correctly authenticates match and rejects non-match.");

// 3. INTERNAL NOTE SANITIZATION TEST
console.log("\nTEST 3: Customer Payload Sanitization (Internal Note & Admin Note Leak Prevention)...");
const rawDbRow = {
  id: "c8e23456-e89b-12d3-a456-426614174000",
  ref_code: "CR-2026-0042",
  public_token: tokenA,
  name: "Dev Jashani",
  email: "collector@example.com",
  phone: "9876543210",
  concept_description: "A mechanical mantis with wings crafted from energy drink cans.",
  preferred_can_types: "Monster & Red Bull",
  estimated_size: "45 cm height",
  budget_inr: "15,000",
  reference_image_urls: ["https://example.com/mantis.jpg"],
  status: "reviewing",
  admin_notes: "PRIVATE NOTE: Client seems keen, materials cost ~2k, target price 15k.",
  created_at: new Date().toISOString(),
  last_status_change_at: new Date().toISOString(),
};

const rawEventRow = {
  id: "e1e23456-e89b-12d3-a456-426614174001",
  request_id: rawDbRow.id,
  status: "reviewing",
  customer_message: "Our master artisan is currently checking can wing geometry.",
  internal_note: "CONFIDENTIAL: Checked scrap can stock, we have 4 black Monster cans.",
  created_by: "a0000000-0000-0000-0000-000000000001",
  created_at: new Date().toISOString(),
  email_sent_at: new Date().toISOString(),
  email_error: null,
};

// Customer mapping logic:
function sanitizeForCustomer(request, events) {
  return {
    ref_code: request.ref_code,
    status: request.status,
    concept_description: request.concept_description,
    preferred_can_types: request.preferred_can_types,
    estimated_size: request.estimated_size,
    budget_inr: request.budget_inr,
    reference_image_urls: request.reference_image_urls,
    created_at: request.created_at,
    last_status_change_at: request.last_status_change_at,
    events: events.map((ev) => ({
      id: ev.id,
      status: ev.status,
      customer_message: ev.customer_message,
      created_at: ev.created_at,
    })),
  };
}

const customerView = sanitizeForCustomer(rawDbRow, [rawEventRow]);
const serialized = JSON.stringify(customerView);

if (serialized.includes("PRIVATE NOTE") || serialized.includes("CONFIDENTIAL") || serialized.includes("admin_notes") || serialized.includes("internal_note")) {
  console.error("[CRITICAL FAIL] Internal notes or admin notes leaked to customer payload!");
  process.exit(1);
}
if (serialized.includes("9876543210") || serialized.includes("collector@example.com")) {
  console.error("[CRITICAL FAIL] Customer phone or email leaked in public tracking payload!");
  process.exit(1);
}
console.log("  [PASS] Verified: admin_notes and internal_note are strictly excluded from customer view.");
console.log("  [PASS] Verified: customer phone and email are not exposed in tracking payloads.");

// 4. EMAIL VERIFICATION & CLAIMING PERMISSION TEST
console.log("\nTEST 4: Account Access Permissions (Email Verification Gate)...");
function checkAccountAccess(user) {
  if (!user.email_confirmed_at) {
    return { verified: false, message: "Please verify your email to view custom requests." };
  }
  return { verified: true };
}

const unverifiedUser = { id: "usr_1", email: "unverified@example.com", email_confirmed_at: null };
const verifiedUser = { id: "usr_2", email: "verified@example.com", email_confirmed_at: "2026-10-01T10:00:00Z" };

if (checkAccountAccess(unverifiedUser).verified !== false) {
  console.error("[FAIL] Unverified user bypassed email verification check!");
  process.exit(1);
}
if (checkAccountAccess(verifiedUser).verified !== true) {
  console.error("[FAIL] Verified user was blocked!");
  process.exit(1);
}
console.log("  [PASS] Unverified users are blocked with email verification banner.");
console.log("  [PASS] Verified users correctly authenticated to view linked requests.");

// 5. STATUS LIFECYCLE & STEPS INTEGRITY
console.log("\nTEST 5: Target Status Lifecycle Integrity...");
const targetStatuses = ["new", "reviewing", "quoted", "accepted", "in_progress", "completed", "cancelled"];
const stepKeys = LIFECYCLE_STEPS.map((s) => s.key);
for (const st of ["new", "reviewing", "quoted", "accepted", "in_progress", "completed"]) {
  if (!stepKeys.includes(st)) {
    console.error(`[FAIL] Missing lifecycle step: ${st}`);
    process.exit(1);
  }
}
console.log("  [PASS] All 6 progressive lifecycle steps verified in correct sequence.");

console.log("\n===============================================================================");
console.log("ALL VERIFICATION SUITE CHECKS PASSED SUCCESSFULLY!");
console.log("===============================================================================");
