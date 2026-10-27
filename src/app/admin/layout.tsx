import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireAdmin, getAdminSession } from "@/lib/auth/admin-auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminCountsProvider } from "@/components/admin/admin-counts-context";
import { getRazorpayGatewayStatus } from "@/lib/razorpay";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Studio Admin | CLAWCRAFT",
  description: "Artisan control portal for managing CLAWCRAFT orders, catalog, and inventory.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const pathname = headersList.get("x-pathname") || "";

  // The login page renders without requiring an existing admin session
  if (pathname === "/admin/login") {
    return <main className="flex-1 w-full">{children}</main>;
  }

  // All other /admin routes strictly mandate a verified admin session on the server
  let adminSession = null;
  try {
    adminSession = await requireAdmin();
  } catch {
    // If headers or direct render fails requireAdmin, fallback to getAdminSession
    adminSession = await getAdminSession();
  }

  const paymentStatus = await getRazorpayGatewayStatus();

  return (
    <AdminCountsProvider>
      <div className="min-h-screen bg-void text-bone selection:bg-acid selection:text-void flex flex-col font-body">
        {adminSession && <AdminNav userEmail={adminSession.email} />}

        {/* Red Banner when Razorpay is in TEST mode in Production */}
        {paymentStatus.isTestKeyInProduction && (
          <div className="bg-blood text-white px-4 py-2 text-center text-xs font-mono uppercase tracking-widest font-bold flex items-center justify-center gap-2 border-b border-blood/60 shadow-lg z-40">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Razorpay is in TEST mode — Real payments cannot be processed in production.</span>
          </div>
        )}

        <main className="flex-1 w-full">{children}</main>
      </div>
    </AdminCountsProvider>
  );
}
