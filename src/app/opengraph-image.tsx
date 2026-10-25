import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const runtime = "edge";
export const alt = "CLAWCRAFT Studio | Handcrafted Empty Can Art";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#050505",
          padding: "60px",
          position: "relative",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Subtle decorative border */}
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 28,
            right: 28,
            bottom: 28,
            border: "1px solid rgba(184, 255, 31, 0.25)",
            display: "flex",
          }}
        />

        {/* Studio Subheading */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <span
            style={{
              color: "#B8FF1F",
              fontSize: "16px",
              fontWeight: 800,
              letterSpacing: "4px",
              textTransform: "uppercase",
            }}
          >
            HANDCRAFTED CAN ART ATELIER • INDIA
          </span>
        </div>

        {/* Brand Wordmark */}
        <h1
          style={{
            color: "#F2F0EA",
            fontSize: "96px",
            fontWeight: 900,
            letterSpacing: "8px",
            textTransform: "uppercase",
            margin: "0 0 14px 0",
          }}
        >
          {siteConfig.name}
        </h1>

        {/* Tagline */}
        <p
          style={{
            color: "#8E959F",
            fontSize: "26px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            margin: "0 0 28px 0",
            fontWeight: 600,
          }}
        >
          {siteConfig.tagline}
        </p>

        {/* Feature Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 24px",
            backgroundColor: "rgba(184, 255, 31, 0.12)",
            border: "1px solid #B8FF1F",
            borderRadius: "2px",
          }}
        >
          <span
            style={{
              color: "#B8FF1F",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Recycled Aluminum Sculptures &amp; Relics
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
