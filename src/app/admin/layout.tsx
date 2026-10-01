import React from "react";
import type { Metadata } from "next";
import { getAdminSession } from "@/lib/auth/admin-auth";
import { AdminNav } from "@/components/admin/admin-nav";

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
  const session = await getAdminSession();

  return (
    <div className="min-h-screen bg-void text-bone selection:bg-acid selection:text-void flex flex-col font-body">
      {session && <AdminNav userEmail={session.email} />}
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
