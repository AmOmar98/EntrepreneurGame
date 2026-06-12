import * as Sentry from "@sentry/nextjs";

/**
 * Capture a server-side error in Sentry without throwing.
 * No-op when SENTRY_DSN is absent (Sentry.captureException is itself a no-op
 * when init never ran), so this helper is safe in demo/CI mode.
 * Call this immediately before returning { ok: false, ... } in server actions
 * to report critical supabase write failures to Sentry.
 */
export function reportServerError(
  error: unknown,
  context?: Record<string, string>,
): void {
  Sentry.withScope((scope) => {
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        scope.setTag(key, value);
      }
    }
    Sentry.captureException(error);
  });
}
