import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const fileName = `${Date.now()}-${safeName}`;

    // 1. Try Supabase Storage bucket 'product-media'
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase.storage
        .from("product-media")
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (!error && data) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("product-media").getPublicUrl(fileName);

        return NextResponse.json({ success: true, url: publicUrl });
      }
    } catch {
      // Supabase storage bucket unavailable or mock
    }

    // 2. Local Fallback: save to public/assets/products/
    try {
      const publicUploadPath = path.join(
        process.cwd(),
        "public",
        "assets",
        "products",
        fileName
      );
      await writeFile(publicUploadPath, buffer);
      return NextResponse.json({
        success: true,
        url: `/assets/products/${fileName}`,
      });
    } catch (fsErr) {
      console.warn("[Local file write fallback notice]", fsErr);
      // Data URL fallback if filesystem write fails
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${file.type};base64,${base64}`;
      return NextResponse.json({ success: true, url: dataUrl });
    }
  } catch (error) {
    console.error("[Upload API Error]", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
