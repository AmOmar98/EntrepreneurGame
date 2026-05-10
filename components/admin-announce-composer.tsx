"use client";
// Phase 9 / GMR-09 — Admin announcements composer.
import { useActionState, useMemo, useState } from "react";
import { createAnnouncementFlow, type WorkflowState } from "@/app/actions";
import { dictionaries } from "@/lib/i18n";
import type { LevelId } from "@/lib/types";
import type {
  AnnouncementKind,
  AnnouncementTargetKind,
} from "@/lib/announcements";

const t = dictionaries.fr;

const initialState: WorkflowState = { ok: false, message: "" };

export type ComposerPlayer = {
  id: string;
  name: string;
};

export type ComposerLevel = {
  id: LevelId;
  label: string;
};

type Props = {
  players: ComposerPlayer[];
  levels: ComposerLevel[];
};

const KINDS: { id: AnnouncementKind; label: string; desc: string; tone: string }[] = [
  { id: "info", label: t.admin_announce_kind_info, desc: t.admin_announce_kind_info_desc, tone: "blue" },
  { id: "urgence", label: t.admin_announce_kind_urgence, desc: t.admin_announce_kind_urgence_desc, tone: "rose" },
  {
    id: "celebration",
    label: t.admin_announce_kind_celebration,
    desc: t.admin_announce_kind_celebration_desc,
    tone: "green",
  },
  { id: "appel", label: t.admin_announce_kind_appel, desc: t.admin_announce_kind_appel_desc, tone: "amber" },
];

const TARGETS: { id: AnnouncementTargetKind; label: string }[] = [
  { id: "all", label: t.admin_announce_target_all },
  { id: "level", label: t.admin_announce_target_level },
  { id: "teams", label: t.admin_announce_target_teams },
  { id: "mentors", label: t.admin_announce_target_mentors },
];

const MAX_BODY = 2000;

export function AdminAnnounceComposer({ players, levels }: Props) {
  const [state, formAction, pending] = useActionState(
    createAnnouncementFlow,
    initialState,
  );

  const [kind, setKind] = useState<AnnouncementKind>("info");
  const [targetKind, setTargetKind] = useState<AnnouncementTargetKind>("all");
  const [selectedLevels, setSelectedLevels] = useState<Set<LevelId>>(new Set());
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [body, setBody] = useState("");

  const targetIdsCsv = useMemo(() => {
    if (targetKind === "level") return Array.from(selectedLevels).join(",");
    if (targetKind === "teams") return Array.from(selectedPlayers).join(",");
    return "";
  }, [targetKind, selectedLevels, selectedPlayers]);

  function toggleLevel(id: LevelId) {
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePlayer(id: string) {
    setSelectedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form action={formAction} className="eic-admin-announce__composer">
      {/* Kind selector */}
      <fieldset className="eic-admin-announce__fieldset">
        <legend className="eic-admin-announce__legend">{t.admin_announce_kind_legend}</legend>
        <div className="eic-admin-announce__kinds">
          {KINDS.map((k) => (
            <label
              className={
                kind === k.id
                  ? `eic-admin-announce__kind eic-admin-announce__kind--selected eic-admin-announce__kind--${k.tone}`
                  : `eic-admin-announce__kind eic-admin-announce__kind--${k.tone}`
              }
              key={k.id}
            >
              <input
                checked={kind === k.id}
                name="kind"
                onChange={() => setKind(k.id)}
                type="radio"
                value={k.id}
              />
              <span className="eic-admin-announce__kind-label">{k.label}</span>
              <span className="eic-admin-announce__kind-desc">{k.desc}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Target selector */}
      <fieldset className="eic-admin-announce__fieldset">
        <legend className="eic-admin-announce__legend">{t.admin_announce_target_legend}</legend>
        <div className="eic-admin-announce__targets">
          {TARGETS.map((tg) => (
            <label
              className={
                targetKind === tg.id
                  ? "eic-admin-announce__target eic-admin-announce__target--selected"
                  : "eic-admin-announce__target"
              }
              key={tg.id}
            >
              <input
                checked={targetKind === tg.id}
                name="targetKind"
                onChange={() => setTargetKind(tg.id)}
                type="radio"
                value={tg.id}
              />
              <span>{tg.label}</span>
            </label>
          ))}
        </div>

        {targetKind === "level" ? (
          <div className="eic-admin-announce__chips" role="group" aria-label={t.admin_announce_levels_label}>
            {levels.map((lv) => {
              const checked = selectedLevels.has(lv.id);
              return (
                <label
                  className={
                    checked
                      ? "eic-admin-announce__chip eic-admin-announce__chip--checked"
                      : "eic-admin-announce__chip"
                  }
                  key={lv.id}
                >
                  <input
                    checked={checked}
                    onChange={() => toggleLevel(lv.id)}
                    type="checkbox"
                    value={lv.id}
                  />
                  <span>{lv.label}</span>
                </label>
              );
            })}
          </div>
        ) : null}

        {targetKind === "teams" ? (
          <div className="eic-admin-announce__chips" role="group" aria-label={t.admin_announce_teams_label}>
            {players.length === 0 ? (
              <p className="eic-admin-announce__empty">—</p>
            ) : (
              players.map((p) => {
                const checked = selectedPlayers.has(p.id);
                return (
                  <label
                    className={
                      checked
                        ? "eic-admin-announce__chip eic-admin-announce__chip--checked"
                        : "eic-admin-announce__chip"
                    }
                    key={p.id}
                  >
                    <input
                      checked={checked}
                      onChange={() => togglePlayer(p.id)}
                      type="checkbox"
                      value={p.id}
                    />
                    <span>{p.name}</span>
                  </label>
                );
              })
            )}
          </div>
        ) : null}

        {/* Hidden CSV fallback so the action can reconstruct targetIds even when
            the multi-select inputs are unmounted (target_kind=all/mentors). */}
        <input name="targetIdsCsv" type="hidden" value={targetIdsCsv} />
      </fieldset>

      {/* Body */}
      <fieldset className="eic-admin-announce__fieldset">
        <legend className="eic-admin-announce__legend">{t.admin_announce_body_label}</legend>
        <textarea
          aria-label={t.admin_announce_body_label}
          className="eic-admin-announce__textarea"
          maxLength={MAX_BODY}
          name="body"
          onChange={(e) => setBody(e.target.value)}
          placeholder={t.admin_announce_body_placeholder}
          required
          rows={5}
          value={body}
        />
        <p className="eic-admin-announce__counter">
          {body.length} {t.admin_announce_body_counter_suffix}
        </p>
      </fieldset>

      <div className="eic-admin-announce__actions">
        <button
          className="eic-button eic-button--primary eic-button--lg"
          disabled={pending || body.trim().length === 0}
          type="submit"
        >
          {pending ? t.admin_announce_submitting : t.admin_announce_submit}
        </button>
        {state.message ? (
          <p
            className={
              state.ok
                ? "eic-admin-announce__msg eic-admin-announce__msg--ok"
                : "eic-admin-announce__msg eic-admin-announce__msg--err"
            }
            role="status"
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
