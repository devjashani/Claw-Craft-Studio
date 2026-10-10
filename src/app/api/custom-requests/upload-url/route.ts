import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif"]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filename, fileType, fileSize } = body;

    if (!filename || typeof filename !== "string") {
      return NextResponse.json(
        { error: "Invalid filename provided", code: "INVALID_FILENAME" },
        { status: 400 }
      );
    }

    if (fileSize && typeof fileSize === "number" && fileSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: "Original image exceeds the 10 MB size limit. Please select a smaller photo.",
          code: "FILE_TOO_LARGE",
        },
        { status: 400 }
      );
    }

    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const isAllowedExt = ALLOWED_EXTENSIONS.has(ext);
    const isAllowedMime = fileType && ALLOWED_MIME_TYPES.has(fileType.toLowerCase());

    if (!isAllowedExt && !isAllowedMime) {
      return NextResponse.json(
        {
          error: "Unsupported file type. Please upload a JPG, PNG, WebP, or HEIC image.",
          code: "UNSUPPORTED_FILE_TYPE",
        },
        { status: 400 }
      );
    }

    // Target storage extension (JPEG after client compression)
    const targetExt = fileType === "image/png" ? "png" : "jpg";
    const sanitizedBase = filename
      .toLowerCase()
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 30);

    const safeFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizedBase || "visual"}.${targetExt}`;
    const filePath = `refs/${safeFileName}`;

    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from("custom-references")
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      console.error("[Storage Signed URL Error]", {
        error,
        filePath,
      });
      return NextResponse.json(
        {
          error: error?.message || "Failed to generate storage upload URL.",
          code: "STORAGE_SIGN_FAILED",
        },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("custom-references").getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      publicUrl,
    });
  } catch (error) {
    console.error("[Upload URL Route Exception]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error.",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
