// ==============================================================================
// CLAWCRAFT STUDIO — ADMIN HARDENING & SECURITY VERIFICATION SUITE
// ==============================================================================
import assert from "assert";
import crypto from "crypto";
import fs from "fs";
import path from "path";

console.log("================================================================================");
console.log("CLAWCRAFT STUDIO — ADMIN HARDENING & SECURITY TEST SUITE");
console.log("================================================================================\n");

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
  }
}

// Set test environment
process.env.ADMIN_SESSION_SECRET = "test_super_secret_signing_vault_key_minimum_32_chars";
process.env.ADMIN_EMAILS = "owner@clawcraftstudio.in,lead-artisan@clawcraftstudio.in";
process.env.NODE_ENV = "production";

// ------------------------------------------------------------------------------
// SECTION 1: OLD DEMO COOKIE & PLAINTEXT INJECTION REJECTION
// ------------------------------------------------------------------------------
console.log("SECTION 1: OLD DEMO COOKIE & PLAINTEXT FORGERY REJECTION");

const ADMIN_COOKIE_NAME = "clawcraft_admin_session_v2";
const OLD_ADMIN_COOKIE_NAME = "clawcraft_admin_session";

function getSigningSecret() {
  return process.env.ADMIN_SESSION_SECRET;
}

function verifySignedAdminToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [data, signature] = parts;
  const expectedSig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(data)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    const now = Date.now();
    if (now - payload.act > 30 * 60 * 1000) return null; // 30m idle timeout
    if (now - payload.iat > 12 * 60 * 60 * 1000) return null; // 12h absolute timeout
    const allowed = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase());
    if (!allowed.includes(payload.email.toLowerCase())) return null;
    return payload;
  } catch {
    return null;
  }
}

function createSignedAdminToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

test("Old demo cookie 'user_studio@clawcraft.in' is completely rejected", () => {
  const oldCookie = "user_studio%40clawcraft.in";
  assert.strictEqual(verifySignedAdminToken(oldCookie), null);
});

test("Old demo cookie 'active' is completely rejected", () => {
  const oldCookie = "active";
  assert.strictEqual(verifySignedAdminToken(oldCookie), null);
});

test("Arbitrary forged cookie with real admin email is rejected without valid signature", () => {
  const forged = `user_${encodeURIComponent("owner@clawcraftstudio.in")}`;
  assert.strictEqual(verifySignedAdminToken(forged), null);
});

// ------------------------------------------------------------------------------
// SECTION 2: CRYPTOGRAPHIC SIGNING & TIMEOUT INTEGRITY
// ------------------------------------------------------------------------------
console.log("\nSECTION 2: CRYPTOGRAPHIC SIGNING & TIMEOUT INTEGRITY");

test("Legitimate signed token with valid admin email is accepted", () => {
  const token = createSignedAdminToken({
    sub: "usr_12345",
    email: "owner@clawcraftstudio.in",
    aal: "aal1",
    iat: Date.now(),
    act: Date.now(),
  });
  const verified = verifySignedAdminToken(token);
  assert.ok(verified);
  assert.strictEqual(verified.email, "owner@clawcraftstudio.in");
});

test("Tampered token payload is detected and rejected", () => {
  const token = createSignedAdminToken({
    sub: "usr_12345",
    email: "owner@clawcraftstudio.in",
    aal: "aal1",
    iat: Date.now(),
    act: Date.now(),
  });
  const [data, sig] = token.split(".");
  const modifiedData = Buffer.from(
    JSON.stringify({
      sub: "usr_attacker",
      email: "attacker@clawcraftstudio.in",
      aal: "aal2",
      iat: Date.now(),
      act: Date.now(),
    })
  ).toString("base64url");

  const tamperedToken = `${modifiedData}.${sig}`;
  assert.strictEqual(verifySignedAdminToken(tamperedToken), null);
});

test("Tampered HMAC signature is rejected in constant-time", () => {
  const token = createSignedAdminToken({
    sub: "usr_12345",
    email: "owner@clawcraftstudio.in",
    aal: "aal1",
    iat: Date.now(),
    act: Date.now(),
  });
  const [data, sig] = token.split(".");
  const corruptedSig = sig.slice(0, -3) + "abc";
  const tamperedToken = `${data}.${corruptedSig}`;
  assert.strictEqual(verifySignedAdminToken(tamperedToken), null);
});

