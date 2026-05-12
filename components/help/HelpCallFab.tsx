"use client";

// HelpCallFab (quick-260512-24v)
// Floating action button always visible across Player pages.
// R3: the FAB itself has NO `disabled` prop -- it is never gated by level,
// mission status, stuck-state or any pedagogical condition. Help is always
// reachable in 1 click.

import { LifeBuoy } from "lucide-react";
import { useState } from "react";
import { HelpRequestComposer } from "@/components/help/HelpRequestComposer";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export function HelpCallFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="eic-help-fab"
        aria-label={t.help_fab_aria}
        title={t.help_fab_label}
        onClick={() => setOpen(true)}
      >
        <LifeBuoy aria-hidden="true" size={20} />
        <span className="eic-help-fab__label">{t.help_fab_label}</span>
      </button>
      {open ? <HelpRequestComposer onClose={() => setOpen(false)} /> : null}
    </>
  );
}
