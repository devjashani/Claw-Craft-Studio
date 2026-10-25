/** @type {import('next').NextConfig} */

function getAllowedOrigins() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const origins = new Set();

  if (siteUrl) {
    try {
      const parsed = new URL(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`);
      const host = parsed.host;
      origins.add(host);
      if (host.startsWith("www.")) {
        origins.add(host.replace(/^www\./, ""));
      } else {
        origins.add(`www.${host}`);
      }
    } catch {
      // ignore invalid URL
    }
  }

  if (process.env.NODE_ENV !== "production") {
    origins.add("localhost:3000");
    origins.add("127.0.0.1:3000");
    origins.add("localhost");
  }

  return Array.from(origins);
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: getAllowedOrigins(),
    },
  },
  async headers() {
    const isVercelNonProd =
      typeof process.env.VERCEL_ENV === "string" &&
      process.env.VERCEL_ENV !== "production";

    // Non-production deployments get noindex on all pages to protect domain indexing
    if (isVercelNonProd) {
      return [
        {
          source: "/:path*",
          headers: [
            {
              key: "X-Robots-Tag",
              value: "noindex, nofollow, noarchive",
            },
          ],
        },
      ];
    }

    // Production: noindex strictly on private routes
    const privateRoutes = [
      "/admin/:path*",
      "/account/:path*",
      "/order/:path*",
      "/track/:path*",
      "/verify/:path*",
      "/login",
      "/signup",
      "/auth/:path*",
      "/api/:path*",
      "/checkout/:path*",
      "/cart",
      "/forgot-password",
      "/reset-password",
    ];

    return privateRoutes.map((source) => ({
      source,
      headers: [
        {
          key: "X-Robots-Tag",
          value: "noindex, nofollow, noarchive",
        },
      ],
    }));
  },
};

export default nextConfig;
