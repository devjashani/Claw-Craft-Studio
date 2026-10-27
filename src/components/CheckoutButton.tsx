"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface CheckoutButtonProps {
  amount?: number;
  productName?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Standard checkout redirect button.
 * Routes collectors through the secure, server-validated /checkout flow.
 */
export default function CheckoutButton({
  className = "",
  children,
}: CheckoutButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/checkout")}
      className={className || "px-6 py-3 bg-acid text-void font-mono font-bold text-xs uppercase tracking-wider rounded cursor-pointer hover:bg-bone transition-colors"}
    >
      {children || "Proceed to Checkout"}
    </button>
  );
}
