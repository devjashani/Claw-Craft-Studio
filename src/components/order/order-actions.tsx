"use client";

import React, { useState } from "react";
import { Order } from "@/types/shop";
import { ClawButton } from "@/components/ui/claw-button";
import { Download, Printer, Loader2 } from "lucide-react";
import { buildSlipPdf } from "@/lib/pdf/order-slip";

interface OrderActionsProps {
  order: Order;
  token?: string | null;
}

export function OrderActions({ order, token }: OrderActionsProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadReceipt = async () => {
    setDownloading(true);
    try {
      if (order.isDemo || order.id.startsWith("demo-")) {
        // Client-side PDF generation for demo order
        const pdfBytes = await buildSlipPdf(order, {
          isDemo: true,
          watermarkText: "CLAWCRAFT STUDIO",
        });
        const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `CLAWCRAFT-Receipt-${order.order_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Server API download for real orders
        const publicToken = token || order.public_token || "";
        const url = `/api/orders/${order.id}/slip?t=${encodeURIComponent(publicToken)}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Unable to download receipt PDF.");
        }
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `CLAWCRAFT-Receipt-${order.order_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error("[Download Receipt Error]:", err);
      window.print(); // Fallback to print
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      <ClawButton
        variant="secondary"
        size="sm"
        onClick={handleDownloadReceipt}
        disabled={downloading}
        className="text-xs"
      >
        {downloading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            Generating PDF...
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download Receipt (PDF)
          </>
        )}
      </ClawButton>

      <button
        type="button"
        onClick={handlePrint}
        className="px-3 py-2 border border-steel/30 rounded-sm font-mono text-xs uppercase tracking-wider text-steel hover:text-bone hover:border-steel/60 transition-colors inline-flex items-center gap-1.5"
      >
        <Printer className="w-3.5 h-3.5" />
        Print
      </button>
    </div>
  );
}
