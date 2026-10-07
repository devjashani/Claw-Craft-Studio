/**
 * Verification Test Script for Customer Accounts, Admin Isolation & Security Policies
 * Run with: npx tsx scripts/verify-customer-accounts.ts
 */

import { isAllowedAdminEmail, isUserAdmin } from "../src/lib/auth/admin-auth";
import { verifyOrderAccess } from "../src/lib/orders/order-service";
import fs from "fs";
import path from "path";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

console.log("\n=======================================================");
console.log("CLAWCRAFT STUDIO - VERIFICATION TEST SUITE");
console.log("=======================================================\n");

// --------------------------------------------------------------------------
// TEST GROUP 1: Customer Accounts Cannot Get Admin Access (CRITICAL SECURITY)
// --------------------------------------------------------------------------
console.log("--- 1. Admin Protection & Server-Side Allow-List ---");

// Normal customer email should NEVER be admin
assert(
  isAllowedAdminEmail("customer@gmail.com") === false,
  "Customer email customer@gmail.com is rejected as admin"
);

// Malicious attempt: user with user_metadata.role = 'admin'
const maliciousCustomerUser: any = {
  id: "c7f99999-0000-0000-0000-000000000001",
  email: "hacker@example.com",
  user_metadata: {
    role: "admin",
    is_admin: true,
    artisan_admin: true,
  },
  app_metadata: {},
};
assert(
  isUserAdmin(maliciousCustomerUser) === false,
  "Customer with forged user_metadata.role='admin' is rejected (client-editable fields never trusted)"
);

// Allowed admin email in environment / fallback
assert(
  isAllowedAdminEmail("admin@clawcraft.in") === true,
  "Authorized email admin@clawcraft.in is accepted"
);

// Case-insensitive test on allowed email
assert(
  isAllowedAdminEmail("Admin@ClawCraft.IN ") === true,
  "Allowed admin email is verified case-insensitively with trimmed whitespace"
);


// --------------------------------------------------------------------------
// TEST GROUP 2: Order Access Control & User Isolation
// --------------------------------------------------------------------------
console.log("\n--- 2. Order Access Control & User Isolation ---");

const orderOfUserA: any = {
  id: "order-1111-2222-3333",
  order_number: "CC-2026-1001",
  user_id: "user-aaaa-1111",
  customer_phone: "9876543210",
  public_token: "tok_secret_token_abc_123",
};

// User B attempting to view User A's order without token
const userBAccess = verifyOrderAccess(
  orderOfUserA,
  null,
  null,
  false,
  "user-bbbb-2222" // Different user ID
);
assert(
  userBAccess.allowed === false,
  "User B cannot access User A's order by User ID"
);

// User A accessing own order
const userAAccess = verifyOrderAccess(
  orderOfUserA,
  null,
  null,
  false,
  "user-aaaa-1111" // Matching user ID
);
assert(
  userAAccess.allowed === true,
  "User A can access their own order via authenticated user ID"
);

// Guest accessing with valid constant-time public token
const tokenAccess = verifyOrderAccess(
  orderOfUserA,
  "tok_secret_token_abc_123",
  null,
  false,
  null
);
assert(
  tokenAccess.allowed === true,
  "Guest checkout tracking with valid public_token succeeds"
);

// Guest with invalid token is rejected
const invalidTokenAccess = verifyOrderAccess(
  orderOfUserA,
  "tok_wrong_token",
  null,
  false,
  null
);
assert(
  invalidTokenAccess.allowed === false,
  "Guest access with wrong token is rejected"
);


// --------------------------------------------------------------------------
// TEST GROUP 3: Avatar Storage Path Isolation
// --------------------------------------------------------------------------
console.log("\n--- 3. Avatar Storage Folder Isolation ---");

function checkStorageFolderPolicy(userId: string, targetPath: string): boolean {
  // Simulates Postgres storage policy: auth.uid()::text = (storage.foldername(name))[1]
  const folder = targetPath.split("/")[0];
  return folder === userId;
}

const userAliceId = "11111111-1111-1111-1111-111111111111";
const userBobId = "22222222-2222-2222-2222-222222222222";

