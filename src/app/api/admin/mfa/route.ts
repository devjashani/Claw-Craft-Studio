import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  createSignedAdminToken,
  ADMIN_COOKIE_NAME,
  logAdminAudit,
} from "@/lib/auth/admin-auth";
import { createClient } from "@/lib/supabase/server";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

/**
 * GET: Retrieve current MFA enrollment status and factors.
 */
export async function GET() {
  try {
    const admin = await requireAdmin({ isApi: true });
    const supabase = createClient();

    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) {
      return NextResponse.json({ error: factorsError.message }, { status: 500 });
    }

    const totpFactors = factors?.totp || [];
    const verifiedFactor = totpFactors.find((f: any) => f.status === "verified");
    const isEnforced = process.env.ADMIN_REQUIRE_MFA === "true";

    return NextResponse.json({
      success: true,
      email: admin.email,
      isEnrolled: Boolean(verifiedFactor),
      isEnforced,
      aal: admin.aal,
      verifiedFactorId: verifiedFactor?.id || null,
      factorsCount: totpFactors.length,
    });
  } catch (error: any) {
    const status = error.message === "UNAUTHORIZED_ADMIN" ? 401 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch MFA status" },
      { status }
    );
  }
}

/**
 * POST: Enrol, Verify, or Unenroll TOTP Authenticator.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "Unknown Client";

  try {
    const admin = await requireAdmin({ isApi: true });
    const body = await req.json();
    const { action, factorId, code } = body;
    const supabase = createClient();

    // 1. ENROL: Generate new TOTP secret & QR code
    if (action === "enroll") {
      const { data: enrollData, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `CLAWCRAFT Studio (${admin.email})`,
      });

      if (enrollErr || !enrollData) {
        return NextResponse.json(
          { error: enrollErr?.message || "Failed to start authenticator enrollment." },
          { status: 500 }
        );
      }

      const totpUri = enrollData.totp.uri;
      const secret = enrollData.totp.secret;
      const qrCodeDataUrl = await QRCode.toDataURL(totpUri, {
        margin: 2,
        width: 256,
        color: {
          dark: "#050505",
          light: "#FFFFFF",
        },
      });

      return NextResponse.json({
        success: true,
        factorId: enrollData.id,
        secret,
        qrCodeUrl: qrCodeDataUrl,
        uri: totpUri,
      });
    }

    // 2. VERIFY: Confirm 6-digit code and activate factor
    if (action === "verify") {
      if (!factorId || !code) {
        return NextResponse.json(
          { error: "Factor ID and 6-digit authenticator code are required." },
          { status: 400 }
        );
      }

      const { data: challengeData, error: challengeErr } =
        await supabase.auth.mfa.challengeAndVerify({
          factorId,
          code: String(code).trim(),
        });

      if (challengeErr || !challengeData) {
        return NextResponse.json(
          { error: challengeErr?.message || "Invalid authenticator code. Please try again." },
          { status: 400 }
        );
      }

      // Upgrade admin session token to aal2
      const updatedToken = createSignedAdminToken({
        sub: admin.id || "admin",
        email: admin.email,
        aal: "aal2",
        factorId,
        iat: Date.now(),
        act: Date.now(),
      });

      const response = NextResponse.json({
        success: true,
        message: "Authenticator app successfully verified and activated.",
        aal: "aal2",
      });

      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: updatedToken,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 12,
      });

      await logAdminAudit({
        adminEmail: admin.email,
        action: "mfa_enrolled",
        target: `factor_${factorId}`,
        ip,
        userAgent,
        success: true,
      });

      return response;
    }

    // 3. UNENROLL: Remove authenticator (requires entering valid 6-digit code)
    if (action === "unenroll") {
      if (!factorId || !code) {
        return NextResponse.json(
          { error: "Factor ID and confirmation 6-digit code are required to unenroll." },
          { status: 400 }
        );
      }

      // Block un-enrollment if ADMIN_REQUIRE_MFA is enforced on the server
      if (process.env.ADMIN_REQUIRE_MFA === "true") {
        return NextResponse.json(
          {
            error:
              "Cannot remove authenticator: Two-factor authentication is strictly enforced by server policy (ADMIN_REQUIRE_MFA=true).",
          },
          { status: 403 }
        );
      }

      // Verify code before allowing deletion
      const { data: verifyData, error: verifyErr } =
        await supabase.auth.mfa.challengeAndVerify({
          factorId,
          code: String(code).trim(),
        });

      if (verifyErr || !verifyData) {
        return NextResponse.json(
          { error: "Invalid authenticator code. You must enter a valid code to remove 2FA." },
          { status: 400 }
        );
      }

      const { error: unenrollErr } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (unenrollErr) {
        return NextResponse.json(
          { error: unenrollErr.message || "Failed to remove authenticator factor." },
          { status: 500 }
        );
      }

      // Downgrade session token to aal1
      const updatedToken = createSignedAdminToken({
        sub: admin.id || "admin",
        email: admin.email,
        aal: "aal1",
        iat: Date.now(),
        act: Date.now(),
      });

      const response = NextResponse.json({
        success: true,
        message: "Authenticator factor removed.",
        aal: "aal1",
      });

      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: updatedToken,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 12,
      });

      await logAdminAudit({
        adminEmail: admin.email,
        action: "mfa_unenrolled",
        target: `factor_${factorId}`,
        ip,
        userAgent,
        success: true,
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (error: any) {
    console.error("[MFA API Error]", error);
    const status = error.message === "UNAUTHORIZED_ADMIN" ? 401 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to process MFA request" },
      { status }
    );
  }
}
