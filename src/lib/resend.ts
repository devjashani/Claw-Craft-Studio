import { Resend } from "resend";
import { Order, OrderItem } from "@/types/shop";
import { formatINR } from "@/lib/utils";
import { getBusinessContact } from "@/lib/contact";
import { siteConfig, getSiteHost, absoluteUrl } from "@/lib/site";

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
          ${
            item.variant_label
              ? `<span style="color: #B8FF1F; font-size: 12px; font-family: monospace;">Variant: ${item.variant_label}${
                  item.selected_option ? ` (${item.selected_option})` : ""
                }</span><br/>`
              : ""
          }
          <span style="color: #8E959F; font-size: 12px;">Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #22262E; text-align: right; color: #B8FF1F; font-family: monospace; font-size: 14px;">
          ${formatINR(item.total_price_paise)}
        </td>
      </tr>
    `
    )
    .join("");

  const trackingUrl = absoluteUrl(
    `/order/${order.id}`,
    order.public_token ? { t: order.public_token } : undefined
  );
  const receiptUrl = absoluteUrl(
    `/api/orders/${order.id}/slip`,
    order.public_token ? { t: order.public_token } : undefined
  );
  const siteHost = getSiteHost();
  const defaultFrom = process.env.EMAIL_FROM || `orders@${siteHost}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmed | ${siteConfig.name}</title>
      </head>
      <body style="background-color: #050505; color: #F2F0EA; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #111214; border: 1px solid #22262E; padding: 30px; border-radius: 4px;">
          <div style="border-bottom: 2px solid #B8FF1F; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="color: #F2F0EA; font-size: 28px; letter-spacing: 2px; margin: 0; text-transform: uppercase;">${siteConfig.name}</h1>
            <p style="color: #B8FF1F; font-size: 12px; margin: 4px 0 0; text-transform: uppercase; font-family: monospace;">${siteConfig.tagline}</p>
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

          <!-- Download Receipt Action -->
          <div style="text-align: center; margin: 28px 0; padding: 20px; background-color: #050505; border: 1px solid #22262E; border-radius: 4px;">
            <a href="${receiptUrl}"
               style="background-color: #B8FF1F; color: #050505; font-family: monospace; font-size: 13px; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 2px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
              Download Official Receipt (PDF) &rarr;
            </a>
            <p style="margin: 10px 0 0; font-size: 11px; color: #8E959F; font-family: monospace;">
              Live order tracking: <a href="${trackingUrl}" style="color: #B8FF1F; text-decoration: underline;">${siteHost}/order/${order.order_number}</a>
            </p>
            ${
              getBusinessContact().isConfigured
                ? `<p style="margin: 12px 0 0; font-size: 11px; color: #8E959F; font-family: monospace;">
                    Questions about your order? <a href="${getBusinessContact().waLink(`Hello CLAWCRAFT, question regarding order ${order.order_number}`)}" style="color: #B8FF1F; text-decoration: underline;">WhatsApp: ${getBusinessContact().display}</a>
                  </p>`
                : ""
            }
          </div>

          <div style="padding-top: 16px; border-top: 1px solid #22262E; font-size: 11px; color: #8E959F; line-height: 1.5;">
            <p style="margin: 0 0 8px;">
              <strong>DISCLAIMER:</strong> ${siteConfig.disclaimer}
            </p>
            <p style="margin: 0 0 8px;">
              <strong>NOTICE:</strong> ${siteConfig.productSafetyNotice}
            </p>
            <p style="margin: 8px 0 0; color: #666; font-family: monospace;">
              ${siteConfig.longName} • ${siteHost}
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    return await resend.emails.send({
      from: defaultFrom,
      to: order.customer_email,
      subject: `Order Confirmed: ${order.order_number} | ${siteConfig.longName}`,
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
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) {
    console.log(`[Email] No ADMIN_NOTIFICATION_EMAIL configured; skipping alert for order ${order.order_number}`);
    return { success: true, skipped: true };
  }

  const siteHost = getSiteHost();
  const defaultFrom = process.env.EMAIL_FROM || `orders@${siteHost}`;

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes("placeholder")) {
    console.log(`[Email Mock] Admin alert sent to ${adminEmail} for order ${order.order_number}`);
    return { success: true, mock: true };
  }

  const itemsSummary = items
    .map(
      (i) =>
        `• ${i.quantity}x ${i.product_title}${
          i.variant_label
            ? ` [${i.variant_label}${i.selected_option ? ` - ${i.selected_option}` : ""}]`
            : ""
        } (${formatINR(i.total_price_paise)})`
    )
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
      from: defaultFrom,
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
 * Send Customer COD Order Placed Notification Email
 */
