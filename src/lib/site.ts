/**
 * CLAWCRAFT Studio - Single Source of Truth for Website URL & Brand Identity
 * 
 * Rules:
 * - Domain / Host is NEVER hard-coded: comes exclusively from NEXT_PUBLIC_SITE_URL.
 * - In Vercel preview environments: falls back to VERCEL_URL if NEXT_PUBLIC_SITE_URL is not set.
 * - In local development: defaults to http://localhost:3000 (or window.location.origin in client).
 * - Contact details (phone, email) come from settings helpers, never hardcoded here.
 * - No beverage brand names anywhere.
 */

export const siteConfig = {
  name: "CLAWCRAFT",
  longName: "CLAWCRAFT Studio",
  tagline: "Empty cans. Full attitude.",
  titleTemplate: "%s | CLAWCRAFT",
  defaultTitle: "CLAWCRAFT | Handcrafted Empty Can Art",
  defaultDescription:
    "Handcrafted display art and wall sculptures fabricated from recycled, empty energy-drink cans. Made in India. Pan-India shipping.",
  locale: "en-IN",
  ogLocale: "en_IN",
  themeColor: "#050505",
  accentColor: "#B8FF1F",
  disclaimer:
    "CLAWCRAFT is an independent art studio. Not affiliated with, sponsored by or endorsed by any beverage brand. Products are handcrafted art made from empty, recycled cans.",
  productSafetyNotice:
    "Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.",
  get domain(): string {
    return getSiteHost();
  },
} as const;

/**
 * Normalises a raw URL into an origin with no trailing slash or path.
 * Lowercases host, trims whitespace, removes trailing slash.
 */
function normaliseUrl(rawUrl: string): string {
  try {
    const trimmed = rawUrl.trim();
    const withProtocol = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    return `${parsed.protocol}//${parsed.host.toLowerCase()}`;
  } catch {
    return rawUrl.trim().replace(/\/+$/, "");
  }
}

/**
 * Single source of truth for the site's origin URL (no trailing slash).
 */
export function getSiteUrl(): string {
  // 1. Explicit environment variable (Primary source of truth)
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return normaliseUrl(envUrl);
  }

  // 2. Vercel preview deployment URL
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim().length > 0) {
    return normaliseUrl(`https://${vercelUrl}`);
  }

  // 3. Client-side browser runtime (Development fallback)
  if (typeof window !== "undefined" && window.location?.origin) {
    return normaliseUrl(window.location.origin);
  }

  // 4. Default local development server
  return "http://localhost:3000";
}

/**
 * Returns only the hostname (and optional port if local) of the site.
 * E.g. "clawcraftstudio.in" or "www.clawcraftstudio.in"
 */
export function getSiteHost(): string {
  try {
    const url = new URL(getSiteUrl());
    return url.host.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Returns true if the site is configured for real production use.
 */
export function isProductionSite(): boolean {
  if (process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "development") {
    return false;
  }
  const siteUrl = getSiteUrl();
  return (
    siteUrl.startsWith("https://") &&
    !siteUrl.includes("localhost") &&
    !siteUrl.includes("127.0.0.1") &&
    !siteUrl.includes("vercel.app")
  );
}

/**
 * Constructs a fully qualified absolute URL from a path and optional query parameters.
 * E.g. absoluteUrl("/shop/heart") -> "https://www.clawcraftstudio.in/shop/heart"
 */
export function absoluteUrl(
  path = "/",
  query?: Record<string, string | number | boolean | undefined | null>
): string {
  const origin = getSiteUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  if (!query) {
    return `${origin}${cleanPath === "/" && origin.endsWith("/") ? "" : cleanPath}`;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const qs = searchParams.toString();
  return `${origin}${cleanPath}${qs ? `?${qs}` : ""}`;
}

/**
 * Build-time guard: if NODE_ENV is production and this is a production deployment,
 * fail the build if NEXT_PUBLIC_SITE_URL is missing, not https, or contains localhost / vercel.app.
 * Does NOT fail preview or local development builds.
 */
export function validateProductionSiteUrl(): void {
  const isVercelProd = process.env.VERCEL_ENV === "production";
  const isEnforced = process.env.ENFORCE_PRODUCTION_SITE_URL === "true";

  // Only enforce on true production builds
  if (!isVercelProd && !isEnforced) {
    return;
  }

  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw || raw.trim().length === 0) {
    throw new Error(
      `\n\n========================================================================\n` +
      `[PRODUCTION BUILD ERROR]: NEXT_PUBLIC_SITE_URL is missing!\n` +
      `In Vercel Production, you MUST set NEXT_PUBLIC_SITE_URL to your primary\n` +
      `production domain (e.g. "https://clawcraftstudio.in" or "https://www.clawcraftstudio.in").\n` +
      `========================================================================\n\n`
    );
  }

  const trimmed = raw.trim();
  if (!trimmed.startsWith("https://")) {
    throw new Error(
      `\n\n========================================================================\n` +
      `[PRODUCTION BUILD ERROR]: NEXT_PUBLIC_SITE_URL must start with "https://".\n` +
      `Received: "${trimmed}".\n` +
      `Please update NEXT_PUBLIC_SITE_URL in your Vercel Production Environment Variables.\n` +
      `========================================================================\n\n`
    );
  }

  if (trimmed.includes("localhost") || trimmed.includes("127.0.0.1") || trimmed.includes("vercel.app")) {
    throw new Error(
      `\n\n========================================================================\n` +
      `[PRODUCTION BUILD ERROR]: NEXT_PUBLIC_SITE_URL cannot contain "localhost" or "vercel.app" in production.\n` +
      `Received: "${trimmed}".\n` +
      `Set it to your production domain (e.g. "https://www.clawcraftstudio.in") in Vercel.\n` +
      `========================================================================\n\n`
    );
  }
}
