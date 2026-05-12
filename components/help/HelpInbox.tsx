// HelpInbox (quick-260512-24v)
// Server component: lists unresolved help_requests with acknowledge/resolve
// actions. Idempotent server actions, no R1/R2/R3 surfaces.

import {
  acknowledgeHelpRequest,
  assignHelpRequest,
  resolveHelpRequest,
} from "@/app/actions";
import { listHelpRequests } from "@/lib/help-requests";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import { createClient } from "@/utils/supabase/server";
import type { HelpRequest } from "@/lib/types";

// quick-260512-24v deferred #3: fetch current mentor id (nullable) so
// the inbox can render an "assignée à moi" / "non claimée" badge and a
// "Je prends" button. Demo mode returns null silently.
async function getCurrentUserId(): Promise<string | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

const t = dictionaries.fr;

function formatRelative(iso: string): string {
  const ts = new Date(iso).getTime();
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "a l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

function StatusBadge({ status }: { status: HelpRequest["status"] }) {
  const label =
    status === "open"
      ? t.help_inbox_status_open
      : status === "acknowledged"
        ? t.help_inbox_status_acknowledged
        : t.help_inbox_status_resolved;
  return (
    <span
      className={`eic-help-inbox__status eic-help-inbox__status--${status}`}
    >
      {label}
    </span>
  );
}

export async function HelpInbox() {
  const [requests, currentUserId] = await Promise.all([
    listHelpRequests({ onlyUnresolved: true }),
    getCurrentUserId(),
  ]);
  if (requests.length === 0) {
    return (
      <section
        className="eic-help-inbox eic-help-inbox--empty"
        aria-label={t.help_inbox_title}
      >
        <h3 className="eic-help-inbox__title">{t.help_inbox_title}</h3>
        <p className="eic-help-inbox__empty">{t.help_inbox_empty}</p>
      </section>
    );
  }
  return (
    <section className="eic-help-inbox" aria-label={t.help_inbox_title}>
      <h3 className="eic-help-inbox__title">
        {t.help_inbox_title} ({requests.length})
      </h3>
      <ul className="eic-help-inbox__list">
        {requests.map((r) => (
          <li key={r.id} className="eic-help-inbox__item">
            <header className="eic-help-inbox__header">
              <StatusBadge status={r.status} />
              {r.missionContext ? (
                <span className="eic-help-inbox__mission-chip">
                  <span aria-hidden="true">📍</span> {r.missionContext}
                </span>
              ) : null}
              {r.assignedMentorId && r.assignedMentorId === currentUserId ? (
                <span className="eic-help-inbox__assigned-chip eic-help-inbox__assigned-chip--me">
                  {t.help_inbox_assigned_me}
                </span>
              ) : r.assignedMentorId ? (
                <span className="eic-help-inbox__assigned-chip">
                  {t.help_inbox_assigned_other}
                </span>
              ) : null}
              <span className="eic-help-inbox__time">
                {formatRelative(r.createdAt)}
              </span>
            </header>
            <p className="eic-help-inbox__message">{r.message}</p>
            <footer className="eic-help-inbox__actions">
              {!r.assignedMentorId ? (
                <form action={assignHelpRequest}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    className="eic-help-inbox__btn eic-help-inbox__btn--claim"
                  >
                    {t.help_inbox_claim}
                  </button>
                </form>
              ) : null}
              {r.status === "open" ? (
                <form action={acknowledgeHelpRequest}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    className="eic-help-inbox__btn eic-help-inbox__btn--ack"
                  >
                    {t.help_inbox_acknowledge}
                  </button>
                </form>
              ) : null}
              <form action={resolveHelpRequest}>
                <input type="hidden" name="id" value={r.id} />
                <button
                  type="submit"
                  className="eic-help-inbox__btn eic-help-inbox__btn--resolve"
                >
                  {t.help_inbox_resolve}
                </button>
              </form>
            </footer>
          </li>
        ))}
      </ul>
    </section>
  );
}
