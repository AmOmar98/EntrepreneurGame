"use client";
// Phase 9 / GMR-01 — Admin live mode toggle.
// Drives the `?live=1` query parameter on /admin. Reload-based — no
// client-side state mirroring Realtime, in line with Phase 9 pragmatic posture.

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

type Props = {
  liveMode: boolean;
};

export function AdminLiveToggle({ liveMode }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const next = new URLSearchParams(params?.toString() ?? "");
    if (liveMode) next.delete("live");
    else next.set("live", "1");
    const qs = next.toString();
    const url = qs ? `/admin?${qs}` : "/admin";
    startTransition(() => {
      router.push(url);
      router.refresh();
    });
  }

  const label = liveMode ? t.admin_live_mode_on : t.admin_live_mode_off;
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`eic-admin-live-toggle ${liveMode ? "is-on" : ""}`}
      aria-pressed={liveMode}
      aria-label={t.admin_live_toggle_label}
      disabled={pending}
    >
      <span>{t.admin_live_toggle_label}</span>
      <span className="eic-admin-live-toggle__indicator" aria-hidden="true" />
      <span className="eic-admin-live-toggle__caption">{label}</span>
    </button>
  );
}