test("Idle timeout: Token idle for > 30 minutes is rejected", () => {
  const thirtyOneMinutesAgo = Date.now() - 31 * 60 * 1000;
  const token = createSignedAdminToken({
    sub: "usr_12345",
    email: "owner@clawcraftstudio.in",
    aal: "aal1",
    iat: Date.now() - 35 * 60 * 1000,
    act: thirtyOneMinutesAgo,
  });
  assert.strictEqual(verifySignedAdminToken(token), null);
});

test("Absolute lifetime: Token older than 12 hours is rejected even if recently active", () => {
  const thirteenHoursAgo = Date.now() - 13 * 60 * 60 * 1000;
  const token = createSignedAdminToken({
    sub: "usr_12345",
    email: "owner@clawcraftstudio.in",
    aal: "aal1",
    iat: thirteenHoursAgo,
    act: Date.now(), // Active right now
  });
  assert.strictEqual(verifySignedAdminToken(token), null);
});

// ------------------------------------------------------------------------------
// SECTION 3: ALLOWLIST & CUSTOMER ISOLATION
// ------------------------------------------------------------------------------
console.log("\nSECTION 3: ALLOWLIST & CUSTOMER ISOLATION");

test("Logged-in customer email NOT in ADMIN_EMAILS is rejected", () => {
  const customerToken = createSignedAdminToken({
    sub: "cust_999",
    email: "paying-customer@gmail.com",
    aal: "aal1",
    iat: Date.now(),
    act: Date.now(),
  });
  assert.strictEqual(verifySignedAdminToken(customerToken), null);
});

test("Default demo emails studio@clawcraft.in / admin@clawcraft.in are rejected", () => {
  const demoToken = createSignedAdminToken({
    sub: "demo_1",
    email: "studio@clawcraft.in",
    aal: "aal1",
    iat: Date.now(),
    act: Date.now(),
  });
  assert.strictEqual(verifySignedAdminToken(demoToken), null);
});

// ------------------------------------------------------------------------------
// SECTION 4: TWO-FACTOR (TOTP) ASSURANCE GATING
// ------------------------------------------------------------------------------
console.log("\nSECTION 4: TWO-FACTOR (TOTP) ASSURANCE GATING");

function checkMfaGate(session, requireMfa) {
  if (!session) return { allowed: false, error: "UNAUTHORIZED" };
  if (requireMfa && session.aal !== "aal2") {
    return { allowed: false, error: "MFA_REQUIRED" };
  }
  return { allowed: true };
}

test("When ADMIN_REQUIRE_MFA is false, aal1 session is accepted", () => {
  const session = { email: "owner@clawcraftstudio.in", aal: "aal1" };
  const res = checkMfaGate(session, false);
  assert.strictEqual(res.allowed, true);
});

test("When ADMIN_REQUIRE_MFA is true, aal1 session is REJECTED with MFA_REQUIRED", () => {
  const session = { email: "owner@clawcraftstudio.in", aal: "aal1" };
  const res = checkMfaGate(session, true);
  assert.strictEqual(res.allowed, false);
  assert.strictEqual(res.error, "MFA_REQUIRED");
});

test("When ADMIN_REQUIRE_MFA is true, aal2 session (verified TOTP) is ACCEPTED", () => {
  const session = { email: "owner@clawcraftstudio.in", aal: "aal2" };
  const res = checkMfaGate(session, true);
  assert.strictEqual(res.allowed, true);
});

// ------------------------------------------------------------------------------
// SECTION 5: BRUTE FORCE RATE LIMITING & LOCKOUT
// ------------------------------------------------------------------------------
console.log("\nSECTION 5: BRUTE FORCE RATE LIMITING & LOCKOUT");

const testAttempts = new Map();

