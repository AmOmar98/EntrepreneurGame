"use client";
// Phase 10 / Section 14 — Menu lateral slide-in droite.
// Mounted from app shell topbar trigger. Overlay flouté + ESC close.

import { useEffect, useState } from "react";
import Link from "next/link";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

type MenuLink = {
  href: string;
  label: string;
};

const GROUPS: Array<{ title: string; links: MenuLink[] }> = [
  {
    title: t.menu_group_game,
    links: [
      { href: "/journey", label: t.menu_link_journey },
      { href: "/journey/pitch-prep", label: t.menu_link_pitch_prep },
    ],
  },
  {
    title: t.menu_group_community,
    links: [
      { href: "/journey/help", label: t.menu_link_help },
    ],
  },
  {
    title: t.menu_group_journey,
    links: [
      { href: "/results", label: t.menu_link_results },
    ],
  },
  {
    title: t.menu_group_settings,
    links: [
      { href: "/settings", label: t.menu_link_settings },
    ],
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SideMenu({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="eic-side-menu" role="dialog" aria-modal="true" aria-label={t.menu_open}>
      <button
        type="button"
        className="eic-side-menu__overlay"
        onClick={onClose}
        aria-label={t.menu_close}
      />
      <aside className="eic-side-menu__panel">
        <header className="eic-side-menu__header">
          <span className="eic-side-menu__brand">Pixel · L4</span>
          <button
            type="button"
            className="eic-side-menu__close"
            onClick={onClose}
            aria-label={t.menu_close}
          >
            ×
          </button>
        </header>
        <div className="eic-side-menu__body">
          {GROUPS.map((g) => (
            <section key={g.title} className="eic-side-menu__group">
              <h3>{g.title}</h3>
              <ul>
                {g.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} onClick={onClose}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}

export function SideMenuTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="eic-side-menu__trigger"
        onClick={() => setOpen(true)}
        aria-label={t.menu_open}
      >
        ≡
      </button>
      <SideMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
