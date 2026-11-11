"use client";

/**
 * AnalyticsProvider — env-gated, lazy PostHog init + automatic pageview capture.
 *
 * Behaviour:
 * - When NEXT_PUBLIC_POSTHOG_KEY is set: dynamically imports posthog-js on
 *   first mount (keeps SDK out of the main bundle), initializes it, and
 *   captures a $pageview on each pathname change.
 * - When the key is absent: the dynamic import never runs (zero bundle/runtime
 *   cost). All captureEvent calls from lib/analytics.ts remain no-ops.
 *
 * Privacy / R1:
 * - disable_session_recording: true — no session replays.
 * - autocapture: false       — only explicit eg_* events are sent.
 * - No score/rank/note in any event payload.
 *
 * Mounted inside <body> in app/layout.tsx (server component — no "use client"
 * required on the layout itself).
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { _setPostHogInstance } from "@/lib/analytics";

export function AnalyticsProvider(): null {
  const pathname = usePathname();
  // Use a ref so we track whether init ran across pathname changes.
  const initializedRef = useRef(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return; // No key → permanent no-op.

    if (!initializedRef.current) {
      // Lazy dynamic import — posthog-js stays out of the main bundle.
      import("posthog-js").then(({ default: posthog }) => {
        posthog.init(key, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
          capture_pageview: false,         // We capture pageviews manually below.
          disable_session_recording: true, // R1/privacy: session recording OFF.
          autocapture: false,              // Only explicit eg_* events are sent.
        });
        _setPostHogInstance(posthog);
        initializedRef.current = true;
        // Capture the initial pageview after init.
        posthog.capture("$pageview");
      });
    } else {
      // Subsequent pathname changes → capture pageview if already loaded.
      import("posthog-js").then(({ default: posthog }) => {
        if (posthog.__loaded) {
          posthog.capture("$pageview");
        }
      });
    }
  }, [pathname]);

  return null;
}
