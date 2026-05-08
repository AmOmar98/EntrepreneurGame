"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export type AppRole = "player" | "mentor" | "game_master";

const navItems: Record<AppRole, { href: string; label: string }[]> = {
  player: [{ href: "/journey", label: t.nav_player_journey }],
  mentor: [{ href: "/mentor", label: t.nav_mentor_evaluations }],
  game_master: [{ href: "/admin", label: t.nav_game_master_admin }],
};

export function AppShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: AppRole;
}) {
  const pathname = usePathname();
  const items = navItems[role];

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <strong>{t.brand_name}</strong>
          <span>{t.tagline}</span>
        </div>
        <nav className="nav">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                href={item.href}
                key={item.href}
                style={active ? { background: "rgba(255,255,255,0.14)" } : undefined}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
