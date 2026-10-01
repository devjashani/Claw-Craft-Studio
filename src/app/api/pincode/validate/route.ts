import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pincode = searchParams.get("pincode");

  if (!pincode) {
    return NextResponse.json(
      { error: "Pincode is required." },
      { status: 400 }
    );
  }

  const cleanPin = pincode.trim();
  const indianPinRegex = /^[1-9][0-9]{5}$/;

  if (!indianPinRegex.test(cleanPin)) {
    return NextResponse.json(
      {
        serviceable: false,
        message: "Invalid Indian PIN code format. Must be 6 digits.",
      },
      { status: 400 }
    );
  }

  // First digit zone estimation (Postal Zones of India)
  const firstDigit = cleanPin[0];
  let estimatedDays = "3-5 business days";
  let zoneName = "North/West India";

  if (firstDigit === "1" || firstDigit === "2") {
    zoneName = "Northern Region";
    estimatedDays = "3-4 business days";
  } else if (firstDigit === "3" || firstDigit === "4") {
    zoneName = "Western Region (Mumbai Hub)";
    estimatedDays = "2-4 business days";
  } else if (firstDigit === "5" || firstDigit === "6") {
    zoneName = "Southern Region";
    estimatedDays = "3-5 business days";
  } else if (firstDigit === "7" || firstDigit === "8") {
    zoneName = "Eastern Region";
    estimatedDays = "4-6 business days";
  }

  return NextResponse.json({
    serviceable: true,
    pincode: cleanPin,
    zone: zoneName,
    estimatedDelivery: estimatedDays,
    message: `Delivery available to ${cleanPin}. Estimated dispatch via Express Courier within ${estimatedDays}.`,
  });
}
