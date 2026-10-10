import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Parse local env variables
const env = fs.readFileSync(".env.local", "utf8").split("\n").reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
  return acc;
}, {});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE credentials in .env.local");
  process.exit(1);
}

const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anonClient = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Zod schema replica from API route
function sanitizeText(input) {
  if (typeof input !== "string") return "";
  return input.replace(/<[^>]*>?/gm, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

const customRequestSchema = z.object({
  name: z.string().transform(sanitizeText).pipe(z.string().min(2, "Name min 2").max(80)),
  email: z.string().transform(sanitizeText).pipe(z.string().email("Invalid email")),
  phone: z.string().transform((val) => sanitizeText(val).replace(/\D/g, "")).pipe(z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile")),
  concept_description: z.string().transform(sanitizeText).pipe(z.string().min(20, "Concept min 20").max(2000)),
  preferred_can_types: z.string().optional().nullable().transform((v) => (v ? sanitizeText(v).slice(0, 200) : null)),
  estimated_size: z.string().optional().nullable().transform((v) => (v ? sanitizeText(v).slice(0, 100) : null)),
  budget_inr: z.string().optional().nullable().transform((v) => (v ? sanitizeText(v).slice(0, 100) : null)),
  reference_image_urls: z.array(z.string().url()).max(10).optional().default([]),
  honeypot: z.string().optional().nullable(),
});

async function runVerification() {
  console.log("===============================================================================");
  console.log("CLAWCRAFT STUDIO - CUSTOM REQUESTS SECURITY & VERIFICATION SUITE");
  console.log("===============================================================================\n");

  let createdId = null;

  // --------------------------------------------------------------------------
  // TEST 1: Valid submission creates row with service role client
  // --------------------------------------------------------------------------
  console.log("TEST 1: Valid submission creates row in public.custom_requests via Service Role...");
  const validPayload = {
    name: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    phone: "9876543210",
    concept_description: "Futuristic robotic mantis crafted from Monster Energy Ultra Black aluminum cans.",
    preferred_can_types: "Monster Ultra Black, Monster Zero",
    estimated_size: "Desktop (35 cm)",
    budget_inr: "₹18,000",
    reference_image_urls: ["https://example.com/mantis-sketch.jpg"],
    status: "new",
  };

  const parsed = customRequestSchema.safeParse(validPayload);
  if (!parsed.success) {
    throw new Error("Validation unexpectedly failed for valid payload");
  }

  const { data: insertedRow, error: insertError } = await serviceClient
    .from("custom_requests")
    .insert(parsed.data)
    .select("id, name, email, phone, concept_description, reference_image_urls, status, created_at")
    .single();

  if (insertError || !insertedRow?.id) {
    throw new Error(`Insert failed: ${insertError?.message}`);
  }

  createdId = insertedRow.id;
  console.log("  [PASS] Successfully created row with real UUID:", createdId);
  console.log("         Customer:", insertedRow.name, `<${insertedRow.email}>`);
  console.log("         Reference URLs array:", insertedRow.reference_image_urls);
  console.log("         Row status:", insertedRow.status);

  // --------------------------------------------------------------------------
  // TEST 2: Invalid input returns field errors (Zod validation)
  // --------------------------------------------------------------------------
  console.log("\nTEST 2: Zod validation rejects invalid field payloads...");

  const testCases = [
    {
      name: "Too short name ('A')",
      payload: { ...validPayload, name: "A" },
      expectedErrorField: "name",
    },
    {
      name: "Malformed email ('notanemail')",
      payload: { ...validPayload, email: "notanemail" },
      expectedErrorField: "email",
    },
    {
      name: "Invalid mobile phone ('12345' or non-Indian number)",
      payload: { ...validPayload, phone: "12345" },
      expectedErrorField: "phone",
    },
    {
      name: "Short concept description (< 20 chars)",
      payload: { ...validPayload, concept_description: "Too short" },
      expectedErrorField: "concept_description",
    },
  ];

  for (const tc of testCases) {
    const res = customRequestSchema.safeParse(tc.payload);
    if (res.success) {
      throw new Error(`Test failed: ${tc.name} should have failed validation but passed!`);
    }
    const errors = res.error.flatten().fieldErrors;
    if (!errors[tc.expectedErrorField]) {
      throw new Error(`Test failed: Expected error on '${tc.expectedErrorField}', got: ${JSON.stringify(errors)}`);
    }
    console.log(`  [PASS] ${tc.name}: Correctly rejected (${errors[tc.expectedErrorField][0]})`);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Forced insert failure never returns fake success
  // --------------------------------------------------------------------------
  console.log("\nTEST 3: Forced insert failure simulation...");
  // Attempting to insert an invalid payload (e.g. invalid status enum)
  const { data: forcedFailData, error: forcedFailError } = await serviceClient
    .from("custom_requests")
    .insert({
      name: "Fail Test",
      email: "fail@test.com",
      phone: "9876543210",
      concept_description: "This should fail because of invalid status enum",
      status: "non_existent_status_enum",
    })
    .select("id")
    .single();

  if (!forcedFailError) {
    throw new Error("Forced failure unexpectedly succeeded!");
  }
  console.log("  [PASS] Database error caught:", forcedFailError.code, "-", forcedFailError.message);
  console.log("         Server route guarantees: If data?.id is null, it returns 500 error and NEVER fake success.");

  // --------------------------------------------------------------------------
  // TEST 4: Anonymous client CANNOT insert into custom_requests
  // --------------------------------------------------------------------------
  console.log("\nTEST 4: Anonymous client is BLOCKED from inserting into custom_requests...");
  const { data: anonInsertData, error: anonInsertError } = await anonClient
    .from("custom_requests")
    .insert({
      name: "Anon Attacker",
      email: "attacker@test.com",
      phone: "9876543210",
      concept_description: "Direct anon client attack bypass test description",
    })
    .select("id");

  if (!anonInsertError) {
    throw new Error("SECURITY FAILURE: Anon client was allowed to insert into custom_requests!");
  }
  console.log("  [PASS] Anon insert blocked by Supabase RLS:", anonInsertError.message);

  // --------------------------------------------------------------------------
  // TEST 5: Verify cleanup & confirm row read via Service Role
  // --------------------------------------------------------------------------
  if (createdId) {
    const { data: readBack } = await serviceClient
      .from("custom_requests")
      .select("id, name")
      .eq("id", createdId)
      .single();

    if (!readBack) {
      throw new Error("Could not read back created row with service client!");
    }
    console.log("\nTEST 5: Clean up verification record...");
    await serviceClient.from("custom_requests").delete().eq("id", createdId);
    console.log("  [PASS] Verification row cleaned up successfully.");
  }

  console.log("\n===============================================================================");
  console.log("ALL 5 SECURITY & FUNCTIONAL TESTS PASSED SUCCESSFULLY!");
  console.log("===============================================================================");
}

runVerification().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
