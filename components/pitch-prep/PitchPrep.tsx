"use client";
// Phase 10 / Section 10 — Pitch prep H-2 (Player J-1 pitch).
// Hero compte a rebours + checklist 5 items (localStorage) + ordre de
// passage (lecture seule) + brief jury + 3 rappels. Non-bloquant (R3).
// R1 : pas de pondération révélée, slot affiché uniquement après
// pitch_order_published_at (gate côté serveur via PitchPrepData).

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PitchPrepData } from "@/lib/pitch-prep";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

const STORAGE_KEY = "entrepreneur-game.pitch-prep.checklist";

const CHECKLIST = [
  { key: "deck", label: t.pitch_prep_checklist_deck },
  { key: "pitcheuse", label: t.pitch_prep_checklist_pitcheuse },
  { key: "brief", label: t.pitch_prep_checklist_brief },
  { key: "repete", label: t.pitch_prep_checklist_repete },
  { key: "backup", label: t.pitch_prep_checklist_backup },
];

type Props = {
  prep: PitchPrepData;
};

function formatHMS(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec - h * 3600) / 60);
  const s = totalSec - h * 3600 - m * 60;
  return [h, m, s]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

function formatHourFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function PitchPrep({ prep }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {
      // ignore
    }
  }, [checked]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const readyMs = prep.readyAt ? new Date(prep.readyAt).getTime() : null;
  const remainingMs = readyMs != null ? readyMs - now : null;

  const toggle = (k: string) => () =>
    setChecked((c) => ({ ...c, [k]: !c[k] }));

  return (
    <article className="eic-pitchprep">
      <header className="eic-pitchprep__header">
        <p className="eic-pitchprep__kicker">
          <span>{t.pitch_prep_kicker}</span>
          <span className="eic-pitchprep__subkicker">— {t.pitch_prep_subkicker}</span>
        </p>
        <h1 className="eic-pitchprep__title">{t.pitch_prep_title}</h1>
        <p className="eic-pitchprep__lead">{t.pitch_prep_lead}</p>
        {prep.published && remainingMs != null ? (
          <p className="eic-pitchprep__countdown">
            <span className="eic-pitchprep__countdown-prefix">
              {t.pitch_prep_countdown_label}
            </span>
            <strong className="eic-pitchprep__countdown-value">
              {remainingMs > 0 ? formatHMS(remainingMs) : t.pitch_prep_countdown_done}
            </strong>
          </p>
        ) : null}
      </header>

      <section aria-labelledby="pitch-checklist" className="eic-pitchprep__section">
        <h2 id="pitch-checklist" className="eic-pitchprep__section-title">
          {t.pitch_prep_checklist_title}
        </h2>
        <ul className="eic-pitchprep__checklist">
          {CHECKLIST.map((item) => (
            <li key={item.key} className="eic-pitchprep__check-item">
              <label>
                <input
                  type="checkbox"
                  checked={!!checked[item.key]}
                  onChange={toggle(item.key)}
                />
                <span>{item.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="pitch-order" className="eic-pitchprep__section">
        <h2 id="pitch-order" className="eic-pitchprep__section-title">
          {t.pitch_prep_order_title}
        </h2>
        {prep.published && prep.position != null ? (
          <>
            <p className="eic-pitchprep__order">
              {prep.position === 1
                ? t.pitch_order_first
                : t.pitch_order_announced.replace(
                    "{position}",
                    String(prep.position),
                  )}
            </p>
            {prep.readyAt ? (
              <p className="eic-pitchprep__order-meta">
                ⏱ {formatHourFr(prep.readyAt)}
              </p>
            ) : null}
            <p className="eic-pitchprep__order-explainer">
              {t.pitch_order_explainer}
            </p>
          </>
        ) : (
          <p className="eic-pitchprep__order-pending">{t.pitch_order_pending}</p>
        )}
      </section>

      <section aria-labelledby="pitch-brief" className="eic-pitchprep__section">
        <h2 id="pitch-brief" className="eic-pitchprep__section-title">
          {t.pitch_prep_brief_title}
        </h2>
        <p className="eic-pitchprep__brief-intro">
          <em>{t.pitch_prep_brief_intro}</em>
        </p>
        <ul className="eic-pitchprep__brief">
          <li>{t.pitch_prep_brief_innovation}</li>
          <li>{t.pitch_prep_brief_feasibility}</li>
          <li>{t.pitch_prep_brief_business}</li>
          <li>{t.pitch_prep_brief_evidence}</li>
        </ul>
      </section>

      <section aria-labelledby="pitch-reminders" className="eic-pitchprep__section">
        <h2 id="pitch-reminders" className="eic-pitchprep__section-title">
          {t.pitch_prep_reminders_title}
        </h2>
        <ol className="eic-pitchprep__reminders">
          <li>{t.pitch_prep_reminder_1}</li>
          <li>{t.pitch_prep_reminder_2}</li>
          <li>{t.pitch_prep_reminder_3}</li>
        </ol>
      </section>

      <Link className="eic-button eic-button--ghost" href="/journey">
        ← {t.help_stuck_back}
      </Link>
    </article>
  );
}
