/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { ClawButton } from "@/components/ui/claw-button";
import { ClawDivider } from "@/components/ui/claw-divider";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { useToast } from "@/components/ui/toast";
import { PRODUCT_IMAGE_MAP } from "@/lib/product-media";
import {
  Sparkles,
  ArrowRight,
  Upload,
  MessageSquare,
  CheckCircle2,
  Clock,
  ShieldAlert,
  HelpCircle,
  FileCheck,
  Zap,
  X,
  RotateCcw,
  Loader2,
  AlertTriangle,
  ImageIcon,
  Compass,
} from "lucide-react";

export default function CustomBuildsPage() {
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [concept, setConcept] = useState("");
  const [preferredCans, setPreferredCans] = useState("");
  const [estimatedSize, setEstimatedSize] = useState("Desktop sculpture (30–50 cm)");
  const [budget, setBudget] = useState("₹5,000 – ₹10,000");
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);

  // Direct upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "compressing" | "uploading" | "success" | "error"
  >("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [submittedRefId, setSubmittedRefId] = useState("");
  const [submittedTrackUrl, setSubmittedTrackUrl] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const processUpload = async (file: File) => {
    // 1. Check size limit (> 10 MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const errMsg = `Original image is ${sizeMb} MB. Maximum allowed size is 10 MB. Please choose a smaller photo.`;
      console.warn("[Upload Validation Rejected]", errMsg);
      setUploadError(errMsg);
      setUploadStatus("error");
      showToast(errMsg, "error");
      return;
    }

    // 2. Check format (jpg, jpeg, png, webp, heic, heif)
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowedExts = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
    const isImageMime = file.type.startsWith("image/") || file.type === "";
    if (!allowedExts.includes(ext) && !isImageMime) {
      const errMsg = `Unsupported image format (.${ext || "file"}). Allowed: JPG, PNG, WebP, HEIC/HEIF.`;
      console.warn("[Upload Validation Rejected]", errMsg);
      setUploadError(errMsg);
      setUploadStatus("error");
      showToast(errMsg, "error");
      return;
    }

    setUploadError(null);
    setUploadStatus("compressing");
    setUploadProgress(10);

    // Initial preview if browser supports native rendering (PNG, JPG, WebP)
    const isHeic =
      ext === "heic" ||
      ext === "heif" ||
      file.type.toLowerCase().includes("heic") ||
      file.type.toLowerCase().includes("heif");

    if (!isHeic && typeof URL !== "undefined") {
      try {
        setPreviewUrl(URL.createObjectURL(file));
      } catch {}
    }

    // 3. Client-side compression (max 1600px, ~0.8 quality, target < 1.5 MB, convert HEIC to JPEG)
    let compressedFile: File;
    try {
      const options = {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1600,
        initialQuality: 0.8,
        fileType: "image/jpeg",
        useWebWorker: true,
        onProgress: (p: number) => {
          // Scale compression progress to 10% - 50%
          setUploadProgress(Math.round(10 + p * 0.4));
        },
      };

      compressedFile = await imageCompression(file, options);
      setUploadProgress(50);

      // Once compressed to JPEG, all browsers (including iOS Safari) can preview the object URL
      try {
        setPreviewUrl(URL.createObjectURL(compressedFile));
      } catch {}
    } catch (compErr: unknown) {
      console.error("[Client Image Compression Error]", compErr);
      if (file.size <= 1.5 * 1024 * 1024 && !isHeic) {
        compressedFile = file;
        setUploadProgress(50);
      } else {
        const errMsg = "Failed to process or compress this image on your device. Please try another image.";
        setUploadError(errMsg);
        setUploadStatus("error");
        showToast(errMsg, "error");
        return;
      }
    }

    // 4. Request Direct Signed Upload URL from server
    setUploadStatus("uploading");
    setUploadProgress(60);

    let signData: { signedUrl: string; token: string; path: string; publicUrl: string };
    try {
      const res = await fetch("/api/custom-requests/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          fileType: "image/jpeg",
          fileSize: compressedFile.size,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.signedUrl) {
        console.error("[Signed URL Request Failed]", res.status, data);
        const errMsg = data.error || `Server returned error ${res.status} when generating upload authorization.`;
        throw new Error(errMsg);
      }

      signData = data;
      setUploadProgress(75);
    } catch (err: unknown) {
      console.error("[Signed URL Generation Error]", err);
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      const errMsg = isOffline
        ? "Network offline. Please check your internet connection."
        : err instanceof Error
        ? err.message
        : "Failed to generate storage upload URL.";
      setUploadError(errMsg);
      setUploadStatus("error");
      showToast(errMsg, "error");
      return;
    }

    // 5. Direct Browser-to-Storage Upload
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("custom-references")
        .uploadToSignedUrl(signData.path, signData.token, compressedFile, {
          contentType: "image/jpeg",
        });

      if (error || !data) {
        console.error("[Direct Storage Upload Error]", {
          error,
          statusCode: (error as any)?.statusCode,
        });
        throw new Error(error?.message || "Storage rejected the upload.");
      }

      setUploadProgress(100);
      setUploadStatus("success");
      setLastUploadedUrl(signData.publicUrl);
      setReferenceUrls((prev) => {
        if (prev.includes(signData.publicUrl)) return prev;
        return [...prev, signData.publicUrl];
      });
      showToast("Reference visual attached!", "success");
    } catch (uploadErr: unknown) {
      console.error("[Direct Upload Exception]", uploadErr);
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      const errMsg = isOffline
        ? "Network connection lost during upload. Please reconnect and retry."
        : uploadErr instanceof Error
        ? uploadErr.message
        : "Storage upload failed. Please try again or submit your notes without the image.";
      setUploadError(errMsg);
      setUploadStatus("error");
      showToast(errMsg, "error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    processUpload(file);
  };

  const handleRetryUpload = () => {
    if (selectedFile) {
      processUpload(selectedFile);
    }
  };

  const handleRemoveCurrent = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {}
    }
    if (lastUploadedUrl) {
      setReferenceUrls((prev) => prev.filter((u) => u !== lastUploadedUrl));
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setLastUploadedUrl(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveUrl = (urlToRemove: string) => {
    setReferenceUrls((prev) => prev.filter((u) => u !== urlToRemove));
    if (lastUploadedUrl === urlToRemove) {
      handleRemoveCurrent();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/custom-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          concept_description: concept,
          preferred_can_types: preferredCans,
          estimated_size: estimatedSize,
          budget_inr: budget,
          reference_image_urls: referenceUrls,
          hp_field: honeypot,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "We could not save your request, please try again or message us on WhatsApp"
        );
      }

      const refId = data.refCode || data.referenceId || `REQ-${data.id?.slice(0, 8).toUpperCase()}`;
      const trackUrl = data.trackUrl || `/track/custom?ref=${encodeURIComponent(refId)}`;
      setSubmittedRefId(refId);
      setSubmittedTrackUrl(trackUrl);
      setSubmittedPhone(phone);

      // Save a copy of the last request link as a convenience
      try {
        localStorage.setItem(
          "clawcraft_last_custom_track",
          JSON.stringify({ refCode: refId, trackUrl, submittedAt: new Date().toISOString() })
        );
      } catch {
        // Ignore localStorage quota or privacy restrictions
      }

      setSubmitted(true);
      showToast("Commission proposal recorded in the studio!", "success");
    } catch (err: unknown) {
      showToast(
        err instanceof Error
          ? err.message
          : "We could not save your request, please try again or message us on WhatsApp",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const cleanPhone = submittedPhone.replace(/\D/g, "");
  const whatsappFollowUpUrl = `https://wa.me/919876543210?text=${encodeURIComponent(
    `Hello CLAWCRAFT Studio! I just submitted commission proposal [${submittedRefId}] under the name ${name} (+91 ${cleanPhone}). Looking forward to discussing the design!`
  )}`;

  return (
    <div className="min-h-screen bg-void text-bone py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Hero Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-ash border border-acid/40 rounded-full text-xs font-mono uppercase tracking-widest text-acid">
            <Sparkles className="w-3.5 h-3.5 text-acid" />
            <span>Bespoke Artisan Commission</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl uppercase tracking-wider text-bone">
            CRAFT YOUR RELIC
          </h1>

          <p className="text-sm sm:text-base text-muted max-w-2xl mx-auto leading-relaxed">
            Have a specific silhouette in mind? Commission an exclusive geometric display sculpture or wall relief hand-fabricated from your favorite cleaned aluminum energy cans.
          </p>

          <ClawDivider variant="acid" className="my-6 max-w-xs mx-auto" />
        </div>

        {/* 4-Step Commission Protocol */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: "01",
              title: "CONCEPT BRIEF",
              desc: "Describe your dream silhouette, can palette, dimensions, and setting.",
            },
            {
              step: "02",
              title: "SKETCH & QUOTE",
              desc: "We review structural stress-points and send you an architectural proposal within 24 hours.",
            },
            {
              step: "03",
              title: "HAND FABRICATION",
              desc: "Empty cans are ultrasonically cleaned, precision-scored, core-stabilized, and riveted.",
            },
            {
              step: "04",
              title: "ARMOR DISPATCH",
              desc: "Packed in multi-ply rigid cartons with foam shock absorption. Pan-India tracked delivery.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative bg-ash border border-subtle p-5 rounded space-y-2"
            >
              <FiligreeCorner position="top-right" size={12} />
              <span className="font-mono text-xs font-bold text-acid">
                PHASE {item.step}
              </span>
              <h3 className="font-heading text-sm uppercase text-bone">
                {item.title}
              </h3>
              <p className="text-xs text-muted leading-relaxed font-body">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Form or Success State */}
        {submitted ? (
          <div className="relative bg-ash border border-acid/60 p-8 sm:p-12 rounded shadow-2xl text-center max-w-2xl mx-auto space-y-6">
            <FiligreeCorner position="top-left" size={24} />
            <FiligreeCorner position="bottom-right" size={24} />

            <div className="w-16 h-16 bg-acid/10 border border-acid text-acid rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-void border border-acid/50 rounded text-xs font-mono">
                <span className="text-muted text-[11px] uppercase tracking-wider">Reference Code:</span>
                <span className="text-acid font-bold tracking-widest">{submittedRefId}</span>
              </div>

              <h2 className="font-heading text-2xl sm:text-3xl uppercase tracking-wider text-bone">
                PROPOSAL RECEIVED
              </h2>
              <p className="text-xs font-mono uppercase tracking-widest text-acid">
                Status: In Studio Review
              </p>
              <p className="text-sm text-muted leading-relaxed max-w-md mx-auto">
                Thank you, <strong className="text-bone">{name}</strong>. Your concept has been saved in our studio database. We will review structural feasibility and contact you via WhatsApp (+91 {cleanPhone}) within 24 hours.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={submittedTrackUrl || `/track/custom?ref=${submittedRefId}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-acid hover:bg-lime-400 text-void font-bold text-xs font-mono uppercase tracking-wider rounded transition-colors shadow-lg"
              >
                <Compass className="w-4 h-4" />
                <span>Track This Request</span>
              </Link>

              <a
                href={whatsappFollowUpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-void font-bold text-xs font-mono uppercase tracking-wider rounded transition-colors shadow-lg"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat Directly on WhatsApp</span>
              </a>

              <Link
                href="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-void border border-subtle hover:border-steel text-bone text-xs font-mono uppercase tracking-wider rounded transition-colors"
              >
                <span>Browse Ready Sculptures</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative bg-ash border border-subtle p-6 sm:p-10 rounded shadow-2xl max-w-3xl mx-auto">
            <FiligreeCorner position="top-left" size={20} />
            <FiligreeCorner position="bottom-right" size={20} />

            <div className="mb-8 border-b border-subtle pb-4">
              <h2 className="font-heading text-2xl uppercase tracking-wider text-bone flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-acid" />
                <span>Commission Inquiry Form</span>
              </h2>
              <p className="text-xs text-muted font-mono mt-1">
                Zero commitment required. We discuss sketches and pricing before any production deposit.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Invisible honeypot field for bot prevention */}
              <input
                type="text"
                name="hp_field"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vikram Sengupta"
                    className="w-full bg-void border border-subtle px-3.5 py-2.5 text-xs text-bone placeholder:text-muted/50 focus:border-acid focus:outline-none rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vikram@designlab.in"
                    className="w-full bg-void border border-subtle px-3.5 py-2.5 text-xs text-bone placeholder:text-muted/50 focus:border-acid focus:outline-none rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted mb-1.5">
                  10-Digit WhatsApp Mobile Number (India) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="9876543210"
                    className="w-full pl-12 pr-3.5 py-2.5 bg-void border border-subtle text-xs text-bone font-mono placeholder:text-muted/50 focus:border-acid focus:outline-none rounded"
                  />
                </div>
                <span className="text-[10px] text-muted font-mono mt-1 block">
                  Used by our workshop artisan to share concept sketches & dispatch updates.
                </span>
              </div>

              {/* Concept Narrative */}
              <div>
                <label className="block text-xs font-mono uppercase text-muted mb-1.5">
                  Describe Your Concept & Vision *
                </label>
                <textarea
                  required
                  rows={4}
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="e.g. I want a 35-can mechanical dragon skull wall installation for my streaming setup. Bold flared horns, aggressive angular eye sockets, with black and neon green can textures..."
                  className="w-full bg-void border border-subtle p-3.5 text-xs text-bone focus:border-acid focus:outline-none rounded font-body leading-relaxed placeholder:text-muted/40"
                />
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1.5">
                    Preferred Can Colorway
                  </label>
                  <input
                    type="text"
                    value={preferredCans}
                    onChange={(e) => setPreferredCans(e.target.value)}
                    placeholder="e.g. Neon Green & Black"
                    className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1.5">
                    Estimated Dimensions
                  </label>
                  <select
                    value={estimatedSize}
                    onChange={(e) => setEstimatedSize(e.target.value)}
                    className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none rounded"
                  >
                    <option value="Desktop sculpture (30–50 cm)">
                      Desktop sculpture (30–50 cm)
                    </option>
                    <option value="Mantlepiece piece (50–70 cm)">
                      Mantlepiece piece (50–70 cm)
                    </option>
                    <option value="Wall mount art (60–100 cm)">
                      Wall mount art (60–100 cm)
                    </option>
                    <option value="Large studio installation (100+ cm)">
                      Large installation (100+ cm)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1.5">
                    Target Budget (INR)
                  </label>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none rounded"
                  >
                    <option value="₹5,000 – ₹10,000">₹5,000 – ₹10,000</option>
                    <option value="₹10,000 – ₹20,000">₹10,000 – ₹20,000</option>
                    <option value="₹20,000 – ₹40,000">₹20,000 – ₹40,000</option>
                    <option value="₹40,000+ (Gallery Masterpiece)">
                      ₹40,000+ (Gallery Masterpiece)
                    </option>
                  </select>
                </div>
              </div>

              {/* Reference Attachment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono uppercase text-muted">
                    Attach Reference Image or Sketch (Optional)
                  </label>
                  <span className="text-[10px] text-muted font-mono">
                    JPG, PNG, WebP, HEIC • Max 10 MB
                  </span>
                </div>

                {/* Upload Status Card */}
                {uploadStatus === "idle" && (
                  <div>
                    <label className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-void border border-dashed border-subtle hover:border-acid text-muted hover:text-acid cursor-pointer text-xs font-mono rounded transition-colors group">
                      <Upload className="w-4 h-4 group-hover:scale-110 transition-transform text-steel group-hover:text-acid" />
                      <span>Upload Sketch / Photo Visual</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-muted font-mono mt-1.5">
                      iPhone & camera photos are automatically optimized before direct cloud upload.
                    </p>
                  </div>
                )}

                {/* In Progress State (Compressing or Uploading) */}
                {(uploadStatus === "compressing" || uploadStatus === "uploading") && (
                  <div className="p-3.5 bg-void border border-subtle rounded space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2 text-bone">
                        <Loader2 className="w-4 h-4 animate-spin text-acid" />
                        <span>
                          {uploadStatus === "compressing"
                            ? "Optimizing image (max 1600px, JPEG)..."
                            : "Uploading directly to cloud storage..."}
                        </span>
                      </div>
                      <span className="text-acid font-bold">{uploadProgress}%</span>
                    </div>

                    <div className="w-full bg-ash h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-acid h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-muted">
                      <span className="truncate max-w-[200px]">
                        {selectedFile?.name || "Processing..."}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveCurrent}
                        className="text-steel hover:text-bone underline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {uploadStatus === "error" && (
                  <div className="p-3.5 bg-red-950/20 border border-red-500/30 rounded space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <div className="space-y-1 text-xs font-mono flex-1">
                        <p className="text-red-300 font-bold">Image Upload Failed</p>
                        <p className="text-red-400/90 text-[11px] leading-relaxed">
                          {uploadError || "Could not upload image."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-red-500/20">
                      {selectedFile && (
                        <button
                          type="button"
                          onClick={handleRetryUpload}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 text-xs font-mono rounded transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retry Upload</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleRemoveCurrent}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-muted hover:text-bone text-xs font-mono rounded transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                      <span className="text-[10px] text-muted font-mono ml-auto">
                        You can still submit your proposal below without this image.
                      </span>
                    </div>
                  </div>
                )}

                {/* Success Preview State */}
                {uploadStatus === "success" && previewUrl && (
                  <div className="p-3 bg-void border border-subtle rounded flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded border border-subtle overflow-hidden bg-ash shrink-0">
                        {/* Native img tag handles blob URLs reliably across iOS Safari & desktop */}
                        <img
                          src={previewUrl}
                          alt="Reference visual preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 right-1 bg-void/80 rounded-full p-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-acid" />
                        </div>
                      </div>

                      <div className="text-xs font-mono space-y-0.5">
                        <p className="text-bone font-medium truncate max-w-[200px] sm:max-w-xs">
                          {selectedFile?.name || "Reference Image"}
                        </p>
                        <p className="text-[11px] text-acid flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Optimized & attached to commission</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRemoveCurrent}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-muted hover:text-red-400 border border-subtle hover:border-red-500/40 rounded text-xs font-mono transition-colors"
                        title="Remove attachment"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Additional Gallery of Attached URLs if multiple */}
                {referenceUrls.length > 1 && (
                  <div className="pt-1">
                    <span className="text-[10px] text-muted font-mono uppercase block mb-1.5">
                      Attached Images ({referenceUrls.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {referenceUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative group w-12 h-12 rounded border border-subtle overflow-hidden bg-void"
                        >
                          <img
                            src={url}
                            alt={`Reference ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveUrl(url)}
                            className="absolute inset-0 bg-void/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-red-400"
                            title="Remove visual"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mandatory Brand Notice Box */}
              <div className="p-4 bg-void border border-subtle rounded text-xs text-muted space-y-1">
                <div className="flex items-center gap-2 text-steel font-mono font-bold text-[11px]">
                  <ShieldAlert className="w-3.5 h-3.5 text-acid" />
                  <span>COLLECTOR & SAFETY NOTICE</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children. CLAWCRAFT is an independent art studio not affiliated with or endorsed by any beverage company.
                </p>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <ClawButton
                  type="submit"
                  disabled={loading}
                  variant="acid"
                  className="w-full justify-center text-xs py-3.5 tracking-widest font-bold"
                >
                  {loading ? "TRANSMITTING TO WORKSHOP..." : "SUBMIT COMMISSION PROPOSAL"}
                  <ArrowRight className="w-4 h-4 ml-2 inline" />
                </ClawButton>
              </div>
            </form>
          </div>
        )}

        {/* Studio Inspiration Gallery */}
        <div className="space-y-6 pt-8 border-t border-subtle">
          <div className="text-center space-y-1">
            <span className="font-mono text-xs uppercase tracking-widest text-acid">
              Artisan Portfolio
            </span>
            <h2 className="font-heading text-2xl uppercase tracking-wider text-bone">
              Bespoke Fabrication Archive
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "14-Can Heavy Assault Silhouette",
                specs: "14 sanitized cans • Dual stock • 64cm width",
                image: PRODUCT_IMAGE_MAP["14-can-gun-sculpture"],
                client: "Gaming Studio Desk Piece • Mumbai",
              },
              {
                title: "27-Can Geometric Heart Relief",
                specs: "27 scored cans • Radial symmetry • 72cm height",
                image: PRODUCT_IMAGE_MAP["27-can-heart-wall-art"],
                client: "Loft Wall Installation • Bengaluru",
              },
              {
                title: "8-Can Compact Tactical Relic",
                specs: "8 cans • Reinforced polymer core • 38cm width",
                image: PRODUCT_IMAGE_MAP["8-can-gun-sculpture"],
                client: "Private Collector Display • Delhi",
              },
            ].map((arch, idx) => (
              <div
                key={idx}
                className="group relative bg-ash border border-subtle overflow-hidden rounded"
              >
                <div className="relative aspect-video w-full bg-void overflow-hidden">
                  <Image
                    src={arch.image}
                    alt={arch.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ash via-transparent to-transparent opacity-80" />
                </div>
                <div className="p-4 space-y-1">
                  <p className="font-bold text-bone text-sm">{arch.title}</p>
                  <p className="text-[11px] font-mono text-acid">{arch.specs}</p>
                  <p className="text-[10px] font-mono text-muted">{arch.client}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