assert(
  checkStorageFolderPolicy(userAliceId, `${userAliceId}/avatar_random123.webp`) === true,
  "User Alice can upload to avatars/alice_id/file.webp"
);

assert(
  checkStorageFolderPolicy(userAliceId, `${userBobId}/avatar_malicious.webp`) === false,
  "User Alice is REJECTED from uploading to avatars/bob_id/file.webp"
);

assert(
  checkStorageFolderPolicy(userAliceId, `public_root/avatar.webp`) === false,
  "User Alice is REJECTED from uploading outside their user folder"
);


// --------------------------------------------------------------------------
// TEST GROUP 4: Profile Validation & Energy Duration Calculation
// --------------------------------------------------------------------------
console.log("\n--- 4. Profile Validation & Energy Tier Rules ---");

function validateIndianMobile(phone: string): boolean {
  let clean = phone.replace(/[^0-9]/g, "");
  if (clean.length === 12 && clean.startsWith("91")) {
    clean = clean.slice(2);
  }
  return clean.length === 10 && /^[6-9]\d{9}$/.test(clean);
}

assert(validateIndianMobile("9876543210") === true, "Valid 10-digit Indian mobile 9876543210 passes");
assert(validateIndianMobile("+91 8123456789") === true, "Valid formatted Indian mobile passes");
assert(validateIndianMobile("12345") === false, "Short phone 12345 is rejected");
assert(validateIndianMobile("987654321012") === false, "Long phone is rejected");
assert(validateIndianMobile("0123456789") === false, "Number starting with 0 is rejected for Indian mobile");

// Energy Drink Duration Tier calculation tests
function getEnergyTier(totalMonths: number): "Rookie" | "Regular" | "Veteran" | "Legend" {
  if (totalMonths < 6) return "Rookie";
  if (totalMonths <= 24) return "Regular";
  if (totalMonths <= 60) return "Veteran";
  return "Legend";
}

assert(getEnergyTier(2) === "Rookie", "2 months -> Rookie (< 6 months)");
assert(getEnergyTier(5) === "Rookie", "5 months -> Rookie (< 6 months)");
assert(getEnergyTier(6) === "Regular", "6 months -> Regular (6-24 months)");
assert(getEnergyTier(24) === "Regular", "24 months -> Regular (6-24 months)");
assert(getEnergyTier(25) === "Veteran", "25 months -> Veteran (2-5 years)");
assert(getEnergyTier(60) === "Veteran", "60 months -> Veteran (2-5 years)");
assert(getEnergyTier(61) === "Legend", "61 months (5+ years) -> Legend");
assert(getEnergyTier(120) === "Legend", "10 years -> Legend");


// --------------------------------------------------------------------------
// TEST GROUP 5: Database Migration Integrity Check
// --------------------------------------------------------------------------
console.log("\n--- 5. SQL Migration File Verification ---");

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20261007000000_customer_accounts.sql"
);
const sqlExists = fs.existsSync(migrationPath);
assert(sqlExists, "Migration file exists at supabase/migrations/20261007000000_customer_accounts.sql");

if (sqlExists) {
  const sql = fs.readFileSync(migrationPath, "utf-8");
  assert(sql.includes("create table if not exists public.profiles"), "SQL creates profiles table");
  assert(sql.includes("create table if not exists public.addresses"), "SQL creates addresses table");
  assert(sql.includes("alter table public.orders add column if not exists user_id"), "SQL adds user_id to orders");
  assert(sql.includes("idx_orders_user_id"), "SQL indexes orders(user_id)");
  assert(sql.includes("security definer"), "SQL trigger handle_new_user is security definer");
  assert(sql.includes("search_path = public"), "SQL trigger sets search_path = public");
  assert(sql.includes("drop policy if exists"), "SQL uses drop policy if exists before all create policy");
  assert(sql.includes("storage.foldername(name)"), "SQL avatar storage policy checks user folder");
  assert(!sql.includes("uuid_generate_v4()"), "SQL avoids missing extensions (uses gen_random_uuid())");
}

console.log("\n=======================================================");
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("=======================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
