import React, { Suspense } from "react";
import type { Metadata } from "next";
import { getProducts } from "@/lib/products";
import { ShopCatalog } from "@/components/shop/shop-catalog";

export const metadata: Metadata = {
  title: "Shop All Handcrafted Can Sculptures",
  description:
    "Explore our collection of handcrafted display art and geometric wall sculptures built from cleaned energy-drink cans. Prices in INR. Pan-India shipping.",
};

export const revalidate = 60;

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-void">
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 py-16 text-center text-steel/60 font-mono text-xs">
            Loading Vault...
          </div>
        }
      >
        <ShopCatalog initialProducts={products} />
      </Suspense>
    </div>
  );
}
