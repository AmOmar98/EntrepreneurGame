"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AppRole = "player" | "mentor" | "game_master";

const navItems: Record<AppRole, { href: string; label: string }[]> = {
  player: [{ href: "/journey", label: "Mon parcours" }],
  mentor: [{ href: "/coach", label: "Evaluations" }], // route renamed in plan 04
  game_master: [{ href: "/admin", label: "Admin" }],
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
          <strong>Entrepreneur Game</strong>
          <span>EIC / UEMF pilot</span>
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
