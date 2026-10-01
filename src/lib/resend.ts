import { Resend } from "resend";
import { Order, OrderItem } from "@/types/shop";
import { formatINR } from "@/lib/utils";

const resendApiKey = process.env.RESEND_API_KEY || "re_placeholderKey";
export const resend = new Resend(resendApiKey);

/**
 * Send Customer Order Confirmation Email
 */
export async function sendCustomerOrderConfirmationEmail({
  order,
  items,
}: {
  order: Order;
  items: OrderItem[];
}) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes("placeholder")) {
    console.log(`[Email Mock] Order confirmation email prepared for ${order.customer_email}`);
    return { success: true, mock: true };
  }

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #22262E;">
          <strong style="color: #F2F0EA; font-size: 14px;">${item.product_title}</strong><br/>
          <span style="color: #8E959F; font-size: 12px;">Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #22262E; text-align: right; color: #B8FF1F; font-family: monospace; font-size: 14px;">
          ${formatINR(item.total_price_paise)}
        </td>
      </tr>
    `
    )
    .join("");

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmed | CLAWCRAFT</title>
      </head>
      <body style="background-color: #050505; color: #F2F0EA; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #111214; border: 1px solid #22262E; padding: 30px; border-radius: 4px;">
          <div style="border-bottom: 2px solid #B8FF1F; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="color: #F2F0EA; font-size: 28px; letter-spacing: 2px; margin: 0; text-transform: uppercase;">CLAWCRAFT</h1>
            <p style="color: #B8FF1F; font-size: 12px; margin: 4px 0 0; text-transform: uppercase; font-family: monospace;">Empty cans. Full attitude.</p>
          </div>

          <h2 style="color: #F2F0EA; font-size: 20px; margin-top: 0;">ORDER CONFIRMED: ${order.order_number}</h2>
          <p style="color: #C9CDD2; font-size: 14px; line-height: 1.6;">
            Thank you, ${order.customer_name}. We have received your order. Our studio artisan is preparing your handcrafted can sculpture for rigid protective packaging.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <thead>
              <tr style="border-bottom: 1px solid #22262E; color: #8E959F; font-size: 12px; text-transform: uppercase;">
                <th style="text-align: left; padding-bottom: 8px;">Sculpture</th>
                <th style="text-align: right; padding-bottom: 8px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding-top: 16px; color: #8E959F; font-size: 13px;">Subtotal:</td>
                <td style="padding-top: 16px; text-align: right; color: #F2F0EA; font-family: monospace;">${formatINR(order.subtotal_paise)}</td>
              </tr>
              ${
                order.discount_paise > 0
                  ? `<tr>
                      <td style="padding-top: 8px; color: #B8FF1F; font-size: 13px;">Coupon Discount:</td>
                      <td style="padding-top: 8px; text-align: right; color: #B8FF1F; font-family: monospace;">-${formatINR(order.discount_paise)}</td>
                    </tr>`
                  : ""
              }
              <tr>
                <td style="padding-top: 8px; color: #8E959F; font-size: 13px;">Shipping:</td>
                <td style="padding-top: 8px; text-align: right; color: #F2F0EA; font-family: monospace;">${
                  order.shipping_fee_paise === 0
                    ? "FREE"
                    : formatINR(order.shipping_fee_paise)
                }</td>
              </tr>
              <tr>
                <td style="padding-top: 12px; font-weight: bold; color: #F2F0EA; font-size: 16px;">Total Paid:</td>
                <td style="padding-top: 12px; text-align: right; font-weight: bold; color: #B8FF1F; font-family: monospace; font-size: 18px;">${formatINR(order.total_paise)}</td>
              </tr>
            </tfoot>
          </table>

          <div style="background-color: #050505; border: 1px solid #22262E; padding: 16px; border-radius: 4px; margin: 24px 0;">
            <p style="margin: 0; font-size: 13px; color: #C9CDD2; line-height: 1.5;">
              <strong style="color: #F2F0EA; text-transform: uppercase;">Shipping To:</strong><br/>
              ${order.customer_name}<br/>
              ${order.shipping_address_line1}${order.shipping_address_line2 ? `, ${order.shipping_address_line2}` : ""}<br/>
              ${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}<br/>
              Phone: ${order.customer_phone}
            </p>
          </div>

          <div style="padding-top: 16px; border-top: 1px solid #22262E; font-size: 11px; color: #8E959F; line-height: 1.5;">
            <p style="margin: 0 0 8px;">
              <strong>DISCLAIMER:</strong> CLAWCRAFT is an independent art studio. Not affiliated with, sponsored by or endorsed by any beverage brand. Products are handcrafted art made from empty, recycled cans.
            </p>
            <p style="margin: 0;">
              <strong>NOTICE:</strong> Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    return await resend.emails.send({
      from: process.env.EMAIL_FROM || "orders@clawcraft.in",
      to: order.customer_email,
      subject: `Order Confirmed: ${order.order_number} | CLAWCRAFT Studio`,
      html: emailHtml,
    });
  } catch (error) {
    console.error("[Resend Error] Customer confirmation:", error);
    return { error };
  }
}

/**
 * Send Admin New Order Alert Email
 */
export async function sendAdminOrderAlertEmail({
  order,
  items,
}: {
  order: Order;
  items: OrderItem[];
}) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "studio@clawcraft.in";

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes("placeholder")) {
    console.log(`[Email Mock] Admin alert sent to ${adminEmail} for order ${order.order_number}`);
    return { success: true, mock: true };
  }

  const itemsSummary = items
    .map((i) => `• ${i.quantity}x ${i.product_title} (${formatINR(i.total_price_paise)})`)
    .join("<br/>");

  const emailHtml = `
    <h2>🚨 New Paid Order: ${order.order_number}</h2>
    <p><strong>Total:</strong> ${formatINR(order.total_paise)}</p>
    <p><strong>Customer:</strong> ${order.customer_name} (${order.customer_email}, ${order.customer_phone})</p>
    <p><strong>Address:</strong> ${order.shipping_address_line1}, ${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}</p>
    <p><strong>Payment Method:</strong> ${order.payment_method}</p>
    <h3>Items:</h3>
    <p>${itemsSummary}</p>
  `;

  try {
    return await resend.emails.send({
      from: process.env.EMAIL_FROM || "orders@clawcraft.in",
      to: adminEmail,
      subject: `🚨 New Order ${order.order_number} (${formatINR(order.total_paise)})`,
      html: emailHtml,
    });
  } catch (error) {
    console.error("[Resend Error] Admin alert:", error);
    return { error };
  }
}

/**
 * Send Customer Shipping & Tracking Notification Email
 */
export async function sendShippingUpdateEmail({
  order,
  courierName,
  trackingNumber,
  trackingUrl,
}: {
  order: Order;
  courierName: string;
  trackingNumber: string;
  trackingUrl?: string | null;
}) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes("placeholder")) {
    console.log(
      `[Email Mock] Shipping notification email dispatched for ${order.customer_email}: ${courierName} / ${trackingNumber}`
    );
    return { success: true, mock: true };
  }

  const trackingLinkHtml = trackingUrl
    ? `<p style="margin: 20px 0;"><a href="${trackingUrl}" style="background-color: #B8FF1F; color: #050505; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">TRACK SHIPMENT NOW</a></p>`
    : "";

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <body style="background-color: #050505; color: #F2F0EA; font-family: sans-serif; padding: 30px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #111214; border: 1px solid #22262E; padding: 30px; border-radius: 4px;">
          <h1 style="color: #F2F0EA; font-size: 24px; letter-spacing: 2px; margin-top: 0; text-transform: uppercase;">CLAWCRAFT</h1>
          <p style="color: #B8FF1F; font-size: 14px; font-family: monospace;">YOUR RELIC HAS BEEN DISPATCHED</p>
          <p style="color: #C9CDD2; font-size: 15px; line-height: 1.6;">
            Hello ${order.customer_name}, your handcrafted can sculpture for order <strong>${order.order_number}</strong> has shipped in rigid protective armor packaging.
          </p>
          <div style="background-color: #050505; border: 1px solid #22262E; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 4px 0; color: #8E959F; font-size: 13px;">COURIER: <strong style="color: #F2F0EA;">${courierName}</strong></p>
            <p style="margin: 4px 0; color: #8E959F; font-size: 13px;">TRACKING / AWB: <strong style="color: #B8FF1F; font-family: monospace;">${trackingNumber}</strong></p>
          </div>
          ${trackingLinkHtml}
          <p style="color: #8E959F; font-size: 12px; margin-top: 30px; border-top: 1px solid #22262E; padding-top: 16px;">
            Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    return await resend.emails.send({
      from: process.env.EMAIL_FROM || "orders@clawcraft.in",
      to: order.customer_email,
      subject: `Dispatched: Order ${order.order_number} is on the way | CLAWCRAFT`,
      html: emailHtml,
    });
  } catch (error) {
    console.error("[Resend Error] Shipping update:", error);
    return { error };
  }
}
