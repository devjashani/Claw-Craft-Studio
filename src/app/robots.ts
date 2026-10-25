import { MetadataRoute } from "next";
import { absoluteUrl, isProductionSite } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const isVercelNonProd =
    typeof process.env.VERCEL_ENV === "string" &&
    process.env.VERCEL_ENV !== "production";

  // On any non-production deployment (e.g. Vercel preview or local without production domain), disallow everything
  if (isVercelNonProd || !isProductionSite()) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
      sitemap: absoluteUrl("/sitemap.xml"),
    };
  }

  // Production rules: Allow public storefront, strictly disallow private paths
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/account",
          "/account/*",
          "/login",
          "/signup",
          "/auth",
          "/auth/*",
          "/api",
          "/api/*",
          "/order",
          "/order/*",
          "/track",
          "/track/*",
          "/verify",
          "/verify/*",
          "/checkout",
          "/checkout/*",
          "/cart",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
