import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order & Commission Tracking | CLAWCRAFT Studio",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TrackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