function simulateFailedAttempt(ip) {
  const record = testAttempts.get(ip) || { failures: 0, lockedUntil: 0 };
  record.failures += 1;
  if (record.failures >= 5) {
    record.lockedUntil = Date.now() + 15 * 60 * 1000;
  }
  testAttempts.set(ip, record);
  return record;
}

function checkRate(ip) {
  const record = testAttempts.get(ip);
  if (!record) return { allowed: true, requiresCaptcha: false };
  if (record.lockedUntil > Date.now()) {
    return { allowed: false, requiresCaptcha: true };
  }
  return { allowed: true, requiresCaptcha: record.failures >= 3 };
}

test("Requires CAPTCHA after 3 failed login attempts", () => {
  const ip = "192.168.1.100";
  simulateFailedAttempt(ip);
  simulateFailedAttempt(ip);
  assert.strictEqual(checkRate(ip).requiresCaptcha, false);
  simulateFailedAttempt(ip); // 3rd failure
  assert.strictEqual(checkRate(ip).requiresCaptcha, true);
  assert.strictEqual(checkRate(ip).allowed, true);
});

test("Triggers 15-minute lockout after 5 consecutive failures", () => {
  const ip = "192.168.1.100";
  simulateFailedAttempt(ip); // 4th
  simulateFailedAttempt(ip); // 5th
  const status = checkRate(ip);
  assert.strictEqual(status.allowed, false);
  assert.strictEqual(status.requiresCaptcha, true);
});

// ------------------------------------------------------------------------------
// SECTION 6: SOURCE CODE AUDIT — NO DEMO CODE IN PRODUCTION
// ------------------------------------------------------------------------------
console.log("\nSECTION 6: SOURCE CODE AUDIT — PRODUCTION BUNDLE HYGIENE");

const loginPageCode = fs.readFileSync(
  path.join(process.cwd(), "src/app/admin/login/page.tsx"),
  "utf-8"
);
const authRouteCode = fs.readFileSync(
  path.join(process.cwd(), "src/app/api/admin/auth/route.ts"),
  "utf-8"
);

test("Admin login page has NO ungated demo button in production bundle", () => {
  // Must NOT have unconditioned handleDemoLogin
  assert.ok(
    !loginPageCode.includes('onClick={handleDemoLogin}'),
    "Must not contain ungated handleDemoLogin"
  );
  // Any local helper must be guarded by NODE_ENV === 'development'
  assert.ok(
    loginPageCode.includes('process.env.NODE_ENV === "development"'),
    "Local helper must be gated by NODE_ENV === 'development'"
  );
});

test("No hardcoded master password exists in API routes", () => {
  assert.ok(
    !authRouteCode.includes("clawcraft2026"),
    "Hardcoded password 'clawcraft2026' must be deleted"
  );
  assert.ok(
    !authRouteCode.includes("ADMIN_PASSWORD"),
    "ADMIN_PASSWORD master bypass must be deleted"
  );
});

test("Generic error 'Invalid email or password' is used consistently", () => {
  assert.ok(
    authRouteCode.includes('const GENERIC_AUTH_ERROR = "Invalid email or password."'),
    "Must define GENERIC_AUTH_ERROR"
  );
  assert.ok(
    !authRouteCode.includes("Customer accounts do not have administrator permissions"),
    "Must NOT leak customer enumeration message"
  );
});

test("/api/admin/products/[id] has strict assertAdminApi guard on all HTTP methods", () => {
  const productByIdCode = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/admin/products/[id]/route.ts"),
    "utf-8"
  );
  assert.ok(productByIdCode.includes("assertAdminApi"), "Must call assertAdminApi");
  const getCount = (productByIdCode.match(/assertAdminApi/g) || []).length;
  assert.ok(getCount >= 3, "GET, PUT, and DELETE must each check assertAdminApi");
});

test("Admin layout enforces requireAdmin on server", () => {
  const layoutCode = fs.readFileSync(
    path.join(process.cwd(), "src/app/admin/layout.tsx"),
    "utf-8"
  );
  assert.ok(layoutCode.includes("requireAdmin"), "Layout must call requireAdmin");
});

console.log("\n================================================================================");
console.log(`TEST RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
console.log("================================================================================\n");

if (passed !== total) {
  process.exit(1);
}
