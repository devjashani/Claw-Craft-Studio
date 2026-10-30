import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import { Order, OrderItem } from "@/types/shop";
import { generateOrderVerifySignature } from "@/lib/orders/order-crypto";
import { getBusinessContact } from "@/lib/contact";
import { siteConfig, getSiteUrl, getSiteHost } from "@/lib/site";

export interface BuildSlipOptions {
  watermarkText?: string;
  businessAddress?: string;
  gstin?: string;
  siteUrl?: string;
  whatsappNumber?: string;
  supportEmail?: string;
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
 * Format Paise into Indian Rupee string (e.g. Rs 1,299)
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

// Cyberpunk Dark Theme Color Tokens
const COLOR_BG = rgb(10 / 255, 10 / 255, 10 / 255);             // Deep Black #0a0a0a
const COLOR_SURFACE = rgb(18 / 255, 18 / 255, 18 / 255);        // Dark Grey Surface #121212
const COLOR_SURFACE_ALT = rgb(26 / 255, 26 / 255, 26 / 255);    // Table Header #1a1a1a
const COLOR_ROW_EVEN = rgb(16 / 255, 16 / 255, 16 / 255);       // Row Even #101010
const COLOR_ROW_ODD = rgb(10 / 255, 10 / 255, 10 / 255);        // Row Odd #0a0a0a
const COLOR_BORDER = rgb(38 / 255, 38 / 255, 38 / 255);         // Subtle Border #262626
const COLOR_NEON = rgb(57 / 255, 255 / 255, 20 / 255);          // Neon Green #39FF14
const COLOR_NEON_ACID = rgb(184 / 255, 255 / 255, 31 / 255);    // Acid Lime #B8FF1F
const COLOR_TEXT_PRIMARY = rgb(242 / 255, 242 / 255, 242 / 255); // Off-White #f2f2f2
const COLOR_TEXT_MUTED = rgb(160 / 255, 160 / 255, 160 / 255);  // Silver / Light Grey #a0a0a0
const COLOR_TEXT_DIM = rgb(105 / 255, 105 / 255, 105 / 255);    // Dark Muted Grey #696969
const COLOR_AMBER = rgb(255 / 255, 184 / 255, 0 / 255);         // Amber Warning #FFB800
const COLOR_RED = rgb(239 / 255, 68 / 255, 68 / 255);           // Red #ef4444
const COLOR_WHITE = rgb(1, 1, 1);

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
  const textWidth = font.widthOfTextAtSize(text, 14);
  const stepX = Math.max(160, textWidth + 40);
  const stepY = 110;

  for (let x = -80; x < width + 150; x += stepX) {
    for (let y = -60; y < height + 100; y += stepY) {
      page.drawText(text, {
        x,
        y,
        size: 13,
        font,
        color: COLOR_NEON,
        opacity: 0.025,
        rotate: degrees(-35),
      });
    }
  }
}

