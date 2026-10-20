/**
 * Business Contact Single Source of Truth Helper
 *
 * Source Order:
 * 1. Site settings key (admin-editable, validated as an Indian 10-digit mobile starting 6-9)
 * 2. Environment variable: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER (digits with country code, no plus sign, no spaces)
 *
 * Requirements:
 * - Display format: "+91-XXXXXXXXXX"
 * - waLink: https://wa.me/<digits>?text=<encodeURIComponent(message)>
 * - telLink: tel:+<digits>
 * - If not configured: hide UI elements, log clear server warning, never fall back to dummy value.
 */

export interface BusinessContact {
  digits: string;
  display: string;
  waLink: (message?: string) => string;
  telLink: string;
  isConfigured: boolean;
}

/**
 * Validates an Indian mobile number.
 * Must be 10 digits starting with 6, 7, 8, or 9 (optionally with prefix +91, 91, or 0).
 */
export function validateIndianMobile(input?: string | null): {
  isValid: boolean;
  raw10: string;
  digitsWithCountryCode: string;
} {
  if (!input || typeof input !== "string") {
    return { isValid: false, raw10: "", digitsWithCountryCode: "" };
  }

  const cleaned = input.replace(/\D/g, "");

  let raw10 = "";
  if (cleaned.length === 10) {
    raw10 = cleaned;
  } else if (cleaned.length === 11 && cleaned.startsWith("0")) {
    raw10 = cleaned.slice(1);
  } else if (cleaned.length === 12 && cleaned.startsWith("91")) {
    raw10 = cleaned.slice(2);
  }

  if (raw10.length === 10 && /^[6-9]\d{9}$/.test(raw10)) {
    return {
      isValid: true,
      raw10,
      digitsWithCountryCode: `91${raw10}`,
    };
  }

  return { isValid: false, raw10: "", digitsWithCountryCode: "" };
}

/**
 * Returns public business contact info according to single source of truth rules.
 * Accepts an optional settingValue (e.g. from site_settings table 'whatsapp_number').
 */
export function getBusinessContact(settingValue?: string | null): BusinessContact {
  // 1. Check site_settings value
  if (settingValue !== undefined && settingValue !== null) {
    const fromSetting = validateIndianMobile(settingValue);
    if (fromSetting.isValid) {
      const digits = fromSetting.digitsWithCountryCode;
      const display = `+91-${fromSetting.raw10}`;
      return {
        digits,
        display,
        waLink: (message?: string) =>
          message
            ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
            : `https://wa.me/${digits}`,
        telLink: `tel:+${digits}`,
        isConfigured: true,
      };
    }
  }

  // 2. Check env variable
  const envVal = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (envVal) {
    const fromEnv = validateIndianMobile(envVal);
    if (fromEnv.isValid) {
      const digits = fromEnv.digitsWithCountryCode;
      const display = `+91-${fromEnv.raw10}`;
      return {
        digits,
        display,
        waLink: (message?: string) =>
          message
            ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
            : `https://wa.me/${digits}`,
        telLink: `tel:+${digits}`,
        isConfigured: true,
      };
    }
  }

  // 3. Unconfigured fallback
  if (typeof window === "undefined") {
    console.warn(
      "[BusinessContact Warning]: Business contact number is not configured or invalid in site_settings/NEXT_PUBLIC_WHATSAPP_NUMBER. Public contact elements will remain hidden."
    );
  }

  return {
    digits: "",
    display: "",
    waLink: () => "",
    telLink: "",
    isConfigured: false,
  };
}
