import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Slip Verification | CLAWCRAFT Studio",
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