/**
 * Core Universal PDF Builder for Order Receipts / Payment Slips
 * Redesigned with premium dark cyberpunk aesthetic (Deep Black, Neon Green #39FF14, Silver/Grey)
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

  const watermarkText = options?.watermarkText || `${siteConfig.name} STUDIO`;
  const siteUrl = options?.siteUrl || getSiteUrl();
  const isDemo = Boolean(order.isDemo || options?.isDemo || order.id?.startsWith("demo-"));
  const isCod = order.payment_method === "cod";
  const isCodCollected =
    isCod && (order.payment_status === "cod_collected" || Boolean((order as any).cod_collected_at));
  const isOnlinePaid =
    (order.payment_status === "paid" || order.status === "paid") && !isDemo && !isCod;
  const isFullyPaid = isOnlinePaid || isCodCollected;

  let pageNumber = 1;
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);

  // Deep Black Background
  currentPage.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: COLOR_BG,
  });

  // Cyberpunk Subtle Watermark
  drawWatermark(currentPage, fontBold, watermarkText, pageWidth, pageHeight);

  let currentY = pageHeight - margin;

  // Helper to add continuation page when space runs out
  const checkPageOverflow = (requiredHeight: number) => {
    if (currentY - requiredHeight < margin + 60) {
      pageNumber++;
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);

      // Deep Black Background on continuation page
      currentPage.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: COLOR_BG,
      });

      drawWatermark(currentPage, fontBold, watermarkText, pageWidth, pageHeight);

      // Top running header on continuation pages
      currentPage.drawText("CLAWCRAFT STUDIO — OFFICIAL RECEIPT (CONTINUED)", {
        x: margin,
        y: pageHeight - margin + 10,
        size: 9,
        font: fontBold,
        color: COLOR_NEON,
      });

      currentPage.drawText(`Order Reference: ${order.order_number} • Page ${pageNumber}`, {
        x: pageWidth - margin - 200,
        y: pageHeight - margin + 10,
        size: 8,
        font: fontRegular,
        color: COLOR_TEXT_MUTED,
      });

      currentPage.drawLine({
        start: { x: margin, y: pageHeight - margin + 4 },
        end: { x: pageWidth - margin, y: pageHeight - margin + 4 },
        thickness: 1,
        color: COLOR_NEON,
      });

      currentY = pageHeight - margin - 20;
    }
  };

  // ==============================================================================
  // 1. HEADER (Top Left: "CLAWCRAFT STUDIO", Top Right: "OFFICIAL RECEIPT" in Neon)
  // ==============================================================================
  currentPage.drawText("CLAWCRAFT STUDIO", {
    x: margin,
    y: currentY - 14,
    size: 20,
    font: fontBold,
    color: COLOR_TEXT_PRIMARY,
  });

  currentPage.drawText("EMPTY CANS. FULL ATTITUDE. • HANDCRAFTED ART", {
    x: margin,
    y: currentY - 26,
    size: 7.5,
    font: fontBold,
    color: COLOR_NEON_ACID,
  });

  currentPage.drawText("Independent Handmade Art Studio • Jaipur, Rajasthan", {
    x: margin,
    y: currentY - 37,
    size: 7,
    font: fontRegular,
    color: COLOR_TEXT_MUTED,
  });

  // Top Right: "OFFICIAL RECEIPT" in Neon Green
  const receiptTitle = "OFFICIAL RECEIPT";
  const receiptTitleWidth = fontBold.widthOfTextAtSize(receiptTitle, 14);
  const contactRightX = pageWidth - margin;

  currentPage.drawText(receiptTitle, {
    x: contactRightX - receiptTitleWidth,
    y: currentY - 14,
    size: 14,
    font: fontBold,
    color: COLOR_NEON,
  });

  // Studio contacts under OFFICIAL RECEIPT (right-aligned)
  let contactOffset = 26;
  const drawContactRight = (text: string, bold = false) => {
    const w = (bold ? fontBold : fontRegular).widthOfTextAtSize(text, 7.5);
    currentPage.drawText(text, {
      x: contactRightX - w,
      y: currentY - contactOffset,
      size: 7.5,
      font: bold ? fontBold : fontRegular,
      color: bold ? COLOR_TEXT_PRIMARY : COLOR_TEXT_MUTED,
    });
    contactOffset += 10;
  };

  drawContactRight(getSiteHost() || "clawcraftstudio.in");

  const supportEmail =
    options?.supportEmail || process.env.NEXT_PUBLIC_STUDIO_EMAIL || "support@clawcraftstudio.in";
  drawContactRight(supportEmail);

  const contact = getBusinessContact(options?.whatsappNumber);
  if (contact.isConfigured) {
    drawContactRight(`WhatsApp: ${contact.display}`);
  }

  if (options?.gstin) {
    drawContactRight(`GSTIN: ${options.gstin}`, true);
  }

  currentY -= Math.max(54, contactOffset + 4);

  // Subtle Green Underline Separating the Header
  currentPage.drawLine({
    start: { x: margin, y: currentY },
    end: { x: pageWidth - margin, y: currentY },
    thickness: 1.5,
    color: COLOR_NEON,
  });
  currentPage.drawLine({
    start: { x: margin, y: currentY - 1 },
    end: { x: pageWidth - margin, y: currentY - 1 },
    thickness: 0.5,
    color: COLOR_BORDER,
  });

  currentY -= 16;

  // ==============================================================================
  // 2. ORDER INFO & DELIVERY DESTINATION (2-Column Grid Layout)
  // ==============================================================================
  const colSpacing = 14;
  const colW = (contentWidth - colSpacing) / 2;
  const col1X = margin;
  const col2X = margin + colW + colSpacing;
  const gridBoxHeight = 118;

  // --- LEFT COLUMN: ORDER INFORMATION ---
  currentPage.drawRectangle({
    x: col1X,
    y: currentY - gridBoxHeight,
    width: colW,
    height: gridBoxHeight,
    color: COLOR_SURFACE,
    borderColor: COLOR_BORDER,
    borderWidth: 1,
  });

  // Top Neon Accent Border on Order Info Card
  currentPage.drawLine({
    start: { x: col1X, y: currentY },
    end: { x: col1X + colW, y: currentY },
    thickness: 2,
    color: COLOR_NEON,
  });

  currentPage.drawText("ORDER INFORMATION", {
    x: col1X + 12,
    y: currentY - 16,
    size: 8.5,
    font: fontBold,
    color: COLOR_NEON,
  });

  let oY = currentY - 33;
  const rowH = 16;

  const drawOrderInfoRow = (
    label: string,
    val: string,
    boldVal = false,
    valColor = COLOR_TEXT_PRIMARY
  ) => {
    currentPage.drawText(label, {
      x: col1X + 12,
      y: oY,
      size: 8,
      font: fontRegular,
      color: COLOR_TEXT_MUTED,
    });
    currentPage.drawText(val, {
      x: col1X + 96,
      y: oY,
      size: 8,
      font: boldVal ? fontBold : fontRegular,
      color: valColor,
    });
    oY -= rowH;
  };

  drawOrderInfoRow("Order Reference:", order.order_number, true, COLOR_TEXT_PRIMARY);
  drawOrderInfoRow("Date (IST):", formatISTDate(order.created_at), false, COLOR_TEXT_PRIMARY);

  // Status with Neon Green Badge / Box
  currentPage.drawText("Status:", {
    x: col1X + 12,
    y: oY,
    size: 8,
    font: fontRegular,
    color: COLOR_TEXT_MUTED,
  });

  let statusBadgeText = "PAID";
  let statusBadgeBg = rgb(14 / 255, 38 / 255, 14 / 255);
  let statusBadgeBorder = COLOR_NEON;
  let statusBadgeColor = COLOR_NEON;

  if (isDemo) {
    statusBadgeText = "DEMO (TEST)";
    statusBadgeBg = rgb(38 / 255, 28 / 255, 8 / 255);
    statusBadgeBorder = COLOR_AMBER;
    statusBadgeColor = COLOR_AMBER;
  } else if (isCod) {
    if (isCodCollected) {
      statusBadgeText = "PAID (CASH)";
      statusBadgeBg = rgb(14 / 255, 38 / 255, 14 / 255);
      statusBadgeBorder = COLOR_NEON;
      statusBadgeColor = COLOR_NEON;
    } else {
      statusBadgeText = "DUE ON DELIVERY";
      statusBadgeBg = rgb(38 / 255, 28 / 255, 8 / 255);
      statusBadgeBorder = COLOR_AMBER;
      statusBadgeColor = COLOR_AMBER;
    }
  } else if (!isFullyPaid) {
    statusBadgeText = "PENDING";
    statusBadgeBg = rgb(38 / 255, 12 / 255, 12 / 255);
    statusBadgeBorder = COLOR_RED;
    statusBadgeColor = COLOR_RED;
  }

  const badgeTextWidth = fontBold.widthOfTextAtSize(statusBadgeText, 7.5);
  const badgeWidth = badgeTextWidth + 14;
  const badgeX = col1X + 96;
  const badgeY = oY - 3;

  currentPage.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeWidth,
    height: 14,
    color: statusBadgeBg,
    borderColor: statusBadgeBorder,
    borderWidth: 1,
  });

  currentPage.drawText(statusBadgeText, {
    x: badgeX + 7,
    y: oY + 1,
    size: 7.5,
    font: fontBold,
    color: statusBadgeColor,
  });

  oY -= rowH;

  const paymentMethodText = isCod
    ? "CASH ON DELIVERY (COD)"
    : (order.payment_method || "RAZORPAY").toUpperCase();
  drawOrderInfoRow("Payment Method:", paymentMethodText, true, COLOR_TEXT_PRIMARY);

  if (order.razorpay_payment_id) {
    drawOrderInfoRow("Transaction ID:", order.razorpay_payment_id, false, COLOR_TEXT_MUTED);
  } else {
    drawOrderInfoRow("Fulfillment:", order.status.toUpperCase(), true, COLOR_TEXT_MUTED);
  }

  // --- RIGHT COLUMN: DELIVERY DESTINATION ---
  currentPage.drawRectangle({
    x: col2X,
    y: currentY - gridBoxHeight,
    width: colW,
    height: gridBoxHeight,
    color: COLOR_SURFACE,
    borderColor: COLOR_BORDER,
    borderWidth: 1,
  });

  // Top Accent Border on Delivery Card
  currentPage.drawLine({
    start: { x: col2X, y: currentY },
    end: { x: col2X + colW, y: currentY },
    thickness: 2,
    color: rgb(70 / 255, 70 / 255, 70 / 255),
  });

  currentPage.drawText("DELIVERY DESTINATION", {
    x: col2X + 12,
    y: currentY - 16,
    size: 8.5,
    font: fontBold,
    color: COLOR_NEON,
  });

  let dY = currentY - 33;

  // Customer Name (Bold)
  currentPage.drawText(order.customer_name, {
    x: col2X + 12,
    y: dY,
    size: 9,
    font: fontBold,
    color: COLOR_TEXT_PRIMARY,
  });
  dY -= 15;

  const addr1 = (order.shipping_address_line1 || "").trim();
  const addr2 = (order.shipping_address_line2 || "").trim();

  currentPage.drawText(addr1.substring(0, 48), {
    x: col2X + 12,
    y: dY,
    size: 7.5,
    font: fontRegular,
    color: COLOR_TEXT_MUTED,
  });
  dY -= 13;

  if (addr2) {
    currentPage.drawText(addr2.substring(0, 48), {
      x: col2X + 12,
      y: dY,
      size: 7.5,
      font: fontRegular,
      color: COLOR_TEXT_MUTED,
    });
    dY -= 13;
  }

  currentPage.drawText(
    `${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}`,
    {
      x: col2X + 12,
      y: dY,
      size: 7.5,
      font: fontRegular,
      color: COLOR_TEXT_MUTED,
    }
  );
  dY -= 13;

  const contactLine = `Ph: ${order.customer_phone} • ${order.customer_email}`;
  currentPage.drawText(contactLine.substring(0, 46), {
    x: col2X + 12,
    y: dY,
    size: 7.5,
    font: fontRegular,
    color: COLOR_TEXT_MUTED,
  });

  currentY -= gridBoxHeight + 14;

  // Optional Courier & Tracking bar if present
  const trackingNumber = order.tracking_id || order.tracking_number;
  if (order.courier_name && trackingNumber) {
    currentPage.drawRectangle({
      x: margin,
      y: currentY - 24,
      width: contentWidth,
      height: 24,
      color: COLOR_SURFACE,
      borderColor: COLOR_BORDER,
      borderWidth: 1,
    });
    currentPage.drawLine({
      start: { x: margin, y: currentY },
      end: { x: margin, y: currentY - 24 },
      thickness: 3,
      color: COLOR_NEON,
    });
    currentPage.drawText(
      `DISPATCH COURIER: ${order.courier_name.toUpperCase()}   •   AWB / TRACKING ID: ${trackingNumber}`,
      {
        x: margin + 12,
        y: currentY - 15,
        size: 8,
        font: fontBold,
        color: COLOR_NEON,
      }
    );
    currentY -= 32;
  }

  // ==============================================================================
  // 3. ITEM TABLE (Dark Grey Header, Neon Green Text, Alternating Dark Rows)
  // ==============================================================================
  checkPageOverflow(80);

  const drawTableHeader = (y: number) => {
    currentPage.drawRectangle({
      x: margin,
      y: y - 20,
      width: contentWidth,
      height: 20,
      color: COLOR_SURFACE_ALT,
      borderColor: COLOR_BORDER,
      borderWidth: 1,
    });

    currentPage.drawLine({
      start: { x: margin, y: y - 20 },
      end: { x: pageWidth - margin, y: y - 20 },
      thickness: 1.5,
      color: COLOR_NEON,
    });

    currentPage.drawText("ITEM / SCULPTURE", {
      x: margin + 10,
      y: y - 13,
      size: 8,
      font: fontBold,
      color: COLOR_NEON,
    });

    currentPage.drawText("VARIANT / SPEC", {
      x: margin + 230,
      y: y - 13,
      size: 8,
      font: fontBold,
      color: COLOR_NEON,
    });

    currentPage.drawText("QTY", {
      x: margin + 355,
      y: y - 13,
      size: 8,
      font: fontBold,
      color: COLOR_NEON,
    });

    currentPage.drawText("UNIT PRICE", {
      x: margin + 400,
      y: y - 13,
      size: 8,
      font: fontBold,
      color: COLOR_NEON,
    });

    const totalHdrW = fontBold.widthOfTextAtSize("TOTAL", 8);
    currentPage.drawText("TOTAL", {
      x: pageWidth - margin - 12 - totalHdrW,
      y: y - 13,
      size: 8,
      font: fontBold,
      color: COLOR_NEON,
    });
  };

  drawTableHeader(currentY);
  currentY -= 22;

  const items = order.items || [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    checkPageOverflow(26);

    const isEven = i % 2 === 0;
    const rowBg = isEven ? COLOR_ROW_EVEN : COLOR_ROW_ODD;

    currentPage.drawRectangle({
      x: margin,
      y: currentY - 22,
      width: contentWidth,
      height: 22,
      color: rowBg,
    });

    currentPage.drawLine({
      start: { x: margin, y: currentY - 22 },
      end: { x: pageWidth - margin, y: currentY - 22 },
      thickness: 0.5,
      color: COLOR_BORDER,
    });

    // Item Title: prominent, bold off-white
    currentPage.drawText((item.product_title || "Can Sculpture").substring(0, 38), {
      x: margin + 10,
      y: currentY - 15,
      size: 8.5,
      font: fontBold,
      color: COLOR_TEXT_PRIMARY,
    });

    // Variant
    const variantStr =
      [item.variant_label, item.selected_option].filter(Boolean).join(" • ") || "Standard";
    currentPage.drawText(variantStr.substring(0, 32), {
      x: margin + 230,
      y: currentY - 15,
      size: 7.5,
      font: fontRegular,
      color: COLOR_TEXT_MUTED,
    });

    // Qty
    currentPage.drawText(String(item.quantity), {
      x: margin + 365,
      y: currentY - 15,
      size: 8,
      font: fontRegular,
      color: COLOR_TEXT_PRIMARY,
    });

    // Unit Price
    currentPage.drawText(formatSlipRupees(item.unit_price_paise), {
      x: margin + 400,
      y: currentY - 15,
      size: 8,
      font: fontRegular,
      color: COLOR_TEXT_MUTED,
    });

    // Total Price (Right aligned)
    const lineTotalStr = formatSlipRupees(item.total_price_paise);
    const totalTextW = fontBold.widthOfTextAtSize(lineTotalStr, 8.5);
    currentPage.drawText(lineTotalStr, {
      x: pageWidth - margin - 12 - totalTextW,
      y: currentY - 15,
      size: 8.5,
      font: fontBold,
      color: COLOR_TEXT_PRIMARY,
    });

    currentY -= 22;
  }

  currentY -= 16;

  // ==============================================================================
  // 4. TOTALS SECTION (Bottom Right) & QR VERIFICATION CODE (Left)
  // ==============================================================================
  checkPageOverflow(140);

  const totalsBoxWidth = 230;
  const totalsBoxX = pageWidth - margin - totalsBoxWidth;
  const totalsBoxHeight = order.discount_paise > 0 ? 94 : 80;

  currentPage.drawRectangle({
    x: totalsBoxX,
    y: currentY - totalsBoxHeight,
    width: totalsBoxWidth,
    height: totalsBoxHeight,
    color: COLOR_SURFACE,
    borderColor: COLOR_BORDER,
    borderWidth: 1,
  });

  // Top Neon Accent Border on Totals Box
  currentPage.drawLine({
    start: { x: totalsBoxX, y: currentY },
    end: { x: totalsBoxX + totalsBoxWidth, y: currentY },
    thickness: 2,
    color: COLOR_NEON,
  });

  const drawTotalLine = (
    y: number,
    label: string,
    val: string,
    isGrand = false,
    valColor = COLOR_TEXT_PRIMARY
  ) => {
    currentPage.drawText(label, {
      x: totalsBoxX + 14,
      y,
      size: isGrand ? 9.5 : 8,
      font: isGrand ? fontBold : fontRegular,
      color: isGrand ? COLOR_TEXT_PRIMARY : COLOR_TEXT_MUTED,
    });

    const valSize = isGrand ? 12 : 8.5;
    const valWidth = fontBold.widthOfTextAtSize(val, valSize);
    currentPage.drawText(val, {
      x: pageWidth - margin - 14 - valWidth,
      y,
      size: valSize,
      font: fontBold,
      color: valColor,
    });
  };

  let tY = currentY - 18;
  drawTotalLine(tY, "Subtotal:", formatSlipRupees(order.subtotal_paise), false, COLOR_TEXT_PRIMARY);
  tY -= 15;

  if (order.discount_paise > 0) {
    drawTotalLine(
      tY,
      "Coupon Discount:",
      `-${formatSlipRupees(order.discount_paise)}`,
      false,
      COLOR_NEON
    );
    tY -= 15;
  }

  const shippingText =
    order.shipping_fee_paise === 0 ? "FREE" : formatSlipRupees(order.shipping_fee_paise);
  drawTotalLine(
    tY,
    "Pan-India Shipping:",
    shippingText,
    false,
    order.shipping_fee_paise === 0 ? COLOR_NEON : COLOR_TEXT_PRIMARY
  );
  tY -= 16;

  // Divider Line inside Totals
  currentPage.drawLine({
    start: { x: totalsBoxX + 12, y: tY + 4 },
    end: { x: pageWidth - margin - 12, y: tY + 4 },
    thickness: 1,
    color: COLOR_NEON,
  });

  // TOTAL AMOUNT in large, bold Neon Green font (#39FF14)
  drawTotalLine(tY - 8, "TOTAL AMOUNT:", formatSlipRupees(order.total_paise), true, COLOR_NEON);

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

    const qrBoxSize = 72;
    const qrBoxX = margin;
    const qrBoxY = currentY - qrBoxSize;

    // Solid white badge for the QR code so scanners can read it with 100% contrast against the dark background
    currentPage.drawRectangle({
      x: qrBoxX,
      y: qrBoxY,
      width: qrBoxSize,
      height: qrBoxSize,
      color: COLOR_WHITE,
      borderColor: COLOR_NEON,
      borderWidth: 1,
    });

    currentPage.drawImage(qrImage, {
      x: qrBoxX + 3,
      y: qrBoxY + 3,
      width: 66,
      height: 66,
    });

    const qrTextX = margin + qrBoxSize + 12;

    currentPage.drawText("SCAN TO VERIFY AUTHENTICITY", {
      x: qrTextX,
      y: currentY - 18,
      size: 8,
      font: fontBold,
      color: COLOR_NEON,
    });

    currentPage.drawText("Scan this QR code to verify this official order", {
      x: qrTextX,
      y: currentY - 30,
      size: 7,
      font: fontRegular,
      color: COLOR_TEXT_MUTED,
    });

    currentPage.drawText("in Clawcraft Studio vault records.", {
      x: qrTextX,
      y: currentY - 40,
      size: 7,
      font: fontRegular,
      color: COLOR_TEXT_MUTED,
    });

    const verifyShortUrl = `Verify: ${getSiteHost() || "clawcraftstudio.in"}/verify/${order.order_number}`;
    currentPage.drawText(verifyShortUrl.substring(0, 48), {
      x: qrTextX,
      y: currentY - 52,
      size: 6.5,
      font: fontRegular,
      color: COLOR_TEXT_DIM,
    });
  } catch (qrErr) {
    console.warn("[PDF QR Embed Warning]:", qrErr);
  }

  currentY -= Math.max(totalsBoxHeight, 72) + 24;

  // ==============================================================================
  // 5. FOOTER & URL SECTION
  // ==============================================================================
  checkPageOverflow(65);

  currentPage.drawLine({
    start: { x: margin, y: currentY },
    end: { x: pageWidth - margin, y: currentY },
    thickness: 0.75,
    color: COLOR_BORDER,
  });

  currentY -= 15;

  // Left: "Thank you for supporting handcrafted art."
  currentPage.drawText("Thank you for supporting handcrafted art.", {
    x: margin,
    y: currentY,
    size: 8,
    font: fontBold,
    color: COLOR_TEXT_PRIMARY,
  });

  // Right: Primary studio domain in Neon Green
  const siteUrlText = getSiteHost() || "clawcraftstudio.in";
  const siteUrlTextW = fontBold.widthOfTextAtSize(siteUrlText, 8);
  currentPage.drawText(siteUrlText, {
    x: pageWidth - margin - siteUrlTextW,
    y: currentY,
    size: 8,
    font: fontBold,
    color: COLOR_NEON,
  });

  currentY -= 13;

  currentPage.drawText(
    "Computer-generated receipt. This is not a GST tax invoice unless a GSTIN is shown above.",
    {
      x: margin,
      y: currentY,
      size: 6.5,
      font: fontRegular,
      color: COLOR_TEXT_DIM,
    }
  );

  currentY -= 11;
  currentPage.drawText(siteConfig.disclaimer, {
    x: margin,
    y: currentY,
    size: 6,
    font: fontRegular,
    color: COLOR_TEXT_DIM,
  });

  currentY -= 11;
  currentPage.drawText(
    `Studio Terms & Policies: ${siteUrl}/policies/refund-cancellation   •   Document generated: ${formatISTDate(
      new Date().toISOString()
    )} (IST)`,
    {
      x: margin,
      y: currentY,
      size: 6,
      font: fontRegular,
      color: COLOR_TEXT_DIM,
    }
  );

  return await pdfDoc.save();
}
