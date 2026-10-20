"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import {
  ADMIN_COUNTS_REFRESH_EVENT,
  ADMIN_SOUND_CHANGE_EVENT,
  getAdminSoundEnabled,
  setAdminSoundEnabled,
  playNotificationChime,
} from "./attention";

export interface AdminCountsData {
  orders: number;
  inquiries: number;
  latestOrder: string | null;
  latestInquiry: string | null;
}

export interface UseAdminCountsReturn {
  ordersCount: number;
  inquiriesCount: number;
  latestOrder: string | null;
  latestInquiry: string | null;
  ordersPulsing: boolean;
  inquiriesPulsing: boolean;
  soundEnabled: boolean;
  toggleSound: () => void;
  refetch: () => Promise<void>;
}

const DEFAULT_POLL_INTERVAL_MS = 30000; // 30 seconds
const MAX_BACKOFF_MS = 120000; // 2 minutes

/**
 * Hook for live polling of admin attention counts.
 * Strictly executes within client admin pages.
 */
export function useAdminCounts(): UseAdminCountsReturn {
  const { success: showToast } = useToast();

  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [inquiriesCount, setInquiriesCount] = useState<number>(0);
  const [latestOrder, setLatestOrder] = useState<string | null>(null);
  const [latestInquiry, setLatestInquiry] = useState<string | null>(null);

  const [ordersPulsing, setOrdersPulsing] = useState<boolean>(false);
  const [inquiriesPulsing, setInquiriesPulsing] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(false);

  // References for tracking previous counts across polls
  const isFirstLoadRef = useRef<boolean>(true);
  const prevOrdersRef = useRef<number>(0);
  const prevInquiriesRef = useRef<number>(0);
  const authTerminatedRef = useRef<boolean>(false);
  const activeAbortRef = useRef<AbortController | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backoffRef = useRef<number>(DEFAULT_POLL_INTERVAL_MS);
  const pulseTimerOrdersRef = useRef<NodeJS.Timeout | null>(null);
  const pulseTimerInquiriesRef = useRef<NodeJS.Timeout | null>(null);
  const baseTitleRef = useRef<string>("");

  // Initialize and synchronize sound preference live from localStorage & custom events
  useEffect(() => {
    const syncSound = () => {
      setSoundEnabledState(getAdminSoundEnabled());
    };
    syncSound();

    if (typeof window !== "undefined") {
      window.addEventListener(ADMIN_SOUND_CHANGE_EVENT, syncSound);
      window.addEventListener("storage", syncSound);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(ADMIN_SOUND_CHANGE_EVENT, syncSound);
        window.removeEventListener("storage", syncSound);
      }
    };
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      const next = !prev;
      setAdminSoundEnabled(next);
      return next;
    });
  }, []);

  // Fetch count function with abort controller and silent auth stop
  const fetchCounts = useCallback(async () => {
    if (authTerminatedRef.current) return;
    if (typeof document !== "undefined" && document.hidden) return;

    // Abort any ongoing request before firing a new one
    if (activeAbortRef.current) {
      activeAbortRef.current.abort();
    }
    const controller = new AbortController();
    activeAbortRef.current = controller;

    try {
      const res = await fetch("/api/admin/notification-counts", {
        method: "GET",
        headers: { "Cache-Control": "no-store" },
        signal: controller.signal,
      });

      // On 401 or 403: Stop polling silently without redirecting or showing error
      if (res.status === 401 || res.status === 403) {
        authTerminatedRef.current = true;
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        return;
      }

      if (!res.ok) {
        throw new Error(`Counts API error: ${res.status}`);
      }

      const data: AdminCountsData = await res.json();
      const newOrders = Number(data.orders) || 0;
      const newInquiries = Number(data.inquiries) || 0;

      // Successful response: reset backoff interval
      backoffRef.current = DEFAULT_POLL_INTERVAL_MS;

      // Check if counts increased (only after initial load has finished)
      if (!isFirstLoadRef.current) {
        let increased = false;

        // 1. Orders increased check
        if (newOrders > prevOrdersRef.current) {
          increased = true;
          setOrdersPulsing(true);
          if (pulseTimerOrdersRef.current) clearTimeout(pulseTimerOrdersRef.current);
          pulseTimerOrdersRef.current = setTimeout(() => setOrdersPulsing(false), 3000);

          const orderTitle = data.latestOrder ? `New order ${data.latestOrder}` : "New order received";
          showToast(orderTitle, "Requires artisan fulfillment review.", {
            url: "/admin/orders",
            label: "Review Orders →",
          });
        }

        // 2. Inquiries increased check
        if (newInquiries > prevInquiriesRef.current) {
          increased = true;
          setInquiriesPulsing(true);
          if (pulseTimerInquiriesRef.current) clearTimeout(pulseTimerInquiriesRef.current);
          pulseTimerInquiriesRef.current = setTimeout(() => setInquiriesPulsing(false), 3000);

          const inquiryTitle = data.latestInquiry ? `New custom request ${data.latestInquiry}` : "New custom inquiry";
          showToast(inquiryTitle, "A collector submitted a custom commission proposal.", {
            url: "/admin/custom-requests",
            label: "Review Inquiries →",
          });
        }

        // Play chime only if count increased and sound is enabled
        if (increased) {
          playNotificationChime();
        }
      }

      // Update state and tracking refs
      isFirstLoadRef.current = false;
      prevOrdersRef.current = newOrders;
      prevInquiriesRef.current = newInquiries;
      setOrdersCount(newOrders);
      setInquiriesCount(newInquiries);
      setLatestOrder(data.latestOrder || null);
      setLatestInquiry(data.latestInquiry || null);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return; // Request was cleanly cancelled
      }
      // Exponential backoff up to 2 minutes on network/server errors
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
    } finally {
      activeAbortRef.current = null;
    }
  }, [showToast]);

  // Master polling loop and event bindings
  useEffect(() => {
    let isSubscribed = true;

    // Record initial base title
    if (typeof document !== "undefined" && !baseTitleRef.current) {
      baseTitleRef.current = document.title || "Studio Admin | CLAWCRAFT";
    }

    const scheduleNextPoll = () => {
      if (!isSubscribed || authTerminatedRef.current) return;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);

      pollTimerRef.current = setTimeout(async () => {
        if (!isSubscribed) return;
        if (typeof document !== "undefined" && !document.hidden) {
          await fetchCounts();
        }
        scheduleNextPoll();
      }, backoffRef.current);
    };

    // Initial fetch on mount
    fetchCounts().then(() => {
      scheduleNextPoll();
    });

    // Handle tab visibility and window focus
    const handleVisibilityOrFocus = () => {
      if (typeof document === "undefined") return;
      if (document.hidden) {
        // Tab is hidden: clear current timer to pause completely
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      } else {
        // Tab became visible or window focused: fetch immediately and restart interval
        fetchCounts().then(() => {
          scheduleNextPoll();
        });
      }
    };

    // Immediate refetch event triggered by admin actions (order/inquiry status changes)
    const handleImmediateRefresh = () => {
      fetchCounts();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("visibilitychange", handleVisibilityOrFocus);
      window.addEventListener("focus", handleVisibilityOrFocus);
      window.addEventListener(ADMIN_COUNTS_REFRESH_EVENT, handleImmediateRefresh);
    }

    return () => {
      isSubscribed = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (pulseTimerOrdersRef.current) clearTimeout(pulseTimerOrdersRef.current);
      if (pulseTimerInquiriesRef.current) clearTimeout(pulseTimerInquiriesRef.current);
      if (activeAbortRef.current) activeAbortRef.current.abort();

      if (typeof window !== "undefined") {
        window.removeEventListener("visibilitychange", handleVisibilityOrFocus);
        window.removeEventListener("focus", handleVisibilityOrFocus);
        window.removeEventListener(ADMIN_COUNTS_REFRESH_EVENT, handleImmediateRefresh);

        // Restore clean browser tab title upon unmount / leaving admin
        if (baseTitleRef.current) {
          document.title = baseTitleRef.current.replace(/^\(\d+\)\s*/, "");
        }
      }
    };
  }, [fetchCounts]);

  // Update browser tab title: prefix "(N) " with total count while above 0
  useEffect(() => {
    if (typeof document === "undefined") return;

    const total = ordersCount + inquiriesCount;
    const cleanTitle = (baseTitleRef.current || document.title || "Studio Admin | CLAWCRAFT").replace(
      /^\(\d+\)\s*/,
      ""
    );

    if (total > 0) {
      document.title = `(${total}) ${cleanTitle}`;
    } else {
      document.title = cleanTitle;
    }
  }, [ordersCount, inquiriesCount]);

  return {
    ordersCount,
    inquiriesCount,
    latestOrder,
    latestInquiry,
    ordersPulsing,
    inquiriesPulsing,
    soundEnabled,
    toggleSound,
    refetch: fetchCounts,
  };
}
