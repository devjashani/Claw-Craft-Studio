import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ClawDivider } from "@/components/ui/claw-divider";
import { ShieldAlert, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | CLAWCRAFT Studio",
  description:
    "Refund and cancellation guidelines for CLAWCRAFT handcrafted display sculptures. Transit damage protocol and return timelines.",
};

export default function RefundCancellationPage() {
  return (
    <div className="min-h-screen bg-void text-bone py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-10">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-acid">
            Artisan Guarantee
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-bone mt-1">
            Refund & Cancellation Policy
          </h1>
          <p className="text-xs text-muted font-mono mt-1">
            Last Updated: October 2026 • Honest protection for Indian art collectors
          </p>
          <ClawDivider variant="acid" className="my-6 max-w-xs" />
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-bone/85 leading-relaxed font-body">
          {/* Section 1 */}
          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">
              1. Order Cancellations
            </h2>
            <p>
              We want you to be completely confident in your purchase. You may cancel your order free of charge at any time <strong>prior to courier dispatch</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted">
              <li>To cancel, message us on WhatsApp at <strong>+91 98765 43210</strong> or email <strong>orders@clawcraft.in</strong> quoting your order number (e.g. <code>CC-2026-XXXX</code>).</li>
              <li>Upon confirmation, a 100% refund is initiated immediately to your original payment method via Razorpay.</li>
              <li>Once an order has been handed over to the courier partner and an AWB has been issued, it cannot be canceled in transit.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">
              2. Transit Damage Protocol & Free Replacement
            </h2>
            <div className="p-4 bg-ash border border-acid/40 rounded space-y-2 text-xs">
              <p className="font-mono font-bold text-acid uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>100% TRANSIT DAMAGE COVERAGE</span>
              </p>
              <p>
                Although we pack all relics inside rigid armor cartons with high-density shock foam, courier transit can occasionally be rough. If your sculpture arrives dented or damaged:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-muted">
                <li>Notify our studio within <strong>48 hours of delivery</strong>.</li>
                <li>Send unboxing photos or a short video showing the damaged package and sculpture to <strong>studio@clawcraft.in</strong> or via WhatsApp.</li>
                <li>We will schedule a reverse-pickup from your doorstep at zero cost to you.</li>
                <li>You can choose between a <strong>priority replacement piece fabricated for free</strong> or a <strong>100% refund</strong>.</li>
              </ol>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">
              3. Nature of Handmade Upcycled Art
            </h2>
            <p>
              Every CLAWCRAFT relic is uniquely handcrafted from authentic, post-consumer aluminum beverage cans. Subtle microscopic variations in color registration, can curvature, and rivet placements are inherent characteristics of sustainable hand fabrication and constitute proof of artistic authenticity, not defects.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">
              4. Bespoke Custom Commissions
            </h2>
            <p>
              Custom builds commissioned via our /custom portal involve personalized sourcing, custom sketching, and bespoke fabrication. Once an architectural sketch is approved and a production deposit is paid, custom commissions are non-refundable unless damaged during transit.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">
              5. Refund Processing Timeline
            </h2>
            <p>
              Approved refunds are credited back to the original source instrument (UPI account, Credit/Debit Card, or NetBanking bank account) through Razorpay. Once initiated by our studio, funds typically appear in your account within <strong>5 to 7 business days</strong> depending on your issuing bank.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">
              6. Need Assistance?
            </h2>
            <p>
              Our founder and artisan team are directly accessible for any concerns:
            </p>
            <div className="p-4 bg-ash border border-subtle rounded text-xs font-mono space-y-1">
              <p className="text-bone">CLAWCRAFT Support Desk</p>
              <p className="text-muted">WhatsApp: +91 98765 43210</p>
              <p className="text-muted">Email: orders@clawcraft.in</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
