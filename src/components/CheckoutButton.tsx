"use client";

import React, { useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CheckoutButtonProps {
  amount: number;
  productName: string;
  className?: string;
}

export default function CheckoutButton({
  amount,
  productName,
  className = "",
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // 1. Call /api/razorpay with amount and productName to create order
      const res = await fetch("/api/razorpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          receipt: `rcpt_${Date.now().toString(36)}`,
          productName,
        }),
      });

      const orderData = await res.json();

      if (!res.ok || orderData.error) {
        throw new Error(orderData.error || "Failed to create Razorpay order.");
      }

      // Check if Razorpay SDK script is loaded
      if (typeof window === "undefined" || !window.Razorpay) {
        alert("Razorpay checkout script is still loading. Please try again in a moment.");
        setLoading(false);
        return;
      }

      // 2. Open Razorpay checkout popup using returned order details
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Claw Craft Studio",
        description: productName,
        order_id: orderData.id,
        handler: function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          // STEP 4: Save payment details to Supabase here later
          // TODO: Implement Supabase record creation/update with response.razorpay_payment_id,
          // response.razorpay_order_id, and response.razorpay_signature

          // 3. Show alert with payment id on success
          alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
          setLoading(false);
        },
        theme: {
          color: "#9333ea", // Purple accent
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on("payment.failed", function (response: any) {
        // 4. Show alert on failure
        alert(`Payment Failed: ${response.error?.description || "Transaction failed."}`);
        setLoading(false);
      });

      razorpayInstance.open();
    } catch (error: any) {
      alert(`Payment Error: ${error?.message || "Failed to process payment."}`);
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <button
        type="button"
        onClick={handlePayment}
        disabled={loading}
        className={`bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? "Processing..." : `Pay ₹${amount}`}
      </button>
    </>
  );
}
