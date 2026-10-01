import React from "react";
import Link from "next/link";
import { getAdminOrderById } from "@/lib/admin/admin-data";
import { formatINR } from "@/lib/utils";
import { Printer, ArrowLeft, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

interface InvoicePageProps {
  params: { id: string };
}

export default async function OrderInvoicePage({ params }: InvoicePageProps) {
  const { order, items } = await getAdminOrderById(params.id);

  if (!order) {
    return (
      <div className="p-8 text-center text-muted font-mono">
        Invoice could not be generated: Order not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 print:bg-white text-bone print:text-neutral-900 py-8 px-4 sm:px-6">
      {/* Top Print Action Bar (Hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/admin/orders/${order.id}`}
          className="inline-flex items-center gap-2 text-xs font-mono text-muted hover:text-bone transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Order Management</span>
        </Link>

        {/* Client Print Button Component */}
        <button
          onClick={undefined} // handled by simple browser print via script/link
          className="px-4 py-2 bg-acid text-void font-bold text-xs font-mono uppercase tracking-wider rounded inline-flex items-center gap-2 cursor-pointer shadow-lg hover:bg-bone transition-colors"
          id="print-btn"
        >
          <Printer className="w-4 h-4" />
          <span>Print Tax Invoice</span>
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="max-w-4xl mx-auto bg-white text-neutral-900 p-8 sm:p-12 border border-neutral-300 print:border-none shadow-2xl print:shadow-none rounded print:rounded-none">
        {/* Studio Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-neutral-900 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-wider uppercase">CLAWCRAFT</h1>
            <p className="text-xs uppercase tracking-widest text-neutral-600 font-mono mt-0.5">
              Empty cans. Full attitude.
            </p>
            <p className="text-xs text-neutral-500 mt-2">
              Independent Handmade Art Studio • India
            </p>
            <p className="text-xs text-neutral-500 font-mono">
              Email: studio@clawcraft.in • Web: clawcraft.in
            </p>
          </div>

          <div className="mt-4 sm:mt-0 text-left sm:text-right">
            <span className="inline-block bg-neutral-900 text-white font-mono text-xs uppercase px-2.5 py-1 font-bold">
              TAX INVOICE & PACKING SLIP
            </span>
            <p className="font-mono text-sm font-bold mt-2">
              Order: {order.order_number}
            </p>
            <p className="text-xs font-mono text-neutral-600">
              Date: {new Date(order.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="text-xs font-mono text-neutral-600 uppercase">
              Payment: {order.payment_method} ({order.status})
            </p>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 text-xs">
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded">
            <p className="font-mono font-bold uppercase text-neutral-500 mb-2">
              Bill To / Customer:
            </p>
            <p className="font-bold text-sm text-neutral-900">{order.customer_name}</p>
            <p className="font-mono text-neutral-700">{order.customer_email}</p>
            <p className="font-mono text-neutral-700">+91 {order.customer_phone}</p>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded">
            <p className="font-mono font-bold uppercase text-neutral-500 mb-2">
              Ship To Address:
            </p>
            <p className="text-neutral-900">{order.shipping_address_line1}</p>
            {order.shipping_address_line2 && (
              <p className="text-neutral-900">{order.shipping_address_line2}</p>
            )}
            <p className="font-bold text-neutral-900">
              {order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}
            </p>
            <p className="font-mono text-neutral-600">India</p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="mb-8">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-neutral-900 text-neutral-600 font-mono uppercase">
                <th className="py-2.5">#</th>
                <th className="py-2.5">Relic Description</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Unit Rate (₹)</th>
                <th className="py-2.5 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="py-3 font-mono text-neutral-500">{idx + 1}</td>
                  <td className="py-3">
                    <p className="font-bold text-neutral-900">{item.product_title}</p>
                    <p className="text-[11px] text-neutral-500">
                      Handcrafted decorative display piece from cleaned energy-drink cans.
                    </p>
                  </td>
                  <td className="py-3 text-center font-mono font-bold">
                    {item.quantity}
                  </td>
                  <td className="py-3 text-right font-mono">
                    {(item.unit_price_paise / 100).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-3 text-right font-mono font-bold">
                    {(item.total_price_paise / 100).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Courier Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-4 border-t border-neutral-300 mb-8">
          <div className="text-xs space-y-1 text-neutral-600">
            {order.courier_name && (
              <p>
                <strong>Courier Partner:</strong> {order.courier_name}
              </p>
            )}
            {order.tracking_number && (
              <p className="font-mono">
                <strong>AWB / Tracking:</strong> {order.tracking_number}
              </p>
            )}
            {order.razorpay_payment_id && (
              <p className="font-mono text-[11px]">
                <strong>Payment Ref:</strong> {order.razorpay_payment_id}
              </p>
            )}
          </div>

          <div className="w-full sm:w-64 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal</span>
              <span>
                {(order.subtotal_paise / 100).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            {order.discount_paise > 0 && (
              <div className="flex justify-between text-neutral-900">
                <span>Discount</span>
                <span>
                  - {(order.discount_paise / 100).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
            <div className="flex justify-between text-neutral-600">
              <span>Shipping Fee</span>
              <span>
                {order.shipping_fee_paise === 0
                  ? "FREE"
                  : (order.shipping_fee_paise / 100).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
              </span>
            </div>
            <div className="flex justify-between font-bold text-sm text-neutral-900 pt-2 border-t-2 border-neutral-900">
              <span>TOTAL (INR)</span>
              <span>{formatINR(order.total_paise)}</span>
            </div>
          </div>
        </div>

        {/* Mandatory Legal & Safety Disclaimers */}
        <div className="border-t border-neutral-200 pt-6 space-y-2 text-[10px] text-neutral-500 leading-normal">
          <p className="font-bold uppercase text-neutral-700">
            SAFETY & COLLECTOR NOTICE:
          </p>
          <p>
            Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.
          </p>
          <p>
            CLAWCRAFT is an independent art studio. Not affiliated with, sponsored by or endorsed by any beverage brand. Products are handcrafted art made from empty, recycled cans.
          </p>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('print-btn')?.addEventListener('click', function() {
              window.print();
            });
          `,
        }}
      />
    </div>
  );
}
