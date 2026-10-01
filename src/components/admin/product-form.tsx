"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Product } from "@/types/shop";
import { ClawButton } from "@/components/ui/claw-button";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { useToast } from "@/components/ui/toast";
import {
  Upload,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  ArrowLeft,
  Eye,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

interface ProductFormProps {
  initialProduct?: Product | null;
  isEdit?: boolean;
}

export function ProductForm({ initialProduct, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [title, setTitle] = useState(initialProduct?.title || "");
  const [slug, setSlug] = useState(initialProduct?.slug || "");
  const [tagline, setTagline] = useState(initialProduct?.tagline || "");
  const [category, setCategory] = useState(initialProduct?.category || "sculptures");
  const [cansCount, setCansCount] = useState<number>(initialProduct?.cans_count ?? 8);

  // Pricing (in Rupees for editing, converted to paise on submit)
  const [priceRupees, setPriceRupees] = useState<number>(
    initialProduct ? Math.round(initialProduct.price_paise / 100) : 1299
  );
  const [comparePriceRupees, setComparePriceRupees] = useState<number | "">(
    initialProduct?.compare_at_price_paise
      ? Math.round(initialProduct.compare_at_price_paise / 100)
      : ""
  );

  // Inventory & Lead time
  const [stockCount, setStockCount] = useState<number>(initialProduct?.stock_count ?? 5);
  const [isMadeToOrder, setIsMadeToOrder] = useState<boolean>(
    initialProduct?.is_made_to_order ?? false
  );
  const [leadTimeDays, setLeadTimeDays] = useState<number>(
    initialProduct?.lead_time_days ?? 3
  );

  // Dimensions & Weight
  const [widthCm, setWidthCm] = useState<number>(
    initialProduct?.dimensions_cm?.width ?? 35
  );
  const [heightCm, setHeightCm] = useState<number>(
    initialProduct?.dimensions_cm?.height ?? 22
  );
  const [depthCm, setDepthCm] = useState<number>(
    initialProduct?.dimensions_cm?.depth ?? 8
  );
  const [weightGrams, setWeightGrams] = useState<number>(
    initialProduct?.weight_grams ?? 500
  );

  // Materials & In The Box arrays
  const [materials, setMaterials] = useState<string[]>(
    initialProduct?.materials || [
      "Cleaned Aluminum Energy-Drink Cans",
      "Industrial Rivets",
      "Structural Polymer Bonding",
    ]
  );
  const [newMaterial, setNewMaterial] = useState("");

  const [inTheBox, setInTheBox] = useState<string[]>(
    initialProduct?.in_the_box || [
      "Handcrafted Can Sculpture",
      "Certificate of Authenticity",
      "Studio Sticker Pack",
    ]
  );
  const [newInTheBox, setNewInTheBox] = useState("");

  // Description
  const defaultDesc =
    "An aggressive, meticulously crafted display sculpture forged from cleaned, sanitized, and precision-scored energy-drink aluminum cans. Reinforced with internal polymer stabilizing cores and industrial rivets. Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.";
  const [description, setDescription] = useState(
    initialProduct?.description || defaultDesc
  );

  // Images
  const initialImages =
    initialProduct?.images && initialProduct.images.length > 0
      ? initialProduct.images.map((img) => img.image_url)
      : initialProduct?.slug
      ? [`/assets/products/${initialProduct.slug}.jpg`]
      : ["/assets/products/8-can-gun-sculpture.jpg"];

  const [images, setImages] = useState<string[]>(initialImages);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Status & Display
  const [isActive, setIsActive] = useState<boolean>(
    initialProduct?.is_active ?? true
  );
  const [displayOrder, setDisplayOrder] = useState<number>(
    initialProduct?.display_order ?? 1
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from title if creating new
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEdit || !slug) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
    }
  };

  const handleAddMaterial = () => {
    if (newMaterial.trim()) {
      setMaterials([...materials, newMaterial.trim()]);
      setNewMaterial("");
    }
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const handleAddInTheBox = () => {
    if (newInTheBox.trim()) {
      setInTheBox([...inTheBox, newInTheBox.trim()]);
      setNewInTheBox("");
    }
  };

  const handleRemoveInTheBox = (index: number) => {
    setInTheBox(inTheBox.filter((_, i) => i !== index));
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImages([...images, imageUrlInput.trim()]);
      setImageUrlInput("");
    }
  };

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

      setImages([...images, data.url]);
      showToast("Image uploaded successfully", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Upload error", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const pricePaise = Math.round(Number(priceRupees) * 100);
      const comparePricePaise =
        comparePriceRupees !== "" ? Math.round(Number(comparePriceRupees) * 100) : null;

      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        category,
        cans_count: Number(cansCount),
        price_paise: pricePaise,
        compare_at_price_paise: comparePricePaise,
        stock_count: Number(stockCount),
        is_made_to_order: isMadeToOrder,
        lead_time_days: Number(leadTimeDays),
        dimensions_cm: {
          width: Number(widthCm),
          height: Number(heightCm),
          depth: Number(depthCm),
        },
        weight_grams: Number(weightGrams),
        materials,
        in_the_box: inTheBox,
        is_active: isActive,
        display_order: Number(displayOrder),
      };

      const url = isEdit && initialProduct
        ? `/api/admin/products/${initialProduct.id}`
        : "/api/admin/products";

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save product.");
      }

      showToast(
        isEdit ? "Product updated successfully!" : "New sculpture added to catalog!",
        "success"
      );

      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving sculpture.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
      {/* Header Back & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-subtle pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 bg-ash border border-subtle hover:border-steel text-muted hover:text-bone rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-acid">
              {isEdit ? "Update Catalog Entry" : "Craft New Entry"}
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl uppercase text-bone">
              {isEdit ? initialProduct?.title : "New Can Sculpture"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEdit && initialProduct && (
            <Link
              href={`/shop/${initialProduct.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-ash border border-subtle hover:border-steel text-xs font-mono text-muted hover:text-bone rounded"
            >
              <Eye className="w-3.5 h-3.5 text-acid" />
              <span>Preview Live</span>
            </Link>
          )}

          <ClawButton
            type="submit"
            disabled={submitting}
            variant="acid"
            className="text-xs py-2 px-5"
          >
            {submitting ? "SAVING..." : isEdit ? "SAVE CHANGES" : "PUBLISH SCULPTURE"}
          </ClawButton>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-blood/10 border border-blood/40 text-blood text-xs flex items-center gap-3 rounded">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Core Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Details */}
          <div className="relative bg-ash border border-subtle p-6 rounded space-y-4">
            <FiligreeCorner position="top-right" size={14} />
            <h2 className="font-heading text-base uppercase text-bone">Primary Identity</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-muted mb-1">
                  Sculpture Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. 21-Can Dragon Skull Wall Art"
                  className="w-full bg-void border border-subtle px-3 py-2 text-sm text-bone focus:border-acid focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1">
                    Slug (URL Key) *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="21-can-dragon-skull"
                    className="w-full bg-void border border-subtle px-3 py-2 text-sm text-bone font-mono focus:border-acid focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-void border border-subtle px-3 py-2 text-sm text-bone focus:border-acid focus:outline-none"
                  >
                    <option value="sculptures">Gun Sculptures</option>
                    <option value="wall-art">Heart & Geometric Wall Art</option>
                    <option value="custom">Custom Builds</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Aggressive handheld architectural silhouette..."
                  className="w-full bg-void border border-subtle px-3 py-2 text-sm text-bone focus:border-acid focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted mb-1">
                  Energy Drink Cans Count *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={cansCount}
                  onChange={(e) => setCansCount(Number(e.target.value))}
                  className="w-full bg-void border border-subtle px-3 py-2 text-sm text-bone font-mono focus:border-acid focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="relative bg-ash border border-subtle p-6 rounded space-y-4">
            <FiligreeCorner position="top-right" size={14} />
            <h2 className="font-heading text-base uppercase text-bone">Pricing & Inventory (INR)</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-muted mb-1">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={priceRupees}
                  onChange={(e) => setPriceRupees(Number(e.target.value))}
                  placeholder="1299"
                  className="w-full bg-void border border-subtle px-3 py-2 text-sm text-bone font-mono focus:border-acid focus:outline-none"
                />
                <span className="text-[10px] text-muted font-mono mt-1 block">
                  Stored as {Math.round(priceRupees * 100)} paise in database.
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted mb-1">
                  Compare At Price (₹) <span className="text-muted/60">(Optional Strikethrough)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={comparePriceRupees}
                  onChange={(e) =>
                    setComparePriceRupees(e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder="1599"
                  className="w-full bg-void border border-subtle px-3 py-2 text-sm text-bone font-mono focus:border-acid focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted mb-1">
                  Ready Stock Units *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={stockCount}
                  onChange={(e) => setStockCount(Number(e.target.value))}
                  className="w-full bg-void border border-subtle px-3 py-2 text-sm text-bone font-mono focus:border-acid focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted mb-1">
                  Lead Time (Days to Dispatch)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                  className="w-full bg-void border border-subtle px-3 py-2 text-sm text-bone font-mono focus:border-acid focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMadeToOrder}
                  onChange={(e) => setIsMadeToOrder(e.target.checked)}
                  className="accent-acid w-4 h-4 rounded"
                />
                <span className="text-xs font-mono uppercase text-bone">
                  Is Made To Order (Crafted Upon Order Placement)
                </span>
              </label>
            </div>
          </div>

          {/* Description & Legal Safety Reminder */}
          <div className="relative bg-ash border border-subtle p-6 rounded space-y-4">
            <FiligreeCorner position="top-right" size={14} />
            <h2 className="font-heading text-base uppercase text-bone">
              Artisan Narrative & Safety Copy
            </h2>

            <div>
              <label className="block text-xs font-mono uppercase text-muted mb-1">
                Full Product Description *
              </label>
              <textarea
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-void border border-subtle p-3 text-sm text-bone focus:border-acid focus:outline-none leading-relaxed"
              />
            </div>

            {/* Safety Reminder Alert */}
            <div className="p-3 bg-void border border-subtle text-xs text-muted space-y-1">
              <div className="flex items-center gap-2 text-acid font-mono font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>MANDATORY BRAND SAFETY RULES</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Ensure zero mention of trademarked beverage brand names. Products must always carry:
                <em> &quot;Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.&quot;</em>
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Dimensions, Media, Lists & State */}
        <div className="space-y-6">
          {/* Status & Order */}
          <div className="bg-ash border border-subtle p-5 rounded space-y-4">
            <h3 className="font-heading text-sm uppercase text-bone">Visibility & Sorting</h3>

            <div className="flex items-center justify-between py-2 border-b border-subtle">
              <div>
                <p className="text-xs font-mono uppercase text-bone">Active in Store</p>
                <p className="text-[10px] text-muted">Visible for purchase to Indian customers</p>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-acid w-5 h-5 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-muted mb-1">
                Display Order Priority
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full bg-void border border-subtle px-3 py-1.5 text-xs text-bone font-mono"
              />
            </div>
          </div>

          {/* Media / Images */}
          <div className="bg-ash border border-subtle p-5 rounded space-y-4">
            <h3 className="font-heading text-sm uppercase text-bone">Images & Visuals</h3>

            {/* Upload Button */}
            <div>
              <label className="block text-xs font-mono uppercase text-muted mb-2">
                Upload Image (Supabase Storage / Local)
              </label>
              <label className="flex items-center justify-center gap-2 p-3 bg-void border border-dashed border-subtle hover:border-acid text-muted hover:text-acid cursor-pointer text-xs font-mono rounded transition-colors">
                <Upload className="w-4 h-4" />
                <span>{uploadingImage ? "Uploading..." : "Select Image File"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>

            {/* Add Custom URL */}
            <div className="flex gap-2">
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="/assets/products/... or https://"
                className="flex-1 bg-void border border-subtle px-2.5 py-1.5 text-xs text-bone font-mono focus:border-acid focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-3 py-1.5 bg-subtle hover:bg-steel text-void text-xs font-mono font-bold rounded"
              >
                Add
              </button>
            </div>

            {/* Current Images List */}
            <div className="space-y-2">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 bg-void border border-subtle rounded text-xs"
                >
                  <div className="w-10 h-10 relative bg-ash rounded overflow-hidden shrink-0">
                    <Image
                      src={img}
                      alt="Thumbnail"
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <span className="flex-1 font-mono text-[11px] truncate text-muted">
                    {img}
                  </span>
                  {idx === 0 && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-acid/20 text-acid rounded">
                      Primary
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="p-1 text-muted hover:text-blood"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Physical Specifications */}
          <div className="bg-ash border border-subtle p-5 rounded space-y-4">
            <h3 className="font-heading text-sm uppercase text-bone">Dimensions & Weight</h3>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-mono uppercase text-muted mb-1">
                  W (cm)
                </label>
                <input
                  type="number"
                  value={widthCm}
                  onChange={(e) => setWidthCm(Number(e.target.value))}
                  className="w-full bg-void border border-subtle px-2 py-1 text-xs text-bone font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-muted mb-1">
                  H (cm)
                </label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full bg-void border border-subtle px-2 py-1 text-xs text-bone font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-muted mb-1">
                  D (cm)
                </label>
                <input
                  type="number"
                  value={depthCm}
                  onChange={(e) => setDepthCm(Number(e.target.value))}
                  className="w-full bg-void border border-subtle px-2 py-1 text-xs text-bone font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-muted mb-1">
                Weight (Grams)
              </label>
              <input
                type="number"
                value={weightGrams}
                onChange={(e) => setWeightGrams(Number(e.target.value))}
                className="w-full bg-void border border-subtle px-3 py-1.5 text-xs text-bone font-mono"
              />
            </div>
          </div>

          {/* Materials List */}
          <div className="bg-ash border border-subtle p-5 rounded space-y-3">
            <h3 className="font-heading text-sm uppercase text-bone">Materials</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
                placeholder="e.g. Brushed Brass Rivets"
                className="flex-1 bg-void border border-subtle px-2.5 py-1 text-xs text-bone font-mono"
              />
              <button
                type="button"
                onClick={handleAddMaterial}
                className="p-1.5 bg-subtle hover:bg-steel text-void rounded"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1.5">
              {materials.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs font-mono p-1.5 bg-void border border-subtle rounded"
                >
                  <span className="text-muted">{m}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMaterial(idx)}
                    className="text-muted hover:text-blood"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* In The Box */}
          <div className="bg-ash border border-subtle p-5 rounded space-y-3">
            <h3 className="font-heading text-sm uppercase text-bone">In The Box</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newInTheBox}
                onChange={(e) => setNewInTheBox(e.target.value)}
                placeholder="e.g. Mounting Stencils"
                className="flex-1 bg-void border border-subtle px-2.5 py-1 text-xs text-bone font-mono"
              />
              <button
                type="button"
                onClick={handleAddInTheBox}
                className="p-1.5 bg-subtle hover:bg-steel text-void rounded"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1.5">
              {inTheBox.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs font-mono p-1.5 bg-void border border-subtle rounded"
                >
                  <span className="text-muted">{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInTheBox(idx)}
                    className="text-muted hover:text-blood"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
