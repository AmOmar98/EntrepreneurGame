"use client";
// Phase 10 / Section 14 — Settings form (localStorage persistence).
// 4 sections : Apparence (dark/light) · Notifications · Compte · Avance.

import { useEffect, useState } from "react";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

const STORAGE_KEY = "entrepreneur-game.settings";

type Settings = {
  darkMode: boolean;
  notifAnnouncements: boolean;
  notifPixel: boolean;
  notifEmail: boolean;
};

const DEFAULTS: Settings = {
  darkMode: false,
  notifAnnouncements: true,
  notifPixel: true,
  notifEmail: false,
};

function applyTheme(dark: boolean) {
  if (typeof document === "undefined") return;
  if (dark) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function SettingsForm({ accountEmail }: { accountEmail?: string }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...DEFAULTS, ...JSON.parse(raw) };
        setSettings(parsed);
        applyTheme(!!parsed.darkMode);
      }
    } catch {
      // ignore
    }
  }, []);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((s) => {
      const next = { ...s, [key]: value };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      if (key === "darkMode") applyTheme(!!value);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1400);
      return next;
    });
  };

  const handleResetLocal = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem("entrepreneur-game.pitch-prep.checklist");
    } catch {
      // ignore
    }
    setSettings(DEFAULTS);
    applyTheme(false);
  };

  const deleteMailto = `mailto:eic-admin@uemf.ma?subject=${encodeURIComponent(
    "Demande de suppression de compte",
  )}&body=${encodeURIComponent(
    "Bonjour,\n\nJe souhaite la suppression de mon compte Entrepreneur Game.\n\nMerci.",
  )}`;

  return (
    <article className="eic-settings">
      <header className="eic-settings__header">
        <h1>{t.settings_title}</h1>
        <p>{t.settings_lead}</p>
      </header>

      {saved ? <span className="eic-settings__saved">{t.settings_save}</span> : null}

      <section className="eic-settings__section">
        <h2>{t.settings_section_appearance}</h2>
        <Toggle
          label={t.settings_appearance_dark}
          desc={t.settings_appearance_dark_desc}
          checked={settings.darkMode}
          onChange={(v) => update("darkMode", v)}
        />
      </section>

      <section className="eic-settings__section">
        <h2>{t.settings_section_notifications}</h2>
        <Toggle
          label={t.settings_notif_announcements}
          checked={settings.notifAnnouncements}
          onChange={(v) => update("notifAnnouncements", v)}
        />
        <Toggle
          label={t.settings_notif_pixel}
          checked={settings.notifPixel}
          onChange={(v) => update("notifPixel", v)}
        />
        <Toggle
          label={t.settings_notif_email}
          checked={settings.notifEmail}
          onChange={(v) => update("notifEmail", v)}
        />
      </section>

      <section className="eic-settings__section">
        <h2>{t.settings_section_account}</h2>
        {accountEmail ? (
          <p className="eic-settings__field">
            <span className="eic-settings__label">{t.settings_account_email}</span>
            <span className="eic-settings__value">{accountEmail}</span>
          </p>
        ) : null}
        <a className="eic-button eic-button--ghost" href={deleteMailto}>
          {t.settings_account_delete}
        </a>
        <p className="eic-settings__hint">{t.settings_account_delete_desc}</p>
      </section>

      <section className="eic-settings__section">
        <h2>{t.settings_section_advanced}</h2>
        <button
          type="button"
          onClick={handleResetLocal}
          className="eic-button eic-button--ghost"
        >
          {t.settings_advanced_reset_local}
        </button>
        <p className="eic-settings__hint">{t.settings_advanced_reset_local_desc}</p>
      </section>
    </article>
  );
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="eic-settings__toggle">
      <span>
        <strong>{label}</strong>
        {desc ? <span className="eic-settings__hint">{desc}</span> : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
        aria-label={label}
      />
    </label>
  );
}
