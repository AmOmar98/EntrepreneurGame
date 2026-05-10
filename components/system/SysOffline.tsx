"use client";
// Phase 10 / Section 13 — Offline banner (navigator.onLine listener).
// Mounted somewhere global (e.g. app/layout.tsx). Hidden when online.

import { useEffect, useState } from "react";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

type Props = {
  // Optional list of pending mutations queued client-side.
  pendingActions?: Array<{ id: string; label: string }>;
  // Optional sections to show what works/doesn't work.
  okItems?: string[];
  koItems?: string[];
};

export function SysOffline({
  pendingActions = [],
  okItems = [],
  koItems = [],
}: Props) {
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    const update = () =>
      setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return null;

  return (
    <aside
      className="eic-sys eic-sys--offline"
      role="status"
      aria-live="polite"
    >
      <h2 className="eic-sys__title">{t.system_offline_title}</h2>
      <p className="eic-sys__lead">{t.system_offline_lead}</p>
      {(okItems.length > 0 || koItems.length > 0) ? (
        <div className="eic-sys__cols">
          <div className="eic-sys__col eic-sys__col--ok">
            <h3>{t.system_offline_section_ok}</h3>
            <ul>
              {okItems.map((it, i) => (
                <li key={i}>✓ {it}</li>
              ))}
            </ul>
          </div>
          <div className="eic-sys__col eic-sys__col--ko">
            <h3>{t.system_offline_section_ko}</h3>
            <ul>
              {koItems.map((it, i) => (
                <li key={i}>✗ {it}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
      {pendingActions.length > 0 ? (
        <div className="eic-sys__pending">
          <h3>{t.system_offline_pending_label}</h3>
          <ul>
            {pendingActions.map((a) => (
              <li key={a.id}>{a.label}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
