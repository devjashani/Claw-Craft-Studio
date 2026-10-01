import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProductById } from "@/lib/admin/admin-data";
import { ProductForm } from "@/components/admin/product-form";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface EditProductPageProps {
  params: { id: string };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const product = await getAdminProductById(params.id);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-heading text-2xl uppercase text-bone">
          Sculpture Not Found
        </h1>
        <p className="text-xs text-muted font-mono">
          The requested product ID does not exist in the studio database.
        </p>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 px-4 py-2 bg-ash border border-subtle text-bone text-xs font-mono uppercase rounded"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProductForm initialProduct={product} isEdit={true} />
    </div>
  );
}
