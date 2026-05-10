// Phase 10 / Section 13 — Empty state with optional countdown.
// Server-renderable. targetDate optional → renders countdown if provided.

import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

type Action = {
  label: string;
  href?: string;
  description?: string;
};

type Props = {
  title?: string;
  lead?: string;
  // Optional ISO string. If past or absent, countdown line hidden.
  targetDate?: string | null;
  actions?: Action[];
  children?: React.ReactNode;
};

function formatCountdown(targetIso: string): string | null {
  const target = new Date(targetIso).getTime();
  const now = Date.now();
  const ms = target - now;
  if (Number.isNaN(ms) || ms <= 0) return null;
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin - days * 60 * 24) / 60);
  const mins = totalMin - days * 60 * 24 - hours * 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}${t.system_empty_countdown_days}`);
  if (hours > 0) parts.push(`${hours}${t.system_empty_countdown_hours}`);
  parts.push(`${mins}${t.system_empty_countdown_minutes}`);
  return parts.join(" ");
}

export function SysEmpty({
  title = t.system_empty_title,
  lead = t.system_empty_lead,
  targetDate,
  actions,
  children,
}: Props) {
  const countdown = targetDate ? formatCountdown(targetDate) : null;

  return (
    <section className="eic-sys eic-sys--empty">
      <h2 className="eic-sys__title">{title}</h2>
      <p className="eic-sys__lead">{lead}</p>
      {countdown ? (
        <p className="eic-sys__countdown">
          <span className="eic-sys__countdown-prefix">
            {t.system_empty_countdown_prefix}
          </span>
          <strong className="eic-sys__countdown-value">{countdown}</strong>
        </p>
      ) : null}
      <div className="eic-sys__divider" aria-hidden="true" />
      {actions && actions.length > 0 ? (
        <ul className="eic-sys__actions">
          {actions.map((a, i) => (
            <li key={i} className="eic-sys__action">
              {a.href ? (
                <a className="eic-button eic-button--primary" href={a.href}>
                  {a.label}
                </a>
              ) : (
                <span className="eic-sys__action-label">{a.label}</span>
              )}
              {a.description ? (
                <p className="eic-sys__action-desc">{a.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {children}
    </section>
  );
}
