import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import { Order, OrderItem } from "@/types/shop";
import { generateOrderVerifySignature } from "@/lib/orders/order-crypto";

export interface BuildSlipOptions {
  watermarkText?: string;
  businessAddress?: string;
  gstin?: string;
  siteUrl?: string;
  isDemo?: boolean;
}

/**
 * Format timestamp in Indian Standard Time (IST - Asia/Kolkata)
 */
export function formatISTDate(isoString?: string | null): string {
  if (!isoString) return "N/A";
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return isoString;
  }
}

/**
 * Format Paise into Indian Rupee string (e.g. ₹ 1,299 or Rs 1,299)
 */
export function formatSlipRupees(paise: number): string {
  const rupees = paise / 100;
  return `Rs ${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Load TTF font bytes in both Node.js serverless and browser environments
 */
async function loadFontBytes(filename: string): Promise<Uint8Array> {
  if (typeof window === "undefined") {
    // Node.js environment
    const fs = await import("fs");
    const path = await import("path");
    const fontPath = path.join(process.cwd(), "public", "fonts", filename);
    return fs.readFileSync(fontPath);
  } else {
    // Browser environment
    const response = await fetch(`/fonts/${filename}`);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }
}

/**
 * Draw diagonal repeating watermark on a page
 */
function drawWatermark(
  page: any,
  font: any,
  watermarkText: string,
  width: number,
  height: number
) {
  const text = watermarkText.toUpperCase();
  const textWidth = font.widthOfTextAtSize(text, 16);
  const stepX = Math.max(160, textWidth + 40);
  const stepY = 110;

  for (let x = -80; x < width + 150; x += stepX) {
    for (let y = -60; y < height + 100; y += stepY) {
      page.drawText(text, {
        x,
        y,
        size: 14,
        font,
        color: rgb(0.65, 0.65, 0.65),
        opacity: 0.08,
        rotate: degrees(-35),
      });
    }
  }
}

/**
 * Core Universal PDF Builder for Order Receipts / Payment Slips
 */
export async function buildSlipPdf(
  order: Order,
  options?: BuildSlipOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Load custom TrueType fonts with Indian Rupee support
  let fontRegular: any;
  let fontBold: any;

  try {
    const regularBytes = await loadFontBytes("NotoSans-Regular.ttf");
    const boldBytes = await loadFontBytes("NotoSans-Bold.ttf");
    fontRegular = await pdfDoc.embedFont(regularBytes);
    fontBold = await pdfDoc.embedFont(boldBytes);
  } catch (err) {
    console.warn("[PDF Font Load Fallback to StandardFonts]:", err);
    fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  const pageWidth = 595.28; // A4 standard pt
  const pageHeight = 841.89;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  const watermarkText = options?.watermarkText || "CLAWCRAFT STUDIO";
  const siteUrl = options?.siteUrl || "https://clawcraft.in";
  const isDemo = Boolean(order.isDemo || options?.isDemo || order.id?.startsWith("demo-"));
  const isPaid = (order.payment_status === "paid" || order.status === "paid") && !isDemo;

  let pageNumber = 1;
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);

  // Initial Watermark
  drawWatermark(currentPage, fontBold, watermarkText, pageWidth, pageHeight);

  let currentY = pageHeight - margin;

  // Helper to add page when space runs out
  const checkPageOverflow = (requiredHeight: number) => {
    if (currentY - requiredHeight < margin + 60) {
      pageNumber++;
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      drawWatermark(currentPage, fontBold, watermarkText, pageWidth, pageHeight);

      // Top running header on continuation pages
      currentPage.drawText("CLAWCRAFT STUDIO — ORDER RECEIPT (CONTINUED)", {
        x: margin,
        y: pageHeight - margin + 10,
        size: 9,
        font: fontBold,
        color: rgb(0.3, 0.3, 0.3),
      });

      currentPage.drawText(`Order Reference: ${order.order_number} • Page ${pageNumber}`, {
        x: pageWidth - margin - 200,
        y: pageHeight - margin + 10,
        size: 8,
        font: fontRegular,
        color: rgb(0.4, 0.4, 0.4),
      });

      currentPage.drawLine({
        start: { x: margin, y: pageHeight - margin + 4 },
        end: { x: pageWidth - margin, y: pageHeight - margin + 4 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });

      currentY = pageHeight - margin - 20;
    }
  };

  // 1. BRAND HEADER & TITLE
  currentPage.drawText("CLAWCRAFT", {
    x: margin,
    y: currentY - 14,
    size: 26,
    font: fontBold,
    color: rgb(0.05, 0.05, 0.05),
  });

  currentPage.drawText("EMPTY CANS. FULL ATTITUDE.", {
    x: margin,
    y: currentY - 26,
    size: 8,
    font: fontBold,
    color: rgb(0.45, 0.45, 0.45),
  });

  currentPage.drawText("Independent Indian Art Studio • Handcrafted Can Art", {
    x: margin,
    y: currentY - 37,
    size: 8,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Studio contacts on the right
  const contactX = pageWidth - margin - 170;
  currentPage.drawText("Web: clawcraft.in", {
    x: contactX,
    y: currentY - 12,
    size: 8,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });
  currentPage.drawText("Email: studio@clawcraft.in", {
    x: contactX,
    y: currentY - 23,
    size: 8,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });
  currentPage.drawText("WhatsApp: +91 919876543210", {
    x: contactX,
    y: currentY - 34,
    size: 8,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  if (options?.gstin) {
    currentPage.drawText(`GSTIN: ${options.gstin}`, {
      x: contactX,
      y: currentY - 45,
      size: 8,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
  }

  currentY -= 55;

  // Divider Line
  currentPage.drawLine({
    start: { x: margin, y: currentY },
    end: { x: pageWidth - margin, y: currentY },
    thickness: 1.5,
    color: rgb(0.1, 0.1, 0.1),
  });

  currentY -= 18;

  // Document Title Banner & Status Stamp
  const docTitle = isPaid
    ? "OFFICIAL ORDER RECEIPT & PAYMENT SLIP"
    : order.payment_method === "cod"
    ? "ORDER CONFIRMATION (PAYMENT ON DELIVERY)"
    : "ORDER SUMMARY & PAYMENT NOTICE";

  currentPage.drawText(docTitle, {
    x: margin,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Stamp Box on Right
  let stampText = "PAID";
  let stampBorderColor = rgb(0.15, 0.55, 0.2); // Green
  let stampTextColor = rgb(0.15, 0.55, 0.2);

  if (isDemo) {
    stampText = "DEMO - NOT A REAL PAYMENT";
    stampBorderColor = rgb(0.8, 0.4, 0.0); // Amber
    stampTextColor = rgb(0.8, 0.4, 0.0);
  } else if (!isPaid) {
    if (order.payment_method === "cod") {
      stampText = "PAYMENT DUE ON DELIVERY";
      stampBorderColor = rgb(0.2, 0.3, 0.6); // Blue
      stampTextColor = rgb(0.2, 0.3, 0.6);
    } else {
      stampText = "PAYMENT PENDING";
      stampBorderColor = rgb(0.7, 0.2, 0.2); // Red
      stampTextColor = rgb(0.7, 0.2, 0.2);
    }
  }

  const stampWidth = fontBold.widthOfTextAtSize(stampText, 9) + 16;
  const stampBoxX = pageWidth - margin - stampWidth;
  currentPage.drawRectangle({
    x: stampBoxX,
    y: currentY - 4,
    width: stampWidth,
    height: 18,
    borderColor: stampBorderColor,
    borderWidth: 1.2,
    color: rgb(1, 1, 1),
  });
  currentPage.drawText(stampText, {
    x: stampBoxX + 8,
    y: currentY + 1,
    size: 9,
    font: fontBold,
    color: stampTextColor,
  });

  currentY -= 22;

  // 2. ORDER META & CUSTOMER DETAILS (2-Column Grid)
  const colW = (contentWidth - 20) / 2;
  const col1X = margin;
  const col2X = margin + colW + 20;

  // Left Column: Order Information
  currentPage.drawRectangle({
    x: col1X,
    y: currentY - 95,
    width: colW,
    height: 95,
    color: rgb(0.97, 0.97, 0.97),
    borderColor: rgb(0.88, 0.88, 0.88),
    borderWidth: 0.75,
  });

  currentPage.drawText("ORDER INFORMATION", {
    x: col1X + 10,
    y: currentY - 14,
    size: 8.5,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  const rowH = 13;
  let oY = currentY - 30;

  const drawInfoRow = (x: number, y: number, label: string, val: string, boldVal = false) => {
    currentPage.drawText(label, { x, y, size: 8, font: fontRegular, color: rgb(0.45, 0.45, 0.45) });
    currentPage.drawText(val, {
      x: x + 90,
      y,
      size: 8,
      font: boldVal ? fontBold : fontRegular,
      color: rgb(0.1, 0.1, 0.1),
    });
  };

  drawInfoRow(col1X + 10, oY, "Order Reference:", order.order_number, true);
  oY -= rowH;
  drawInfoRow(col1X + 10, oY, "Order Date (IST):", formatISTDate(order.created_at));
  oY -= rowH;
  drawInfoRow(
    col1X + 10,
    oY,
    "Payment Status:",
    isDemo ? "DEMO (No Charge)" : order.payment_status?.toUpperCase() || order.status.toUpperCase(),
    true
  );
  oY -= rowH;
  drawInfoRow(col1X + 10, oY, "Payment Method:", (order.payment_method || "RAZORPAY").toUpperCase());
  oY -= rowH;
  if (order.razorpay_payment_id) {
    drawInfoRow(col1X + 10, oY, "Transaction ID:", order.razorpay_payment_id);
  } else {
    drawInfoRow(col1X + 10, oY, "Fulfillment:", order.status.toUpperCase());
  }

  // Right Column: Delivery Destination
  currentPage.drawRectangle({
    x: col2X,
    y: currentY - 95,
    width: colW,
    height: 95,
    color: rgb(0.97, 0.97, 0.97),
    borderColor: rgb(0.88, 0.88, 0.88),
    borderWidth: 0.75,
  });

  currentPage.drawText("DELIVERY DESTINATION", {
    x: col2X + 10,
    y: currentY - 14,
    size: 8.5,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  let dY = currentY - 30;
  currentPage.drawText(order.customer_name, {
    x: col2X + 10,
    y: dY,
    size: 8.5,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  dY -= rowH;

  const addr1 = order.shipping_address_line1 || "";
  const addr2 = order.shipping_address_line2 ? `, ${order.shipping_address_line2}` : "";
  currentPage.drawText(`${addr1}${addr2}`.substring(0, 42), {
    x: col2X + 10,
    y: dY,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });
  dY -= rowH;

  currentPage.drawText(
    `${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}`,
    {
      x: col2X + 10,
      y: dY,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    }
  );
  dY -= rowH;

  currentPage.drawText(`Phone: ${order.customer_phone} • Email: ${order.customer_email}`, {
    x: col2X + 10,
    y: dY,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });

  currentY -= 110;

  // Optional Courier & Tracking bar if present
  const trackingNumber = order.tracking_id || order.tracking_number;
  if (order.courier_name && trackingNumber) {
    currentPage.drawRectangle({
      x: margin,
      y: currentY - 24,
      width: contentWidth,
      height: 24,
      color: rgb(0.94, 0.96, 0.98),
      borderColor: rgb(0.8, 0.85, 0.9),
      borderWidth: 0.75,
    });
    currentPage.drawText(
      `DISPATCH COURIER: ${order.courier_name.toUpperCase()}   •   AWB / TRACKING ID: ${trackingNumber}`,
      {
        x: margin + 12,
        y: currentY - 15,
        size: 8,
        font: fontBold,
        color: rgb(0.1, 0.2, 0.4),
      }
    );
    currentY -= 34;
  }

  // 3. ITEMS TABLE
  checkPageOverflow(80);

  const drawTableHeader = (y: number) => {
    currentPage.drawRectangle({
      x: margin,
      y: y - 18,
      width: contentWidth,
      height: 18,
      color: rgb(0.1, 0.1, 0.1),
    });

    currentPage.drawText("ITEM / SCULPTURE", {
      x: margin + 8,
      y: y - 12,
      size: 8,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    currentPage.drawText("VARIANT / SPEC", {
      x: margin + 230,
      y: y - 12,
      size: 8,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    currentPage.drawText("QTY", {
      x: margin + 355,
      y: y - 12,
      size: 8,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    currentPage.drawText("UNIT PRICE", {
      x: margin + 400,
      y: y - 12,
      size: 8,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    currentPage.drawText("TOTAL", {
      x: pageWidth - margin - 55,
      y: y - 12,
      size: 8,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
  };

  drawTableHeader(currentY);
  currentY -= 20;

  const items = order.items || [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    checkPageOverflow(26);

    const isEven = i % 2 === 0;
    if (isEven) {
      currentPage.drawRectangle({
        x: margin,
        y: currentY - 20,
        width: contentWidth,
        height: 20,
        color: rgb(0.98, 0.98, 0.98),
      });
    }

    currentPage.drawLine({
      start: { x: margin, y: currentY - 20 },
      end: { x: pageWidth - margin, y: currentY - 20 },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    });

    // Item title
    currentPage.drawText((item.product_title || "Can Sculpture").substring(0, 36), {
      x: margin + 8,
      y: currentY - 14,
      size: 8,
      font: fontBold,
      color: rgb(0.15, 0.15, 0.15),
    });

    // Variant
    const variantStr = [item.variant_label, item.selected_option].filter(Boolean).join(" • ") || "Standard";
    currentPage.drawText(variantStr.substring(0, 24), {
      x: margin + 230,
      y: currentY - 14,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Qty
    currentPage.drawText(String(item.quantity), {
      x: margin + 365,
      y: currentY - 14,
      size: 8,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Unit Price
    currentPage.drawText(formatSlipRupees(item.unit_price_paise), {
      x: margin + 400,
      y: currentY - 14,
      size: 8,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Total Price
    const lineTotalStr = formatSlipRupees(item.total_price_paise);
    currentPage.drawText(lineTotalStr, {
      x: pageWidth - margin - 55,
      y: currentY - 14,
      size: 8,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    currentY -= 20;
  }

  currentY -= 15;

  // 4. FINANCIAL TOTALS BLOCK & QR VERIFICATION CODE
  checkPageOverflow(130);

  const totalsBoxWidth = 220;
  const totalsBoxX = pageWidth - margin - totalsBoxWidth;

  currentPage.drawRectangle({
    x: totalsBoxX,
    y: currentY - 80,
    width: totalsBoxWidth,
    height: 80,
    color: rgb(0.97, 0.97, 0.97),
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 0.75,
  });

  const drawTotalLine = (y: number, label: string, val: string, isGrand = false) => {
    currentPage.drawText(label, {
      x: totalsBoxX + 12,
      y,
      size: isGrand ? 9 : 8,
      font: isGrand ? fontBold : fontRegular,
      color: isGrand ? rgb(0.05, 0.05, 0.05) : rgb(0.4, 0.4, 0.4),
    });

    currentPage.drawText(val, {
      x: pageWidth - margin - 12 - fontBold.widthOfTextAtSize(val, isGrand ? 10 : 8),
      y,
      size: isGrand ? 10 : 8,
      font: fontBold,
      color: isGrand ? rgb(0.1, 0.1, 0.1) : rgb(0.2, 0.2, 0.2),
    });
  };

  let tY = currentY - 16;
  drawTotalLine(tY, "Subtotal:", formatSlipRupees(order.subtotal_paise));
  tY -= 14;

  if (order.discount_paise > 0) {
    drawTotalLine(tY, "Coupon Discount:", `-${formatSlipRupees(order.discount_paise)}`);
    tY -= 14;
  }

  drawTotalLine(
    tY,
    "Pan-India Shipping:",
    order.shipping_fee_paise === 0 ? "FREE" : formatSlipRupees(order.shipping_fee_paise)
  );
  tY -= 16;

  currentPage.drawLine({
    start: { x: totalsBoxX + 10, y: tY + 4 },
    end: { x: pageWidth - margin - 10, y: tY + 4 },
    thickness: 1,
    color: rgb(0.2, 0.2, 0.2),
  });

  drawTotalLine(tY - 5, "TOTAL AMOUNT:", formatSlipRupees(order.total_paise), true);

  // Generate QR Verification Code on Left Side of Totals
  try {
    const signature = generateOrderVerifySignature(order.order_number, order.total_paise);
    const verifyUrl = `${siteUrl}/verify/${encodeURIComponent(order.order_number)}?s=${signature}`;
    const qrBuffer = await QRCode.toBuffer(verifyUrl, {
      margin: 1,
      width: 76,
      errorCorrectionLevel: "M",
    });
    const qrImage = await pdfDoc.embedPng(qrBuffer);

    currentPage.drawImage(qrImage, {
      x: margin,
      y: currentY - 78,
      width: 68,
      height: 68,
    });

    currentPage.drawText("SCAN TO VERIFY SLIP AUTHENTICITY", {
      x: margin + 78,
      y: currentY - 24,
      size: 7.5,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    currentPage.drawText("Scan this QR code to confirm that this order was logged", {
      x: margin + 78,
      y: currentY - 36,
      size: 7,
      font: fontRegular,
      color: rgb(0.45, 0.45, 0.45),
    });

    currentPage.drawText(`and verified in CLAWCRAFT studio records.`, {
      x: margin + 78,
      y: currentY - 46,
      size: 7,
      font: fontRegular,
      color: rgb(0.45, 0.45, 0.45),
    });

    currentPage.drawText(`Verify URL: ${siteUrl}/verify/${order.order_number}`, {
      x: margin + 78,
      y: currentY - 58,
      size: 6.5,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });
  } catch (qrErr) {
    console.warn("[PDF QR Embed Warning]:", qrErr);
  }

  currentY -= 105;

  // 5. MANDATORY FOOTER DISCLAIMERS
  checkPageOverflow(60);

  currentPage.drawLine({
    start: { x: margin, y: currentY },
    end: { x: pageWidth - margin, y: currentY },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });

  currentY -= 14;

  currentPage.drawText("Computer-generated receipt. This is not a GST tax invoice unless a GSTIN is shown above.", {
    x: margin,
    y: currentY,
    size: 7,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });

  currentY -= 11;
  currentPage.drawText(
    "CLAWCRAFT is an independent art studio. Not affiliated with, sponsored by or endorsed by any beverage brand. Products are handcrafted art made from empty, recycled cans.",
    {
      x: margin,
      y: currentY,
      size: 6.5,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    }
  );

  currentY -= 11;
  currentPage.drawText(
    `Studio Terms & Refund Policy: ${siteUrl}/policies/refund-cancellation   •   Document generated: ${formatISTDate(
      new Date().toISOString()
    )} (IST)`,
    {
      x: margin,
      y: currentY,
      size: 6.5,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    }
  );

  return await pdfDoc.save();
}
