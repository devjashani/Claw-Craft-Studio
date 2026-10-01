import React from "react";
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
      <ShopCatalog initialProducts={products} />
    </div>
  );
}
