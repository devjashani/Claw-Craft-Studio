"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ClawButton } from "@/components/ui/claw-button";
import { ClawDivider } from "@/components/ui/claw-divider";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { useToast } from "@/components/ui/toast";
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
  const [uploadingImage, setUploadingImage] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setReferenceUrls([...referenceUrls, data.url]);
      showToast("Reference visual attached!", "success");
    } catch {
      showToast("Could not upload image. You can describe it in the notes.", "error");
    } finally {
      setUploadingImage(false);
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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request.");
      }

      setSubmittedPhone(phone);
      setSubmitted(true);
      showToast("Commission proposal sent to the studio!", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error submitting request", "error");
    } finally {
      setLoading(false);
    }
  };

  const cleanPhone = submittedPhone.replace(/\D/g, "");
  const whatsappFollowUpUrl = `https://wa.me/919876543210?text=${encodeURIComponent(
    `Hello CLAWCRAFT Studio! I just submitted a custom commission proposal on your website under the name ${name} (+91 ${cleanPhone}). Looking forward to discussing the design!`
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

            <div className="space-y-2">
              <h2 className="font-heading text-2xl sm:text-3xl uppercase tracking-wider text-bone">
                PROPOSAL RECEIVED
              </h2>
              <p className="text-xs font-mono uppercase tracking-widest text-acid">
                Status: In Studio Review
              </p>
              <p className="text-sm text-muted leading-relaxed max-w-md mx-auto">
                Thank you, <strong className="text-bone">{name}</strong>. Our workshop artisan has received your concept. We will review the structural feasibility and contact you via WhatsApp and email within 24 hours.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
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
              <div>
                <label className="block text-xs font-mono uppercase text-muted mb-1.5">
                  Attach Reference Image or Sketch (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-void border border-dashed border-subtle hover:border-acid text-muted hover:text-acid cursor-pointer text-xs font-mono rounded transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {uploadingImage ? "Attaching file..." : "Upload Sketch / Visual"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>

                  {referenceUrls.length > 0 && (
                    <span className="text-xs font-mono text-acid">
                      ✓ {referenceUrls.length} file(s) attached
                    </span>
                  )}
                </div>
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
                image: "/assets/products/14-can-gun-sculpture.jpg",
                client: "Gaming Studio Desk Piece • Mumbai",
              },
              {
                title: "27-Can Geometric Heart Relief",
                specs: "27 scored cans • Radial symmetry • 72cm height",
                image: "/assets/products/27-can-heart-wall-art.jpg",
                client: "Loft Wall Installation • Bengaluru",
              },
              {
                title: "8-Can Compact Tactical Relic",
                specs: "8 cans • Reinforced polymer core • 38cm width",
                image: "/assets/products/8-can-gun-sculpture.jpg",
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
