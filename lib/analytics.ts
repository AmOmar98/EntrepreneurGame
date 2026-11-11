/**
 * Analytics helper — no-op-safe event capture for the EIC funnel.
 *
 * All calls are silent no-ops when NEXT_PUBLIC_POSTHOG_KEY is absent
 * (demo mode, CI, local dev without key). NEVER throws.
 *
 * R1 CARDINAL: props MUST NOT include score / rank / note / total /
 * percentile or any numeric grade. Technical ids only (deliverableTemplateId,
 * submissionId, version). Enforce at the call site and in the R1 grep gate.
 */

// Event name constants for the product funnel.
export const ANALYTICS_EVENTS = {
  eg_onboarding_completed: "eg_onboarding_completed",
  eg_deliverable_submitted: "eg_deliverable_submitted",
  eg_deliverable_validated: "eg_deliverable_validated",
  eg_mentor_eval_submitted: "eg_mentor_eval_submitted",
} as const;

// Internal ref to the posthog instance, set by AnalyticsProvider after lazy init.
// Stays undefined on the server and when no key is configured.
type PostHogInstance = {
  capture: (event: string, props?: Record<string, unknown>) => void;
  __loaded?: boolean;
};

let _posthog: PostHogInstance | undefined;

/**
 * Called by AnalyticsProvider after posthog.init() to wire the instance.
 * Not exported for public use — internal contract between provider and helper.
 */
export function _setPostHogInstance(instance: PostHogInstance): void {
  _posthog = instance;
}

/**
 * Capture a funnel event. If posthog is not yet loaded (no key, or called
 * before provider mount), this is a silent no-op.
 *
 * @param event  - one of the ANALYTICS_EVENTS constants (eg_* names).
 * @param props  - optional technical-id props.
 *                 R1: NEVER pass score/rank/note/total/percentile here.
 */
export function captureEvent(
  event: string,
  props?: Record<string, string | number | boolean>,
): void {
  try {
    if (_posthog && _posthog.__loaded) {
      _posthog.capture(event, props);
    }
  } catch {
    // Swallow all errors — analytics must never break the app.
  }
}
