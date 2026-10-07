"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ClawButton } from "@/components/ui/claw-button";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { useToast } from "@/components/ui/toast";
import {
  Camera,
  Upload,
  Trash2,
  ZoomIn,
  ZoomOut,
  X,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface AvatarUploaderProps {
  userId: string;
  currentAvatarUrl?: string | null;
  displayName?: string | null;
  onAvatarUpdated: (newUrl: string | null) => void;
}

export function AvatarUploader({
  userId,
  currentAvatarUrl,
  displayName,
  onAvatarUpdated,
}: AvatarUploaderProps) {
  const toast = useToast();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal crop state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Uploading state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be picked again if needed
    e.target.value = "";

    // 1. Validate file format: jpg, png, webp
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Only JPG, PNG, and WebP images are supported.");
      toast.error("Invalid Format", "Please choose a JPG, PNG, or WebP image.");
      return;
    }

    // 2. Validate file size: up to 2 MB (2 * 1024 * 1024 bytes)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError("Image file size must be less than 2 MB.");
      toast.error("File Too Large", "Maximum image size is 2 MB.");
      return;
    }

    setUploadError(null);
    setOriginalFile(file);

    // Read image into Object URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setSelectedImageSrc(src);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Redraw canvas preview
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 300; // Preview viewport size
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);

    // Draw circular clipping path
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Fill dark background
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, size, size);

    // Calculate image position with zoom & pan
    const imgAspect = img.width / img.height;
    let baseWidth = size;
    let baseHeight = size;

    if (imgAspect > 1) {
      baseWidth = size * imgAspect;
    } else {
      baseHeight = size / imgAspect;
    }

    const drawWidth = baseWidth * zoom;
    const drawHeight = baseHeight * zoom;

    const drawX = (size - drawWidth) / 2 + pan.x;
    const drawY = (size - drawHeight) / 2 + pan.y;

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();

    // Draw circular guideline border
    ctx.strokeStyle = "#B8FF1F";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  }, [zoom, pan]);

  // Preload image object for canvas rendering
  useEffect(() => {
    if (!selectedImageSrc) return;
    const img = new window.Image();
    img.src = selectedImageSrc;
    img.onload = () => {
      imageObjRef.current = img;
      drawPreview();
    };
  }, [selectedImageSrc, drawPreview]);

  useEffect(() => {
    if (modalOpen) {
      drawPreview();
    }
  }, [modalOpen, drawPreview]);

  // Pan dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  // Helper: Extract storage path from avatar public URL
  const getStoragePathFromUrl = (url: string): string | null => {
    try {
      const match = url.match(/\/avatars\/([^?]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  // Export 512x512 WebP via Canvas and Upload to Supabase Storage
  const handleCropAndUpload = async () => {
    const img = imageObjRef.current;
    if (!img) return;

    setUploading(true);
    setProgress(15);
    setUploadError(null);

    try {
      // 1. Create offline 512x512 canvas for final export
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = 512;
      exportCanvas.height = 512;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize 2D canvas context.");

      // High-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Circular clip
      ctx.beginPath();
      ctx.arc(256, 256, 256, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Dark background
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, 512, 512);

      // Compute scale from preview canvas (300px) to export canvas (512px)
      const scaleFactor = 512 / 300;
      const imgAspect = img.width / img.height;
      let baseWidth = 300;
      let baseHeight = 300;

      if (imgAspect > 1) {
        baseWidth = 300 * imgAspect;
      } else {
        baseHeight = 300 / imgAspect;
      }

      const drawWidth = baseWidth * zoom * scaleFactor;
      const drawHeight = baseHeight * zoom * scaleFactor;
      const drawX = ((300 - baseWidth * zoom) / 2 + pan.x) * scaleFactor;
      const drawY = ((300 - baseHeight * zoom) / 2 + pan.y) * scaleFactor;

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      setProgress(40);

      // Convert to WebP blob (strips EXIF / GPS metadata)
      const blob = await new Promise<Blob | null>((resolve) => {
        exportCanvas.toBlob(
          (b) => resolve(b),
          "image/webp",
          0.92 // High quality WebP
        );
      });

      if (!blob) throw new Error("Canvas WebP conversion failed.");

      setProgress(60);

      // 2. Storage upload path: <user_id>/<random>.webp
      const randomHex = Math.random().toString(36).substring(2, 10);
      const fileName = `${Date.now()}_${randomHex}.webp`;
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase Storage avatars bucket
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadErr) {
        throw new Error(uploadErr.message);
      }

      setProgress(85);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(uploadData.path);

      // 3. Delete old avatar file from storage if one existed
      if (currentAvatarUrl) {
        const oldPath = getStoragePathFromUrl(currentAvatarUrl);
        if (oldPath && oldPath.startsWith(`${userId}/`)) {
          try {
            await supabase.storage.from("avatars").remove([oldPath]);
          } catch (delErr) {
            console.warn("[Old Avatar Removal Warning]", delErr);
          }
        }
      }

      // 4. Update profile row
      const { error: profileErr } = await (supabase.from("profiles") as any)
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileErr) {
        throw new Error(profileErr.message);
      }

      setProgress(100);
      toast.success("Avatar Updated", "Your new studio emblem is now live.");
      onAvatarUpdated(publicUrl);
      setModalOpen(false);
    } catch (err: any) {
      console.error("[Avatar Upload Error]", err);
      setUploadError(err.message || "Failed to process and upload avatar.");
      toast.error("Upload Failed", err.message || "Could not save avatar.");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  // Remove existing avatar
  const handleRemoveAvatar = async () => {
    if (!currentAvatarUrl) return;

    if (!confirm("Remove your current studio avatar?")) return;

    setUploading(true);
    try {
      const oldPath = getStoragePathFromUrl(currentAvatarUrl);
      if (oldPath && oldPath.startsWith(`${userId}/`)) {
        await supabase.storage.from("avatars").remove([oldPath]);
      }

      await (supabase.from("profiles") as any)
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      onAvatarUpdated(null);
      toast.success("Avatar Removed", "Switched back to your initial monogram.");
    } catch (err: any) {
      toast.error("Error", "Could not remove avatar.");
    } finally {
      setUploading(false);
    }
  };

  const initial = (displayName?.[0] || "C").toUpperCase();

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 sm:p-6 bg-ash/60 border border-steel/20 rounded-sm relative">
      <FiligreeCorner position="top-right" size={16} variant="acid" />

      {/* 40px Avatar Preview Container with glowing ring */}
      <div className="avatar-glowing-ring w-20 h-20 p-[3px] shrink-0">
        <div className="avatar-glowing-inner">
          {currentAvatarUrl ? (
            <Image
              src={currentAvatarUrl}
              alt="Avatar"
              width={76}
              height={76}
              className="w-full h-full object-cover rounded-full"
              unoptimized
            />
          ) : (
            <span className="text-acid font-display font-black text-2xl select-none">
              {initial}
            </span>
          )}
        </div>
      </div>

      {/* Actions & Instructions */}
      <div className="flex-1 text-center sm:text-left space-y-2">
        <div className="space-y-1">
          <h4 className="font-display uppercase text-sm text-bone font-bold tracking-wider">
            Studio Emblem
          </h4>
          <p className="font-sans text-xs text-steel">
            Upload a circular profile photo (JPG, PNG, or WebP up to 2 MB). Automatic 512×512 WebP crop with EXIF data stripped.
          </p>
        </div>

        {uploadError && (
          <div className="p-2 bg-blood/10 border border-blood text-blood text-[11px] rounded flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          <ClawButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <span className="flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-acid" />
              <span>{currentAvatarUrl ? "Change Photo" : "Upload Photo"}</span>
            </span>
          </ClawButton>

          {currentAvatarUrl && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={uploading}
              className="px-3 py-1.5 border border-steel/20 hover:border-blood text-steel hover:text-blood text-xs font-mono uppercase rounded transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          )}
        </div>
      </div>

      {/* CROP MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-ash border border-steel/40 w-full max-w-md rounded-sm p-6 relative shadow-2xl space-y-5">
            <FiligreeCorner position="top-right" size={20} variant="acid" />
            <FiligreeCorner position="bottom-left" size={20} variant="acid" />

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-steel/20 pb-3">
              <div>
                <h3 className="font-display uppercase text-base text-bone font-bold tracking-wider">
                  Adjust Studio Emblem
                </h3>
                <p className="font-sans text-[11px] text-steel">
                  Drag to pan, slider to zoom. Will be formatted as 512×512 WebP.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-steel hover:text-bone p-1"
                aria-label="Close Crop Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Canvas Viewport (Circular guideline) */}
            <div className="flex justify-center select-none">
              <div
                className="relative w-[300px] h-[300px] cursor-grab active:cursor-grabbing rounded-full overflow-hidden border border-acid/50 shadow-[0_0_20px_rgba(184,255,31,0.2)]"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={300}
                  className="w-full h-full block"
                />
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="space-y-1.5 px-2">
              <div className="flex items-center justify-between text-xs font-mono text-steel">
                <span className="flex items-center gap-1">
                  <ZoomOut className="w-3.5 h-3.5" />
                  <span>Zoom</span>
                </span>
                <span className="text-acid">{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-acid cursor-pointer"
              />
            </div>

            {/* Progress bar if uploading */}
            {uploading && progress !== null && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-steel">
                  <span>Processing & Uploading...</span>
                  <span className="text-acid">{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-void rounded-full overflow-hidden">
                  <div
                    className="h-full bg-acid transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-steel/20">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={uploading}
                className="px-4 py-2 text-xs font-mono uppercase text-steel hover:text-bone transition-colors"
              >
                Cancel
              </button>

              <ClawButton
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCropAndUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-void" />
                    <span>Saving...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-void" />
                    <span>Apply & Save</span>
                  </span>
                )}
              </ClawButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
