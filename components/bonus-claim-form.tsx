// T3X-EXPANSION wave 3 / plan 08 — Player bonus claim form (D-02 / D-03).
// Pattern aligned on components/submission-form.tsx (link-based proof, mailto-free here).
// R1 preserved : no score / multiplier_factor in render.
// R3 preserved : no DOM disabled cross-mission, no blocks_progression_to.
"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { claimBonusEventFlow, type WorkflowState } from "@/app/actions";
import { dictionaries } from "@/lib/i18n";
import { BONUS_DEFAULTS, type BonusType } from "@/lib/types";

const t = dictionaries.fr;

const initialState: WorkflowState = { ok: false, message: "" };

export function BonusClaimForm({
  bonusType,
  defaultTitle,
}: {
  bonusType: BonusType;
  defaultTitle?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(claimBonusEventFlow, initialState);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  const initialTitle = defaultTitle ?? BONUS_DEFAULTS[bonusType]?.titleFr ?? "";

  return (
    <form
      action={formAction}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 16,
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        maxWidth: 640,
      }}
    >
      <input type="hidden" name="type" value={bonusType} />

      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
        <span style={{ fontWeight: 600, color: "#0f172a" }}>{t.bonus_claim_title_label}</span>
        <input
          type="text"
          name="title"
          defaultValue={initialTitle}
          required
          minLength={3}
          maxLength={200}
          aria-label={t.bonus_claim_title_label}
          style={{
            padding: "8px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            fontSize: 14,
          }}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
        <span style={{ fontWeight: 600, color: "#0f172a" }}>{t.bonus_claim_url_label}</span>
        <input
          type="url"
          name="docUrl"
          placeholder={t.bonus_claim_url_placeholder}
          required
          pattern="https://.*"
          aria-label={t.bonus_claim_url_label}
          style={{
            padding: "8px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            fontSize: 14,
          }}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
        <span style={{ fontWeight: 600, color: "#0f172a" }}>
          {t.bonus_claim_description_label}
        </span>
        <textarea
          name="description"
          rows={4}
          maxLength={2000}
          aria-label={t.bonus_claim_description_label}
          style={{
            padding: "8px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            fontSize: 14,
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        style={{
          padding: "10px 16px",
          background: pending ? "#94a3b8" : "#1d4ed8",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 600,
          cursor: pending ? "wait" : "pointer",
          alignSelf: "flex-start",
        }}
      >
        {pending ? t.bonus_claim_submitting : t.bonus_claim_submit}
      </button>

      {state.message ? (
        <p
          role={state.ok ? "status" : "alert"}
          style={{
            margin: 0,
            fontSize: 13,
            color: state.ok ? "#15803d" : "#b91c1c",
          }}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