export async function sendCustomerCodOrderEmail({
  order,
  items,
}: {
  order: Order;
  items: OrderItem[];
}) {
  const siteHost = getSiteHost();
  const defaultFrom = process.env.EMAIL_FROM || `orders@${siteHost}`;

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes("placeholder")) {
    console.log(`[Email Mock] Customer COD confirmation for ${order.customer_email}: ${order.order_number}`);
    return { success: true, mock: true };
  }

  const trackingUrl = order.public_token
    ? `https://${siteHost}/order/${order.id}?t=${order.public_token}`
    : `https://${siteHost}/order/${order.id}`;

  const itemsHtml = items
    .map(
      (i) => `
        <tr style="border-bottom: 1px solid #22262E;">
          <td style="padding: 12px 0; color: #F2F0EA;">
            <strong>${i.product_title}</strong>
            ${i.variant_label ? `<br/><span style="font-size: 11px; color: #8E959F;">Option: ${i.variant_label}${i.selected_option ? ` - ${i.selected_option}` : ""}</span>` : ""}
            <br/><span style="font-size: 11px; color: #8E959F;">Qty: ${i.quantity}</span>
          </td>
          <td style="padding: 12px 0; text-align: right; color: #F2F0EA; font-family: monospace;">
            ${formatINR(i.total_price_paise)}
          </td>
        </tr>
      `
    )
    .join("");

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <body style="background-color: #050505; color: #F2F0EA; font-family: sans-serif; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #111214; border: 1px solid #22262E; border-top: 3px solid #B8FF1F; padding: 28px; border-radius: 4px;">
          <h1 style="color: #F2F0EA; font-size: 22px; text-transform: uppercase; margin-top: 0; letter-spacing: 1.5px;">${siteConfig.name}</h1>
          <p style="color: #B8FF1F; font-family: monospace; font-size: 13px; font-weight: bold; margin-bottom: 8px;">
            COD ORDER RECEIVED • AWAITING PHONE CONFIRMATION
          </p>
          <p style="color: #C9CDD2; font-size: 15px; line-height: 1.6;">
            Hello ${order.customer_name},<br/>
            <strong>COD order received. We will call you to confirm before delivery.</strong>
          </p>

          <div style="background-color: #050505; border: 1px solid #22262E; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #8E959F; font-size: 12px; font-family: monospace;">
              ORDER NUMBER: <strong style="color: #B8FF1F;">${order.order_number}</strong><br/>
              PAYMENT METHOD: <strong style="color: #F2F0EA;">Cash on Delivery (Local Jaipur Delivery)</strong><br/>
              CASH TO PAY UPON ARRIVAL: <strong style="color: #B8FF1F; font-size: 15px;">${formatINR(order.total_paise)}</strong>
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding-top: 14px; color: #8E959F;">Subtotal:</td>
                <td style="padding-top: 14px; text-align: right; color: #F2F0EA; font-family: monospace;">${formatINR(order.subtotal_paise)}</td>
              </tr>
              ${
                order.discount_paise > 0
                  ? `<tr>
                      <td style="padding-top: 6px; color: #B8FF1F;">Discount:</td>
                      <td style="padding-top: 6px; text-align: right; color: #B8FF1F; font-family: monospace;">-${formatINR(order.discount_paise)}</td>
                    </tr>`
                  : ""
              }
              <tr>
                <td style="padding-top: 6px; color: #8E959F;">Shipping:</td>
                <td style="padding-top: 6px; text-align: right; color: #F2F0EA; font-family: monospace;">${order.shipping_fee_paise === 0 ? "FREE" : formatINR(order.shipping_fee_paise)}</td>
              </tr>
              <tr>
                <td style="padding-top: 12px; font-weight: bold; color: #F2F0EA; font-size: 15px;">Amount Due on Delivery:</td>
                <td style="padding-top: 12px; text-align: right; font-weight: bold; color: #B8FF1F; font-family: monospace; font-size: 18px;">${formatINR(order.total_paise)}</td>
              </tr>
            </tfoot>
          </table>

          <div style="background-color: #050505; border: 1px solid #22262E; padding: 14px; border-radius: 4px; margin: 20px 0; font-size: 12px; color: #C9CDD2; line-height: 1.5;">
            <strong style="color: #F2F0EA; text-transform: uppercase;">Delivery Address:</strong><br/>
            ${order.customer_name}<br/>
            ${order.shipping_address_line1}${order.shipping_address_line2 ? `, ${order.shipping_address_line2}` : ""}<br/>
            ${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}<br/>
            Contact Phone: ${order.customer_phone}
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${trackingUrl}" style="background-color: #B8FF1F; color: #050505; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 3px; font-family: monospace; font-size: 13px; display: inline-block;">
              TRACK COD ORDER STATUS &rarr;
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    return await resend.emails.send({
      from: defaultFrom,
      to: order.customer_email,
      subject: `COD Order Received: ${order.order_number} | ${siteConfig.longName}`,
      html: emailHtml,
    });
  } catch (error) {
    console.error("[Resend Error] Customer COD confirmation:", error);
    return { error };
  }
}

