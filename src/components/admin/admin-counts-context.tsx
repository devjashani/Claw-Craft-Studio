"use client";

import React, { createContext, useContext } from "react";
import { useAdminCounts, UseAdminCountsReturn } from "@/lib/admin/use-admin-counts";

const AdminCountsContext = createContext<UseAdminCountsReturn | null>(null);

export function AdminCountsProvider({ children }: { children: React.ReactNode }) {
  const counts = useAdminCounts();

  return (
    <AdminCountsContext.Provider value={counts}>
      {children}
    </AdminCountsContext.Provider>
  );
}

export function useAdminCountsContext(): UseAdminCountsReturn {
  const context = useContext(AdminCountsContext);
  if (!context) {
    throw new Error("useAdminCountsContext must be used within an AdminCountsProvider");
  }
  return context;
}
