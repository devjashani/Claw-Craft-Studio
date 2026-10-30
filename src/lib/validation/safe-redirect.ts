/**
 * ==============================================================================
 * CLAWCRAFT STUDIO - SAFE REDIRECT PATH VALIDATION
 * ==============================================================================
 * Validates the "next" or redirect parameter to strictly accept only same-site
 * relative paths that start with a single slash (e.g. "/admin/products", "/account").
 *
 * Rejects:
 * - Protocol-relative URLs: "//evil.com", "///evil.com"
 * - Backslash variants: "/\\evil.com", "\\evil.com", "/foo\\bar"
 * - Absolute URLs & protocols: "https://evil.com", "javascript:...", "data:..."
 * - URL-encoded bypasses: "%2f%2fevil.com", "%5c%5cevil.com"
 * - Control characters and malformed URI sequences
 * ==============================================================================
 */

export function validateSafeRedirectPath(
  rawPath: string | null | undefined,
  fallback = "/"
): string {
  if (!rawPath || typeof rawPath !== "string") {
    return fallback;
  }

  const trimmed = rawPath.trim();
  if (!trimmed) {
    return fallback;
  }

  // 1. Must start with a single forward slash and not a double slash or backslash
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }

  // 2. Reject backslashes anywhere in the path
  if (trimmed.includes("\\")) {
    return fallback;
  }

  // 3. Reject URL-encoded slashes or backslashes (%2f, %2F, %5c, %5C)
  if (/%2[fF]|%5[cC]/.test(trimmed)) {
    return fallback;
  }

  // 4. Decode URI safely to detect hidden protocol schemes or double-encoding
  try {
    const decoded = decodeURIComponent(trimmed);
    if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.startsWith("/\\") || decoded.includes("\\")) {
      return fallback;
    }
  } catch {
    // Malformed URI sequence
    return fallback;
  }

  // 5. Ensure no protocol specification before query or hash (e.g. "/http:", "/javascript:")
  const pathWithoutQuery = trimmed.split("?")[0].split("#")[0];
  if (pathWithoutQuery.includes(":")) {
    return fallback;
  }

  // 6. Strict URL resolution check against dummy local origin
  try {
    const dummyOrigin = "http://clawcraft.internal";
    const resolved = new URL(trimmed, dummyOrigin);

    // Origin must remain strictly identical to dummy origin (no host switching)
    if (resolved.origin !== dummyOrigin) {
      return fallback;
    }

    // Must be a relative path that begins with "/"
    const safePath = resolved.pathname + resolved.search + resolved.hash;
    if (!safePath.startsWith("/") || safePath.startsWith("//")) {
      return fallback;
    }

    return safePath;
  } catch {
    return fallback;
  }
}

