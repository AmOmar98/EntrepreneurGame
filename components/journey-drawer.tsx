"use client";
// Phase 7 / Plan 07-01 - Side drawer surfaced when a level node is clicked.
// Desktop = 420px right-anchored, mobile = full-width. ESC + click-outside
// close. Animates translateX from right (CSS keyframes, prefers-reduced-motion
// guarded).
//
// PLR-04: panel with missions/livrables, code Mx.y, title, status pill,
//         reward XP, contextual action button.
import { useCallback, useEffect, useMemo, useRef } from "react";
import { JourneyDeliverableCard } from "@/components/journey-deliverable-card";
import { getShortLevelLabel, getLevelNumber, type LevelState } from "@/lib/journey-progression";
import { dictionaries } from "@/lib/i18n";
import type { JourneyMission } from "@/lib/journey";
import type { LevelId } from "@/lib/types";

const t = dictionaries.fr;

export type JourneyDrawerProps = {
  levelId: LevelId;
  state: LevelState;
  missions: JourneyMission[];
  objective?: string | null;
  onClose: () => void;
};

// Synthesize a mission code "Mx.y" from level number + mission ord.
// Pilot-grade: Phase 8 may switch to a stored mission.code column.
function makeMissionCode(levelId: LevelId, missionOrd: number, deliverableOrd: number): string {
  const lvl = getLevelNumber(levelId);
  return `M${lvl}.${missionOrd + deliverableOrd}`;
}

export function JourneyDrawer({
  levelId,
  state,
  missions,
  objective,
  onClose,
}: JourneyDrawerProps) {
  // ESC closes the drawer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll while drawer open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // A11y: save trigger element, autoFocus drawer, restore focus on unmount.
  const drawerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    drawerRef.current?.focus();
    return () => {
      previouslyFocused?.focus?.();
    };
  }, []);

  const handleBackdrop = useCallback(() => onClose(), [onClose]);

  const number = getLevelNumber(levelId);
  const label = getShortLevelLabel(levelId);

  const iconClass = useMemo(() => {
    const base = "eic-drawer__icon";
    if (state === "done") return `${base} is-done`;
    if (state === "current") return `${base} is-current`;
    return `${base} is-locked`;
  }, [state]);

  // Collect deliverables for this level. Each mission may contribute multiple
  // deliverables; we use mission.ord + deliverable index as the M-code suffix.
  const cards = missions
    .filter((m) => m.mission.levelId === levelId)
    .flatMap((m, mi) =>
      m.deliverables.map((d, di) => ({
        deliverable: d,
        mission: m.mission,
        code: makeMissionCode(levelId, mi + 1, di),
      })),
    );

  return (
    <>
      <button
        aria-label={t.journey_v2_drawer_close}
        className="eic-drawer-backdrop"
        onClick={handleBackdrop}
        type="button"
      />
      <aside
        aria-labelledby="eic-drawer-title"
        aria-modal="true"
        className="eic-drawer"
        ref={drawerRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="eic-drawer__header">
          <span aria-hidden="true" className={iconClass}>
            L{number}
          </span>
          <div className="eic-drawer__head-text">
            <span className="eic-drawer__head-kicker">{t.journey_v2_drawer_kicker}</span>
            <h2 className="eic-drawer__head-title" id="eic-drawer-title">
              {label}
            </h2>
          </div>
          <button
            aria-label={t.journey_v2_drawer_close}
            className="eic-drawer__close"
            onClick={onClose}
            type="button"
          >
            {"✕"}
          </button>
        </header>

        {objective ? (
          <div className="eic-drawer__objective">
            <div className="eic-glass-tint" style={{ padding: "12px 14px" }}>
              <div className="eic-drawer__head-kicker" style={{ marginBottom: 4 }}>
                {t.journey_v2_drawer_objective}
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.4, margin: 0 }}>{objective}</p>
            </div>
          </div>
        ) : null}

        <div className="eic-drawer__body">
          {cards.length === 0 ? (
            // Quick 260510-j2j (T3-B2): locked => amber warn-only note (R2),
            // not the hard-stop t.journey_v2_drawer_locked text.
            state === "locked" ? (
              <p
                className="eic-locked-hint--amber"
                role="note"
                style={{ margin: 0 }}
              >
                {t.journey_v2_locked_hint_amber}
              </p>
            ) : (
              <p style={{ fontSize: 13, color: "var(--wf-ink-soft)", margin: 0 }}>
                {t.journey_no_deliverables}
              </p>
            )
          ) : (
            <>
              <div className="eic-drawer__head-kicker" style={{ marginBottom: 2 }}>
                {t.journey_v2_drawer_deliverables}
              </div>
              {cards.map(({ deliverable, mission, code }) => (
                <JourneyDeliverableCard
                  deliverable={deliverable}
                  key={deliverable.template.id}
                  mission={mission}
                  missionCode={code}
                />
              ))}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
