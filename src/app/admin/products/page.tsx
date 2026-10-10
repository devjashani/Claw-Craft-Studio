"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/shop";
import { formatINR } from "@/lib/utils";
import { getProductImageUrl } from "@/lib/product-media";
import { useToast } from "@/components/ui/toast";
import {
  Plus,
  Search,
  ExternalLink,
  Edit,
  AlertTriangle,
  Check,
  X,
  Minus,
} from "lucide-react";

export default function AdminProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleStockUpdate = async (id: string, newStock: number) => {
    if (newStock < 0) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock_count: newStock } : p))
    );

    try {
      await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, stock_count: newStock }),
      });
      showToast("Stock updated", "success");
    } catch {
      showToast("Failed to update stock", "error");
      fetchProducts();
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    const nextState = !current;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: nextState } : p))
    );

    try {
      await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: nextState }),
      });
      showToast(nextState ? "Product activated" : "Product hidden from store", "info");
    } catch {
      showToast("Failed to toggle visibility", "error");
      fetchProducts();
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      String(p.cans_count).includes(search);
    const cat = p.category?.toLowerCase() || "";
    const matchesCategory =
      categoryFilter === "all" ||
      p.category === categoryFilter ||
      (categoryFilter === "sculptures" &&
        (cat === "sculptures" || cat === "sculpture" || cat === "gun sculptures" || cat === "gun-sculptures")) ||
      (categoryFilter === "wall-art" &&
        (cat === "wall art" || cat === "wall-art" || cat === "heart wall art" || cat === "hearts" || cat === "heart")) ||
      (categoryFilter === "desk-decor" &&
        (cat === "desk & decor" || cat === "desk-decor" || cat === "desk decor" || cat === "desk" || cat === "decor"));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-subtle pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-acid">
            Workshop Inventory
          </span>
          <h1 className="font-heading text-3xl uppercase tracking-wider text-bone mt-1">
            Sculpture Catalog
          </h1>
          <p className="text-xs text-muted font-mono mt-1">
            Manage hand-forged can sculptures, ready stock quantities, pricing and visibility.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-acid text-void hover:bg-bone transition-colors text-xs font-mono font-bold uppercase tracking-wider rounded self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Sculpture</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, slug, or can count..."
            className="w-full pl-9 pr-3.5 py-2 bg-ash border border-subtle text-xs text-bone placeholder:text-muted focus:border-acid focus:outline-none rounded font-mono"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
          {[
            { id: "all", label: "All Items" },
            { id: "sculptures", label: "Gun Sculptures" },
            { id: "wall-art", label: "Wall Art" },
            { id: "desk-decor", label: "Desk & Decor" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors whitespace-nowrap ${
                categoryFilter === cat.id
                  ? "bg-acid text-void font-bold"
                  : "bg-ash border border-subtle text-muted hover:text-bone"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-ash border border-subtle rounded overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-muted font-mono text-xs">
            Loading catalog database...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-muted font-mono text-xs">
            No sculptures found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-subtle bg-void/50 text-[11px] font-mono text-muted uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Sculpture</th>
                  <th className="py-3 px-4">Cans</th>
                  <th className="py-3 px-4">Price (INR)</th>
                  <th className="py-3 px-4">Ready Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle/60 text-xs">
                {filteredProducts.map((p) => {
                  const thumbnail =
                    p.images?.[0]?.image_url && !p.images[0].image_url.endsWith(".jpg")
                      ? p.images[0].image_url
                      : getProductImageUrl(p.slug);

                  const isLowStock = p.stock_count <= 3;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-void/40 transition-colors group"
                    >
                      {/* Thumbnail & Title */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 relative bg-void border border-subtle rounded overflow-hidden shrink-0">
                            <Image
                              src={thumbnail}
                              alt={p.title}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-bone text-sm group-hover:text-acid transition-colors">
                              {p.title}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono text-muted truncate max-w-xs">
                                {p.slug}
                              </span>
                              {p.variants && p.variants.length > 0 && (
                                <span className="text-[10px] font-mono text-acid px-1.5 py-0.5 bg-acid/10 border border-acid/30 rounded">
                                  {p.variants.length} Variants
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cans Count */}
                      <td className="py-3.5 px-4 font-mono text-muted">
                        <span className="px-2 py-0.5 bg-void border border-subtle rounded text-[11px]">
                          {p.cans_count} CANS
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-mono font-bold text-bone">
                        <span>{formatINR(p.price_paise)}</span>
                      </td>

                      {/* Stock Quick Editor */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStockUpdate(p.id, p.stock_count - 1)}
                            className="p-1 bg-void border border-subtle hover:border-steel text-muted hover:text-bone rounded"
                            title="Decrease Stock"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <span
                            className={`font-mono text-xs px-2 py-0.5 rounded font-bold min-w-[32px] text-center ${
                              isLowStock
                                ? "bg-blood/10 text-blood border border-blood/30"
                                : "bg-void text-bone border border-subtle"
                            }`}
                          >
                            {p.stock_count}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleStockUpdate(p.id, p.stock_count + 1)}
                            className="p-1 bg-void border border-subtle hover:border-acid text-muted hover:text-acid rounded"
                            title="Increase Stock"
                          >
                            <Plus className="w-3 h-3" />
                          </button>

                          {isLowStock && (
                            <AlertTriangle className="w-3.5 h-3.5 text-blood shrink-0" />
                          )}
                        </div>
                      </td>

                      {/* Visibility Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p.id, p.is_active)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded border transition-colors ${
                            p.is_active
                              ? "bg-acid/10 border-acid text-acid"
                              : "bg-void border-subtle text-muted hover:text-bone"
                          }`}
                        >
                          {p.is_active ? (
                            <>
                              <Check className="w-3 h-3 text-acid" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3 text-muted" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/shop/${p.slug}`}
                            target="_blank"
                            className="p-1.5 text-muted hover:text-acid hover:bg-void rounded transition-colors"
                            title="View Public Store Page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-void border border-subtle hover:border-acid text-bone hover:text-acid text-xs font-mono uppercase tracking-wider rounded transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
