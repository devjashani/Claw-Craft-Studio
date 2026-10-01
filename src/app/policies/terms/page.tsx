import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ClawDivider } from "@/components/ui/claw-divider";

export const metadata: Metadata = {
  title: "Terms of Service | CLAWCRAFT Studio",
  description:
    "Terms of Service governing the purchase and display of handcrafted can sculptures from CLAWCRAFT Studio.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-void text-bone py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-10">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-acid">
            Studio Agreement
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-bone mt-1">
            Terms of Service
          </h1>
          <p className="text-xs text-muted font-mono mt-1">
            Last Updated: October 2026 • Valid for all collectors across India
          </p>
          <ClawDivider variant="acid" className="my-6 max-w-xs" />
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-bone/85 leading-relaxed font-body">
          {/* Section 1 */}
          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">
              1. Independent Studio Status & Beverage Brand Disclaimer
            </h2>
            <p>
              CLAWCRAFT is an independent handmade art studio. We are NOT affiliated with, sponsored by, authorized by, or endorsed by any energy-drink company, beverage conglomerate, or trademark owner. Our works are transformative artistic sculptures forged from discarded, post-consumer aluminum cans.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">
              2. Product Classification & Safety Notice
            </h2>
            <div className="p-4 bg-ash border border-acid/40 rounded space-y-2 text-xs">
              <p className="font-mono font-bold text-acid uppercase">
                MANDATORY ART CLASSIFICATION:
              </p>
              <p>
                All items fabricated and sold by CLAWCRAFT are strictly non-functional, handcrafted decorative display sculptures and geometric wall reliefs. They contain zero internal firing mechanisms, have no projectile chambers, and are explicitly <strong>NOT toys and NOT weapons</strong>.
              </p>
              <p>
                Products are intended for adult collector display only. Keep out of reach of small children and infants.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">
              3. Pricing & Currency
            </h2>
            <p>
              All prices displayed on clawcraft.in are in Indian Rupees (INR) and are inclusive of all applicable statutory taxes. Final checkout amounts including delivery fees are verified on our secure servers before order creation. We reserve the right to revise pricing for future pieces without prior notice.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">
              4. Orders, Payments & Fulfillment
            </h2>
            <p>
              Order confirmation is subject to successful payment verification via our payment partner, Razorpay. In-stock sculptures dispatch within 24 to 48 hours. Pieces marked as &quot;Made to Order&quot; carry an artisanal lead time of 3 to 5 business days for fabrication before courier pickup.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">
              5. Intellectual Property
            </h2>
            <p>
              All sculpture designs, photographic assets, copy, typography styling, and branding on this website are the proprietary creative property of CLAWCRAFT. Unauthorized reproduction, mass commercial replication, or direct image re-use is strictly prohibited.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">
              6. Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms of Service and any contractual agreements relating to purchases from CLAWCRAFT are governed by and construed in accordance with the laws of the Republic of India. Any disputes arising shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka, India.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-2">
            <h2 className="font-heading text-lg uppercase text-bone">
              7. Contact Us
            </h2>
            <p>
              For legal inquiries or terms clarification, please email <strong>legal@clawcraft.in</strong> or write to CLAWCRAFT Studio, Bengaluru, Karnataka, India.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
