import fs from "fs";
import path from "path";
import { buildSlipPdf } from "../src/lib/pdf/order-slip";
import { Order } from "../src/types/shop";

const outputDir = path.join(process.cwd(), "public", "sample-receipts");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  console.log("Generating 5 test sample PDFs...");

  // 1. Paid order with 1 item
  const order1: Order = {
    id: "ord-test-001",
    order_number: "CC-2026-0001",
    public_token: "tok_test_001_unguessable_alpha_beta_12345",
    status: "paid",
    customer_name: "Vikram Malhotra",
    customer_email: "vikram@example.com",
    customer_phone: "+91 98200 12345",
    shipping_address_line1: "Flat 402, Sea Green Apartments",
    shipping_address_line2: "Worli Sea Face",
    shipping_city: "Mumbai",
    shipping_state: "Maharashtra",
    shipping_pincode: "400018",
    subtotal_paise: 129900,
    shipping_fee_paise: 14900,
    discount_paise: 0,
    total_paise: 144800,
    payment_status: "paid",
    payment_method: "upi",
    razorpay_order_id: "order_Q1234567890abc",
    razorpay_payment_id: "pay_R9876543210xyz",
    paid_at: "2026-10-04T12:30:00.000Z",
    payment_meta: {
      vpa: "vikram@okhdfcbank",
    },
    razorpay_signature: null,
    coupon_id: null,
    courier_name: null,
    tracking_number: null,
    tracking_id: null,
    tracking_url: null,
    estimated_delivery_date: null,
    admin_notes: null,
    email_sent_at: "2026-10-04T12:30:05.000Z",
    created_at: "2026-10-04T12:28:00.000Z",
    updated_at: "2026-10-04T12:30:00.000Z",
    items: [
      {
        id: "item-001",
        order_id: "ord-test-001",
        product_id: "prod-can-guitar",
        product_title: "Monster Energy Guitar (30-Can Wall Art)",
        image_url: "/assets/products/30-can-guitar-wall-art-v1.png",
        variant_label: null,
        unit_price_paise: 129900,
        quantity: 1,
        total_price_paise: 129900,
      },
    ],
  };

  const pdf1 = await buildSlipPdf(order1, {
    siteUrl: "http://localhost:3000",
    businessAddress: "Workshop 4, Industrial Area Phase II, Mumbai, Maharashtra 400013",
    gstin: "27AAAAA0000A1Z5",
    watermarkText: "CLAWCRAFT STUDIO",
  });
  fs.writeFileSync(path.join(outputDir, "1-paid-single-item.pdf"), pdf1);
  console.log("✓ Saved 1-paid-single-item.pdf (%d bytes)", pdf1.length);

  // 2. Paid order with candle variant and coupon
  const order2: Order = {
    id: "ord-test-002",
    order_number: "CC-2026-0002",
    public_token: "tok_test_002_unguessable_candle_discount",
    status: "paid",
    customer_name: "Pooja Hegde",
    customer_email: "pooja@example.com",
    customer_phone: "+91 99300 54321",
    shipping_address_line1: "House No. 12, Indiranagar 100ft Road",
    shipping_address_line2: null,
    shipping_city: "Bengaluru",
    shipping_state: "Karnataka",
    shipping_pincode: "560038",
    subtotal_paise: 79800,
    shipping_fee_paise: 0,
    discount_paise: 10000,
    total_paise: 69800,
    coupon_id: "c-diwali100",
    coupon_code: "DIWALI100",
    payment_status: "paid",
    payment_method: "card",
    razorpay_order_id: "order_CANDLE12345",
    razorpay_payment_id: "pay_CANDLE67890",
    paid_at: "2026-10-04T14:15:00.000Z",
    payment_meta: {
      network: "Visa",
      last4: "4242",
    },
    razorpay_signature: null,
    courier_name: "BlueDart Express",
    tracking_number: "BLD-998822110",
    tracking_id: "BLD-998822110",
    tracking_url: "https://www.bluedart.com",
    estimated_delivery_date: "2026-10-08",
    admin_notes: null,
    email_sent_at: "2026-10-04T14:15:02.000Z",
    created_at: "2026-10-04T14:10:00.000Z",
    updated_at: "2026-10-04T14:15:00.000Z",
    items: [
      {
        id: "item-002",
        order_id: "ord-test-002",
        product_id: "prod-can-candle",
        product_title: "Upcycled Can Scented Candle (Diwali Edition)",
        image_url: "/assets/products/can-candle-diwali-special-v1.png",
        variant_label: "Pack of 2 • Sandalwood & Vanilla",
        unit_price_paise: 39900,
        quantity: 2,
        total_price_paise: 79800,
      },
    ],
  };

  const pdf2 = await buildSlipPdf(order2, {
    siteUrl: "http://localhost:3000",
    businessAddress: "Workshop 4, Industrial Area Phase II, Mumbai, Maharashtra 400013",
    gstin: "27AAAAA0000A1Z5",
    watermarkText: "CLAWCRAFT STUDIO",
  });
  fs.writeFileSync(path.join(outputDir, "2-paid-candle-variant-coupon.pdf"), pdf2);
  console.log("✓ Saved 2-paid-candle-variant-coupon.pdf (%d bytes)", pdf2.length);

  // 3. Pending-payment order
  const order3: Order = {
    id: "ord-test-003",
    order_number: "CC-2026-0003",
    public_token: "tok_test_003_unguessable_pending",
    status: "pending_payment",
    customer_name: "Ananya Deshmukh",
    customer_email: "ananya@example.com",
    customer_phone: "+91 97654 32100",
    shipping_address_line1: "A-15, Koregaon Park Road",
    shipping_address_line2: null,
    shipping_city: "Pune",
    shipping_state: "Maharashtra",
    shipping_pincode: "411001",
    subtotal_paise: 489900,
    shipping_fee_paise: 0,
    discount_paise: 0,
    total_paise: 489900,
    coupon_id: null,
    payment_status: "pending_payment",
    payment_method: "upi",
    razorpay_order_id: "order_PENDING998877",
    razorpay_payment_id: null,
    razorpay_signature: null,
    paid_at: null,
    courier_name: null,
    tracking_number: null,
    tracking_id: null,
    tracking_url: null,
    estimated_delivery_date: null,
    admin_notes: null,
    email_sent_at: null,
    created_at: "2026-10-04T15:00:00.000Z",
    updated_at: "2026-10-04T15:00:00.000Z",
    items: [
      {
        id: "item-003",
        order_id: "ord-test-003",
        product_id: "prod-can-spider",
        product_title: "Mechanical Arachnid (24-Can Wall Sculpture)",
        image_url: "/assets/products/24-can-spider-wall-art-v1.png",
        variant_label: null,
        unit_price_paise: 489900,
        quantity: 1,
        total_price_paise: 489900,
      },
    ],
  };

  const pdf3 = await buildSlipPdf(order3, {
    siteUrl: "http://localhost:3000",
    watermarkText: "CLAWCRAFT STUDIO",
  });
  fs.writeFileSync(path.join(outputDir, "3-pending-payment.pdf"), pdf3);
  console.log("✓ Saved 3-pending-payment.pdf (%d bytes)", pdf3.length);

  // 4. Demo order
  const order4: Order = {
    id: "demo-test-004",
    order_number: "CC-DEMO-0001",
    public_token: "tok_demo_unguessable_demo_mode_order",
    status: "paid",
    customer_name: "Dev Demo User",
    customer_email: "dev@demo.local",
    customer_phone: "+91 90000 00000",
    shipping_address_line1: "Demo Street 1, Localhost",
    shipping_address_line2: null,
    shipping_city: "Delhi",
    shipping_state: "Delhi",
    shipping_pincode: "110001",
    subtotal_paise: 229900,
    shipping_fee_paise: 14900,
    discount_paise: 0,
    total_paise: 244800,
    coupon_id: null,
    payment_status: "paid",
    payment_method: "upi",
    razorpay_order_id: "demo_order_123",
    razorpay_payment_id: "demo_pay_123",
    razorpay_signature: null,
    paid_at: "2026-10-04T16:00:00.000Z",
    courier_name: null,
    tracking_number: null,
    tracking_id: null,
    tracking_url: null,
    estimated_delivery_date: null,
    admin_notes: null,
    email_sent_at: null,
    isDemo: true,
    created_at: "2026-10-04T16:00:00.000Z",
    updated_at: "2026-10-04T16:00:00.000Z",
    items: [
      {
        id: "item-004",
        order_id: "demo-test-004",
        product_id: "prod-can-bow",
        product_title: "Cybernetic Recurve Bow (11-Can Wall Art)",
        image_url: "/assets/products/11-can-bow-wall-art-v1.png",
        variant_label: null,
        unit_price_paise: 229900,
        quantity: 1,
        total_price_paise: 229900,
      },
    ],
  };

  const pdf4 = await buildSlipPdf(order4, {
    siteUrl: "http://localhost:3000",
  });
  fs.writeFileSync(path.join(outputDir, "4-demo-order.pdf"), pdf4);
  console.log("✓ Saved 4-demo-order.pdf (%d bytes)", pdf4.length);

  // 5. 25-item order (multi-page verification)
  const items25 = Array.from({ length: 25 }, (_, i) => ({
    id: `item-multi-${i + 1}`,
    order_id: "ord-test-005",
    product_id: `prod-${i + 1}`,
    product_title: `Artisan Sculpture Line #${i + 1} (Handmade)`,
    image_url: null,
    variant_label: i % 2 === 0 ? `Edition ${i + 1} • Special Finish` : null,
    unit_price_paise: 129900,
    quantity: 1 + (i % 3),
    total_price_paise: 129900 * (1 + (i % 3)),
  }));

  const subtotal25 = items25.reduce((sum, it) => sum + it.total_price_paise, 0);

  const order5: Order = {
    id: "ord-test-005",
    order_number: "CC-2026-0005",
    public_token: "tok_test_005_unguessable_multipage",
    status: "paid",
    customer_name: "Gallery Royal Curator",
    customer_email: "curator@galleryroyal.in",
    customer_phone: "+91 91234 56789",
    shipping_address_line1: "Gallery Royal, Heritage Wing Level 2",
    shipping_address_line2: "MG Road Arts Precinct",
    shipping_city: "Kolkata",
    shipping_state: "West Bengal",
    shipping_pincode: "700001",
    subtotal_paise: subtotal25,
    shipping_fee_paise: 0,
    discount_paise: 50000,
    total_paise: subtotal25 - 50000,
    coupon_id: "c-gallery500",
    coupon_code: "GALLERY500",
    payment_status: "paid",
    payment_method: "netbanking",
    razorpay_order_id: "order_MULTI9999",
    razorpay_payment_id: "pay_MULTI9999",
    razorpay_signature: null,
    paid_at: "2026-10-04T17:00:00.000Z",
    payment_meta: {
      bank: "HDFC Bank",
    },
    courier_name: null,
    tracking_number: null,
    tracking_id: null,
    tracking_url: null,
    estimated_delivery_date: null,
    admin_notes: null,
    email_sent_at: "2026-10-04T17:01:00.000Z",
    created_at: "2026-10-04T16:50:00.000Z",
    updated_at: "2026-10-04T17:00:00.000Z",
    items: items25,
  };

  const pdf5 = await buildSlipPdf(order5, {
    siteUrl: "http://localhost:3000",
    businessAddress: "Workshop 4, Industrial Area Phase II, Mumbai, Maharashtra 400013",
    gstin: "27AAAAA0000A1Z5",
    watermarkText: "CLAWCRAFT STUDIO",
  });
  fs.writeFileSync(path.join(outputDir, "5-multipage-25-items.pdf"), pdf5);
  console.log("✓ Saved 5-multipage-25-items.pdf (%d bytes)", pdf5.length);

  console.log("\nAll 5 PDFs generated successfully!");
}

run().catch((err) => {
  console.error("Test PDF generation failed:", err);
  process.exit(1);
});
