// Phase 10 / Section 14 — Reglages.
// localStorage-backed (no SQL migration). Server shell + client form.

import { AppShell } from "@/components/app-shell";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export const metadata = { title: t.settings_title };

export default function SettingsPage() {
  return (
    <AppShell role="player">
      <main className="main">
        <SettingsForm />
      </main>
    </AppShell>
  );
}