/**
 * Send Owner Alert for New COD Order with direct Call and WhatsApp links
 */
export async function sendAdminCodOrderAlertEmail({
  order,
  items,
}: {
  order: Order;
  items: OrderItem[];
}) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) return { success: true, skipped: true };

  const siteHost = getSiteHost();
  const defaultFrom = process.env.EMAIL_FROM || `orders@${siteHost}`;

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes("placeholder")) {
    console.log(`[Email Mock] Admin alert sent for COD order ${order.order_number}`);
    return { success: true, mock: true };
  }

  const cleanPhone = order.customer_phone.replace(/\D/g, "").slice(-10);
  const waLink = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
    `Hello ${order.customer_name}, this is CLAWCRAFT Studio regarding your Cash on Delivery order #${order.order_number} for ${formatINR(order.total_paise)}. We are calling to confirm your address and schedule your personal delivery.`
  )}`;

  const itemsSummary = items
    .map(
      (i) =>
        `• ${i.quantity}x ${i.product_title}${
          i.variant_label
            ? ` [${i.variant_label}${i.selected_option ? ` - ${i.selected_option}` : ""}]`
            : ""
        } (${formatINR(i.total_price_paise)})`
    )
    .join("<br/>");

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <body style="background-color: #050505; color: #F2F0EA; font-family: sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #111214; border: 2px solid #B8FF1F; padding: 24px; border-radius: 4px;">
          <h2 style="color: #B8FF1F; margin-top: 0; font-size: 20px; letter-spacing: 1px;">
            🚨 NEW COD ORDER: ${order.order_number}
          </h2>
          <p style="color: #F2F0EA; font-size: 15px; margin: 8px 0 16px;">
            A customer placed a <strong>Cash on Delivery</strong> order in the Jaipur local delivery zone. Please call the customer to confirm before personal delivery.
          </p>

          <div style="background-color: #050505; border: 1px solid #22262E; padding: 16px; border-radius: 4px; margin: 16px 0; font-family: monospace; font-size: 13px;">
            <p style="margin: 4px 0; color: #8E959F;">CASH TO COLLECT: <strong style="color: #B8FF1F; font-size: 16px;">${formatINR(order.total_paise)}</strong></p>
            <p style="margin: 4px 0; color: #8E959F;">CUSTOMER: <strong style="color: #F2F0EA;">${order.customer_name}</strong></p>
            <p style="margin: 4px 0; color: #8E959F;">PHONE: <strong style="color: #B8FF1F;">${order.customer_phone}</strong></p>
            <p style="margin: 4px 0; color: #8E959F;">EMAIL: <span style="color: #C9CDD2;">${order.customer_email}</span></p>
            <p style="margin: 4px 0; color: #8E959F;">ADDRESS: <span style="color: #F2F0EA;">${order.shipping_address_line1}${order.shipping_address_line2 ? `, ${order.shipping_address_line2}` : ""}, ${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}</span></p>
          </div>

          <div style="margin: 20px 0; display: flex; gap: 12px; flex-wrap: wrap;">
            <a href="tel:${order.customer_phone}" style="background-color: #B8FF1F; color: #050505; padding: 10px 20px; font-weight: bold; text-decoration: none; border-radius: 3px; font-family: monospace; font-size: 13px; display: inline-block;">
              📞 CALL CUSTOMER
            </a>
            <a href="${waLink}" style="background-color: #25D366; color: #FFFFFF; padding: 10px 20px; font-weight: bold; text-decoration: none; border-radius: 3px; font-family: monospace; font-size: 13px; display: inline-block;">
              💬 WHATSAPP CUSTOMER
            </a>
            <a href="https://${siteHost}/admin/orders/${order.id}" style="background-color: #22262E; color: #F2F0EA; border: 1px solid #8E959F; padding: 10px 20px; font-weight: bold; text-decoration: none; border-radius: 3px; font-family: monospace; font-size: 13px; display: inline-block;">
              OPEN IN STUDIO ADMIN &rarr;
            </a>
          </div>

          <h3 style="color: #F2F0EA; font-size: 14px; margin: 20px 0 8px; text-transform: uppercase;">Ordered Sculptures:</h3>
          <p style="color: #C9CDD2; font-size: 13px; line-height: 1.6; margin: 0;">
            ${itemsSummary}
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    return await resend.emails.send({
      from: defaultFrom,
      to: adminEmail,
      subject: `🚨 [COD ORDER] ${order.order_number} (${formatINR(order.total_paise)}) - Action Required`,
      html: emailHtml,
    });
  } catch (error) {
    console.error("[Resend Error] Admin COD alert:", error);
    return { error };
  }
}

/**
 * Send Admin Payment Gateway Error / Configuration Alert Email
 */
export async function sendAdminPaymentAlertEmail({
  subject,
  message,
}: {
  subject: string;
  message: string;
}) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) {
    console.error("[Payment Alert Email] ADMIN_NOTIFICATION_EMAIL is not configured.");
    return { success: false, skipped: true };
  }

  const siteHost = getSiteHost();
  const defaultFrom = process.env.EMAIL_FROM || `orders@${siteHost}`;

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes("placeholder")) {
    console.log(`[Email Mock] Admin Payment Alert: ${subject} -> ${message}`);
    return { success: true, mock: true };
  }

  const emailHtml = `
    <h2>⚠️ CLAWCRAFT STUDIO — Payment System Alert</h2>
    <p><strong>Host:</strong> ${siteHost}</p>
    <p><strong>Environment:</strong> ${process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown"}</p>
    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    <hr style="border: 0; border-top: 1px solid #ddd; margin: 16px 0;" />
    <p style="font-size: 14px; font-family: monospace; color: #b00020; background: #fff1f0; padding: 12px; border-radius: 4px;">
      ${message}
    </p>
    <p style="font-size: 12px; color: #666;">
      Please check your Vercel Environment Variables and Razorpay Dashboard immediately.
    </p>
  `;

  try {
    return await resend.emails.send({
      from: defaultFrom,
      to: adminEmail,
      subject: `⚠️ [CLAWCRAFT Alert] ${subject}`,
      html: emailHtml,
    });
  } catch (error) {
    console.error("[Resend Error] Payment system alert email:", error);
    return { error };
  }
}

/**
 * Send Admin Login Success Notification Email
 */
export async function sendAdminLoginSuccessEmail({
  adminEmail,
  istTime,
  ip,
  userAgent,
}: {
  adminEmail: string;
  istTime: string;
  ip: string;
  userAgent?: string;
}) {
  const notifyEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!notifyEmail) return { success: false, skipped: true };

  const siteHost = getSiteHost();
  const defaultFrom = process.env.EMAIL_FROM || `security@${siteHost}`;

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes("placeholder")) {
    console.log(`[Email Mock] Admin Login Success: ${adminEmail} at ${istTime} from ${ip}`);
    return { success: true, mock: true };
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <body style="background-color: #050505; color: #F2F0EA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #111214; border: 1px solid #22262E; border-top: 3px solid #B8FF1F; padding: 28px; border-radius: 4px;">
          <h2 style="color: #F2F0EA; font-size: 20px; margin-top: 0; letter-spacing: 1px;">🛡️ Studio Admin Login Notification</h2>
          <p style="color: #C9CDD2; font-size: 14px; line-height: 1.6;">
            A verified administrator session was established for the CLAWCRAFT Studio control panel.
          </p>
          <div style="background-color: #050505; border: 1px solid #22262E; padding: 16px; margin: 20px 0; border-radius: 4px; font-family: monospace; font-size: 13px;">
            <p style="margin: 4px 0; color: #8E959F;">ADMIN ACCOUNT: <strong style="color: #B8FF1F;">${adminEmail}</strong></p>
            <p style="margin: 4px 0; color: #8E959F;">TIMESTAMP: <strong style="color: #F2F0EA;">${istTime}</strong></p>
            <p style="margin: 4px 0; color: #8E959F;">IP ADDRESS: <strong style="color: #F2F0EA;">${ip}</strong></p>
            <p style="margin: 4px 0; color: #8E959F;">CLIENT: <span style="color: #C9CDD2;">${userAgent || "Browser Client"}</span></p>
          </div>
          <p style="font-size: 12px; color: #8E959F; margin-top: 20px; line-height: 1.5;">
            If you did not authorize this session, immediately change your Supabase administrator password and review active sessions.
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    return await resend.emails.send({
      from: defaultFrom,
      to: notifyEmail,
      subject: `🛡️ [CLAWCRAFT] Admin Login: ${adminEmail} (${ip})`,
      html: emailHtml,
    });
  } catch (error) {
    console.error("[Resend Error] Admin login success email:", error);
    return { error };
  }
}

/**
 * Send Admin Login Lockout Security Alert Email (5+ Failed Attempts)
 */
export async function sendAdminLoginLockoutAlertEmail({
  ip,
  attempts,
  istTime,
  attemptedEmail,
}: {
  ip: string;
  attempts: number;
  istTime: string;
  attemptedEmail?: string;
}) {
  const notifyEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!notifyEmail) return { success: false, skipped: true };

  const siteHost = getSiteHost();
  const defaultFrom = process.env.EMAIL_FROM || `security@${siteHost}`;

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes("placeholder")) {
    console.log(`[Email Mock] Security Lockout Alert: ${attempts} failed attempts from ${ip} at ${istTime}`);
    return { success: true, mock: true };
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <body style="background-color: #050505; color: #F2F0EA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #111214; border: 1px solid #ff4d4f; border-top: 4px solid #ff4d4f; padding: 28px; border-radius: 4px;">
          <h2 style="color: #ff4d4f; font-size: 20px; margin-top: 0; letter-spacing: 1px;">🚨 SECURITY ALERT: Repeated Failed Admin Logins</h2>
          <p style="color: #C9CDD2; font-size: 14px; line-height: 1.6;">
            A client reached <strong>${attempts} consecutive failed login attempts</strong> against the studio control portal. A temporary 15-minute rate-limit lockout has been enforced.
          </p>
          <div style="background-color: #050505; border: 1px solid #22262E; padding: 16px; margin: 20px 0; border-radius: 4px; font-family: monospace; font-size: 13px;">
            <p style="margin: 4px 0; color: #8E959F;">CLIENT IP: <strong style="color: #ff4d4f;">${ip}</strong></p>
            <p style="margin: 4px 0; color: #8E959F;">ATTEMPTS: <strong style="color: #F2F0EA;">${attempts} failed attempts</strong></p>
            <p style="margin: 4px 0; color: #8E959F;">TIME (IST): <strong style="color: #F2F0EA;">${istTime}</strong></p>
            ${attemptedEmail ? `<p style="margin: 4px 0; color: #8E959F;">TARGET EMAIL: <span style="color: #C9CDD2;">${attemptedEmail}</span></p>` : ""}
            <p style="margin: 4px 0; color: #8E959F;">ACTION TAKEN: <strong style="color: #B8FF1F;">15-Minute IP Lockout Active</strong></p>
          </div>
          <p style="font-size: 12px; color: #8E959F; margin-top: 20px; line-height: 1.5;">
            Our server-side guards have automatically blocked further attempts. No sensitive administrator access was granted.
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    return await resend.emails.send({
      from: defaultFrom,
      to: notifyEmail,
      subject: `🚨 [SECURITY ALERT] 5+ Failed Admin Login Attempts (${ip})`,
      html: emailHtml,
    });
  } catch (error) {
    console.error("[Resend Error] Admin lockout alert email:", error);
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
  const siteHost = getSiteHost();
  const defaultFrom = process.env.EMAIL_FROM || `orders@${siteHost}`;

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
          <h1 style="color: #F2F0EA; font-size: 24px; letter-spacing: 2px; margin-top: 0; text-transform: uppercase;">${siteConfig.name}</h1>
          <p style="color: #B8FF1F; font-size: 14px; font-family: monospace;">YOUR RELIC HAS BEEN DISPATCHED</p>
          <p style="color: #C9CDD2; font-size: 15px; line-height: 1.6;">
            Hello ${order.customer_name}, your handcrafted can sculpture for order <strong>${order.order_number}</strong> has shipped in rigid protective armor packaging.
          </p>
          <div style="background-color: #050505; border: 1px solid #22262E; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 4px 0; color: #8E959F; font-size: 13px;">COURIER: <strong style="color: #F2F0EA;">${courierName}</strong></p>
            <p style="margin: 4px 0; color: #8E959F; font-size: 13px;">TRACKING / AWB: <strong style="color: #B8FF1F; font-family: monospace;">${trackingNumber}</strong></p>
          </div>
          ${trackingLinkHtml}
          ${
            getBusinessContact().isConfigured
              ? `<p style="margin: 16px 0 0; font-size: 12px; color: #8E959F; font-family: monospace;">
                  Need assistance with delivery? <a href="${getBusinessContact().waLink(`Delivery inquiry for order ${order.order_number}`)}" style="color: #B8FF1F; text-decoration: underline;">WhatsApp: ${getBusinessContact().display}</a>
                </p>`
              : ""
          }
          <div style="margin-top: 30px; border-top: 1px solid #22262E; padding-top: 16px; font-size: 11px; color: #8E959F; line-height: 1.5;">
            <p style="margin: 0 0 8px;">
              ${siteConfig.productSafetyNotice}
            </p>
            <p style="margin: 8px 0 0; color: #666; font-family: monospace;">
              ${siteConfig.longName} • ${siteHost}
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    return await resend.emails.send({
      from: defaultFrom,
      to: order.customer_email,
      subject: `Dispatched: Order ${order.order_number} is on the way | ${siteConfig.longName}`,
      html: emailHtml,
    });
  } catch (error) {
    console.error("[Resend Error] Shipping update:", error);
    return { error };
  }
}
