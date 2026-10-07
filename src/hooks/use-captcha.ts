"use client";

import { useState, useCallback } from "react";

interface CaptchaHookOptions {
  enabled?: boolean;
  siteKey?: string;
}

/**
 * Hook for optional Cloudflare Turnstile or hCaptcha verification.
 * Disabled by default to keep friction low.
 */
export function useCaptcha(options: CaptchaHookOptions = {}) {
  const isEnabled = options.enabled ?? (process.env.NEXT_PUBLIC_ENABLE_CAPTCHA === "true");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const executeCaptcha = useCallback(async (): Promise<string | null> => {
    if (!isEnabled) {
      // CAPTCHA disabled - bypass without error
      return null;
    }

    setLoading(true);
    try {
      // If a global Turnstile/hCaptcha is loaded
      if (typeof window !== "undefined" && (window as any).turnstile) {
        const turnstileToken = await new Promise<string>((resolve) => {
          (window as any).turnstile.render("#captcha-container", {
            sitekey: options.siteKey || process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY,
            callback: (t: string) => resolve(t),
          });
        });
        setToken(turnstileToken);
        return turnstileToken;
      }
      return null;
    } catch (err) {
      console.warn("[Captcha Warning] Captcha execution bypassed:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isEnabled, options.siteKey]);

  const resetCaptcha = useCallback(() => {
    setToken(null);
  }, []);

  return {
    isEnabled,
    token,
    loading,
    executeCaptcha,
    resetCaptcha,
  };
}
