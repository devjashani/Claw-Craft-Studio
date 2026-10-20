/**
 * ==============================================================================
 * CLAWCRAFT STUDIO ADMIN - ATTENTION STATUS CONFIGURATION
 * ==============================================================================
 * Single source of truth for "needs attention" definitions across the admin panel.
 * Defines which order and inquiry lifecycle states require artisan intervention.
 */

import { OrderStatus, CustomRequestStatus } from "@/types/database.types";

/**
 * ORDERS THAT NEED ATTENTION:
 * - Paid orders awaiting fulfillment: Payment is verified and the order is still
 *   in the initial fulfillment stage ('paid').
 * - Placed Cash-on-Delivery (COD) orders: If COD is enabled and placed, orders that
 *   are in 'paid' status or awaiting initial artisan review.
 *
 * NEVER COUNTED:
 * - 'pending_payment': Abandoned checkouts or uncompleted payment gateways.
 * - 'processing': Already picked up by workshop artisan and being crafted/packed.
 * - 'shipped': In transit with courier tracking number.
 * - 'delivered': Finished and received by customer.
 * - 'cancelled': Closed without fulfillment.
 * - 'refunded': Money returned, fulfillment aborted.
 */
export const ATTENTION_ORDER_STATUSES: readonly OrderStatus[] = ["paid"] as const;

/**
 * Valid payment statuses for orders that need attention.
 * Guarantees failed or unconfirmed payments are never counted.
 */
export const ATTENTION_ORDER_PAYMENT_STATUSES = ["paid", "cod"] as const;

/**
 * INQUIRIES THAT NEED ATTENTION:
 * - Custom commission requests with status 'new': Newly submitted proposals
 *   from collectors that have not yet been reviewed or quoted by the artisan.
 *
 * NOT COUNTED:
 * - 'reviewing', 'quoted', 'accepted', 'in_progress', 'completed', 'cancelled', 'declined'
 */
export const ATTENTION_INQUIRY_STATUSES: readonly CustomRequestStatus[] = ["new"] as const;

/**
 * Custom window event dispatched whenever an artisan updates an order
 * or custom request, so navigation badges immediately refresh without
 * waiting for the 30-second poll interval.
 */
export const ADMIN_COUNTS_REFRESH_EVENT = "clawcraft:admin-counts-refresh";

/**
 * Trigger an immediate refetch of admin notification badges across all open tabs/views.
 */
export function refreshAdminCounts(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ADMIN_COUNTS_REFRESH_EVENT));
  }
}

/**
 * Local storage key for optional notification chime sound.
 */
export const ADMIN_SOUND_STORAGE_KEY = "clawcraft_admin_sound_enabled";

/**
 * Custom window event dispatched whenever the artisan changes sound preferences
 * so the attention hook updates live across all pages without requiring a reload.
 */
export const ADMIN_SOUND_CHANGE_EVENT = "clawcraft:admin-sound-change";

/**
 * Read sound setting with fail-safe error handling.
 */
export function getAdminSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ADMIN_SOUND_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Persist sound setting with fail-safe error handling and dispatch change event.
 */
export function setAdminSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ADMIN_SOUND_STORAGE_KEY, enabled ? "true" : "false");
    window.dispatchEvent(
      new CustomEvent(ADMIN_SOUND_CHANGE_EVENT, { detail: { enabled } })
    );
  } catch {
    // localStorage unavailable or restricted
  }
}

/**
 * Play an elegant soft chime using Web Audio API synthesis.
 * Requires 0 external audio assets and executes with zero network latency.
 * Plays when sound is enabled in localStorage, or when force is true (e.g. Test Sound button).
 * Returns { success, blocked } to allow the caller to display browser permission hints if needed.
 */
export async function playNotificationChime(options?: {
  force?: boolean;
}): Promise<{ success: boolean; blocked: boolean }> {
  if (typeof window === "undefined") return { success: false, blocked: false };
  if (!options?.force && !getAdminSoundEnabled()) return { success: false, blocked: false };

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return { success: false, blocked: true };

    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }
    if (ctx.state === "suspended") {
      return { success: false, blocked: true };
    }

    const now = ctx.currentTime;

    // First harmonic: 587.33 Hz (D5) - soft bell attack
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.06, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second harmonic: 880 Hz (A5) - bright confirmation resonance
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.08);
    gain2.gain.setValueAtTime(0.06, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.45);

    return { success: true, blocked: false };
  } catch {
    return { success: false, blocked: true };
  }
}
