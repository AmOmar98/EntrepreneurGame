// Phase 9 / GMR-08 — Admin status banner.
// Surfaces the cohort-wide hack status (serein / concentre / inquiet /
// euphorique) above the admin dashboard, plus a contextual micro-action
// link when the situation calls for one.
//
// Server component (no client state) — re-rendered on every page load,
// which matches the "no Realtime" pragmatic posture of Phase 9.
import Link from "next/link";
import type { HackStatus, HackStatusResult } from "@/lib/hack-status";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

type Props = {
  result: HackStatusResult;
};

const STATUS_LABEL: Record<HackStatus, string> = {
  serein: t.admin_status_serein,
  concentre: t.admin_status_concentre,
  inquiet: t.admin_status_inquiet,
  euphorique: t.admin_status_euphorique,
};

const STATUS_ICON: Record<HackStatus, string> = {
  serein: "✓",
  concentre: "◆",
  inquiet: "⚠",
  euphorique: "✨",
};

export function AdminStatusBanner({ result }: Props) {
  const { status, staleCount, recentValidatedCount, microAction } = result;
  const message = formatMessage(status, {
    stale: staleCount,
    validated: recentValidatedCount,
  });

  return (
    <div
      role="status"
      aria-live="polite"
      className={`eic-admin-status eic-admin-status--${status}`}
    >
      <span className="eic-admin-status__icon" aria-hidden="true">
        {STATUS_ICON[status]}
      </span>
      <span className="eic-admin-status__label">{STATUS_LABEL[status]}</span>
      <span className="eic-admin-status__message">{message}</span>
      {microAction ? (
        microAction.href ? (
          <Link
            className="eic-admin-status__cta"
            href={microAction.href}
          >
            {microAction.label} →
          </Link>
        ) : (
          <span className="eic-admin-status__cta eic-admin-status__cta--static">
            {microAction.label}
          </span>
        )
      ) : null}
    </div>
  );
}

function formatMessage(
  status: HackStatus,
  counts: { stale: number; validated: number },
): string {
  switch (status) {
    case "serein":
      return t.admin_status_message_serein;
    case "concentre":
      return t.admin_status_message_concentre;
    case "inquiet":
      return t.admin_status_message_inquiet.replace(
        "{n}",
        String(counts.stale),
      );
    case "euphorique":
      return t.admin_status_message_euphorique.replace(
        "{n}",
        String(counts.validated),
      );
  }
}
