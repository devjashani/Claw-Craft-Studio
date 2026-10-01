import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ClawDivider } from "@/components/ui/claw-divider";

export const metadata: Metadata = {
  title: "Privacy Policy | CLAWCRAFT Studio",
  description:
    "Privacy Policy for CLAWCRAFT Studio. Information on how customer details, shipping addresses, and payment data are handled under Indian laws.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-void text-bone py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-10">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-acid">
            Legal & Compliance
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-bone mt-1">
            Privacy Policy
          </h1>
          <p className="text-xs text-muted font-mono mt-1">
            Last Updated: October 2026 • Governed under Information Technology Act, 2000 (India)
          </p>
          <ClawDivider variant="acid" className="my-6 max-w-xs" />
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-bone/85 leading-relaxed font-body">
          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">1. Overview</h2>
            <p>
              CLAWCRAFT (&quot;Studio&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting the privacy of visitors and collectors who browse and purchase handcrafted art pieces on clawcraft.in. This Privacy Policy outlines our practices regarding the collection, storage, and protection of personal data in accordance with the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 of India.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">2. Information We Collect</h2>
            <p>When you browse our storefront, commission a bespoke piece, or place an order, we collect:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted">
              <li><strong>Contact Information:</strong> Full name, email address, and 10-digit Indian phone number.</li>
              <li><strong>Delivery Information:</strong> Physical shipping address, landmark, city, state, and 6-digit postal PIN code.</li>
              <li><strong>Transaction Reference:</strong> Order ID, payment mode, and Razorpay transaction identifier. (Note: We do NOT collect or store your credit/debit card numbers, CVVs, or UPI PINs; all payments are processed through Razorpay&apos;s RBI-licensed gateway).</li>
              <li><strong>Commission Inquiries:</strong> Concept descriptions, reference visuals, and budget preferences submitted via our custom build forms.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">3. How Your Information Is Used</h2>
            <p>Your details are used exclusively for legitimate business purposes:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted">
              <li>Processing, hand-crafting, and fulfilling your order.</li>
              <li>Printing courier airway bills (AWBs) and dispatching packages through verified courier partners (Bluedart, Delhivery, DTDC).</li>
              <li>Transmitting order confirmation and courier tracking alerts via email and SMS/WhatsApp.</li>
              <li>Responding to your customer support and custom commission inquiries.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">4. Payment Security & Data Sharing</h2>
            <p>
              We do not sell, rent, or trade your personal information to third parties. We share your information solely with trusted service providers necessary for store operations:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted">
              <li><strong>Payment Gateway:</strong> Razorpay Software Private Limited for encrypted, PCI-DSS compliant payment processing.</li>
              <li><strong>Logistics Partners:</strong> Integrated courier services strictly to effect physical doorstep delivery.</li>
              <li><strong>Transactional Email:</strong> Resend for automated transactional order status updates.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">5. Data Retention & Your Rights</h2>
            <p>
              We retain customer order records for statutory accounting and warranty fulfillment periods under Indian law. You have the right to request a summary of the personal data we hold or request deletion of non-essential records by contacting us at <strong>privacy@clawcraft.in</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">6. Contact Information</h2>
            <p>
              For any questions regarding this Privacy Policy, please contact our grievance officer at:
            </p>
            <div className="p-4 bg-ash border border-subtle rounded text-xs font-mono space-y-1">
              <p className="text-bone font-bold">CLAWCRAFT Studio Privacy Desk</p>
              <p className="text-muted">Email: studio@clawcraft.in / orders@clawcraft.in</p>
              <p className="text-muted">WhatsApp: +91 98765 43210</p>
              <p className="text-muted">Bengaluru, Karnataka, India</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
