"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (type: ToastType, title: string, description?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, description }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toastHelpers = {
    success: (title: string, description?: string) =>
      addToast("success", title, description),
    error: (title: string, description?: string) =>
      addToast("error", title, description),
    info: (title: string, description?: string) =>
      addToast("info", title, description),
  };

  return (
    <ToastContext.Provider value={{ toast: toastHelpers }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-[calc(100vw-3rem)] pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={cn(
                "pointer-events-auto relative p-4 border bg-void/95 backdrop-blur-md shadow-2xl flex items-start gap-3 clip-claw-button",
                item.type === "success" && "border-acid text-bone",
                item.type === "error" && "border-blood text-bone",
                item.type === "info" && "border-steel/40 text-bone"
              )}
            >
              {/* Corner slash indicator */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2",
                  item.type === "success" && "border-acid",
                  item.type === "error" && "border-blood",
                  item.type === "info" && "border-steel"
                )}
              />

              <div className="shrink-0 mt-0.5">
                {item.type === "success" && (
                  <CheckCircle2 className="w-5 h-5 text-acid" />
                )}
                {item.type === "error" && (
                  <AlertTriangle className="w-5 h-5 text-blood" />
                )}
                {item.type === "info" && (
                  <Info className="w-5 h-5 text-steel" />
                )}
              </div>

              <div className="flex-1 pr-2">
                <p className="font-display uppercase text-sm tracking-wide text-bone">
                  {item.title}
                </p>
                {item.description && (
                  <p className="font-sans text-xs text-steel mt-0.5 leading-snug">
                    {item.description}
                  </p>
                )}
              </div>

              <button
                onClick={() => removeToast(item.id)}
                className="text-steel hover:text-bone p-1 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return {
    ...context.toast,
    showToast: (title: string, type: ToastType = "info") => {
      if (type === "success") context.toast.success(title);
      else if (type === "error") context.toast.error(title);
      else context.toast.info(title);
    },
  };
}
