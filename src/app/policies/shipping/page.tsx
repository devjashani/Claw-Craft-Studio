import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ClawDivider } from "@/components/ui/claw-divider";
import { Truck, ShieldCheck, Clock, MapPin, Box } from "lucide-react";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | CLAWCRAFT Studio",
  description:
    "Pan-India shipping rates, delivery timelines, armor packaging guarantees, and courier tracking details for CLAWCRAFT handcrafted sculptures.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-void text-bone py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-10">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-acid">
            Logistics & Delivery
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-bone mt-1">
            Shipping & Delivery Policy
          </h1>
          <p className="text-xs text-muted font-mono mt-1">
            Last Updated: October 2026 • Doorstep delivery across all Indian PIN codes
          </p>
          <ClawDivider variant="acid" className="my-6 max-w-xs" />
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-ash border border-subtle p-4 rounded space-y-1 text-xs">
            <span className="font-mono text-acid font-bold">FREE SHIPPING</span>
            <p className="font-bold text-bone">On Orders ≥ ₹2,999</p>
            <p className="text-muted text-[11px]">Flat ₹149 on smaller orders</p>
          </div>

          <div className="bg-ash border border-subtle p-4 rounded space-y-1 text-xs">
            <span className="font-mono text-steel font-bold">DISPATCH TIMELINE</span>
            <p className="font-bold text-bone">24–48 Hours</p>
            <p className="text-muted text-[11px]">3–5 days for made-to-order</p>
          </div>

          <div className="bg-ash border border-subtle p-4 rounded space-y-1 text-xs">
            <span className="font-mono text-acid font-bold">ARMOR PACKAGING</span>
            <p className="font-bold text-bone">Multi-Ply Rigid Box</p>
            <p className="text-muted text-[11px]">Suspended in shock foam</p>
          </div>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-bone/85 leading-relaxed font-body">
          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">1. Coverage Area</h2>
            <p>
              CLAWCRAFT provides insured doorstep delivery to virtually all serviceable postal PIN codes across India via Tier-1 national courier networks. We do not currently ship internationally.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">2. Shipping Charges</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted">
              <li><strong>Orders ₹2,999 and above:</strong> FREE Shipping anywhere in India.</li>
              <li><strong>Orders below ₹2,999:</strong> A standard flat shipping fee of <strong>₹149</strong> is added at checkout.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">3. Order Processing & Lead Times</h2>
            <p>
              Because our sculptures are handcrafted by artisans rather than mass-manufactured by machines:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted">
              <li><strong>Ready In-Stock Sculptures:</strong> Hand-inspected and dispatched within <strong>24 to 48 business hours</strong> from our studio.</li>
              <li><strong>Made-to-Order Pieces:</strong> Require a fabrication window of <strong>3 to 5 business days</strong> before courier pickup.</li>
              <li><strong>Bespoke Custom Commissions:</strong> Lead times are individually established during the sketch and quotation phase.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">4. Estimated Delivery Timelines</h2>
            <p>Once dispatched from our workshop in Bengaluru:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted">
              <li><strong>Tier-1 Metros</strong> (Bengaluru, Mumbai, Delhi-NCR, Hyderabad, Chennai, Kolkata, Pune): <strong>2 to 4 business days</strong>.</li>
              <li><strong>Tier-2 & Tier-3 Cities:</strong> <strong>3 to 6 business days</strong>.</li>
              <li><strong>Northeast & Remote Locations:</strong> <strong>5 to 8 business days</strong>.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">5. Tracking Your Shipment</h2>
            <p>
              The moment your parcel is collected and scanned by the courier partner (Bluedart, Delhivery, DTDC, or Shiprocket), you will receive an email and SMS containing your <strong>Airway Bill (AWB) number</strong> and direct tracking URL. You can also monitor real-time fulfillment at any time on our <Link href="/track" className="text-acid hover:underline">Track Order Portal</Link>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">6. Armor Packaging Guarantee</h2>
            <p>
              We understand that aluminum can sculptures are delicate display pieces. We build customized multi-ply rigid corrugated armor cartons with high-density foam suspension cores for every order. In the unlikely event that your package sustains outer damage during courier handling, refer to our <Link href="/policies/refund-cancellation" className="text-acid hover:underline">Refund & Cancellation Policy</Link> for prompt resolution.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
