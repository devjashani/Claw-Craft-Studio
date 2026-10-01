import React from "react";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProductForm isEdit={false} />
    </div>
  );
}
