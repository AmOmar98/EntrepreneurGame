"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { TopbarLite } from "@/components/topbar-lite";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export type AppRole = "player" | "mentor" | "game_master";
export type AppShellVariant = "player" | "staff";

const navItems: Record<AppRole, { href: string; label: string }[]> = {
  player: [{ href: "/journey", label: t.nav_player_journey }],
  mentor: [{ href: "/mentor", label: t.nav_mentor_evaluations }],
  game_master: [
    { href: "/admin", label: t.nav_game_master_admin },
    { href: "/admin/players/import", label: t.nav_game_master_import },
  ],
};

const playerTabs = [
  { href: "/journey", label: t.mobile_tab_journey, key: "journey" },
];

export function AppShell({
  children,
  role,
  variant,
  hideTabBar,
}: {
  children: React.ReactNode;
  role: AppRole;
  variant?: AppShellVariant;
  hideTabBar?: boolean;
}) {
  const resolvedVariant: AppShellVariant = variant ?? "staff";
  const items = navItems[role];

  if (resolvedVariant === "player") {
    return (
      <div className="eic-shell eic-shell--player">
        <TopbarLite
          brandName={t.brand_name}
          brandSubtitle={t.brand_subtitle}
          logoutLabel={t.nav_logout}
          navItems={items}
        />
        <main className="eic-shell__main">{children}</main>
        {hideTabBar ? null : <MobileTabBar items={playerTabs} />}
      </div>
    );
  }

  return <StaffShell items={items}>{children}</StaffShell>;
}

function StaffShell({
  children,
  items,
}: {
  children: React.ReactNode;
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <aside aria-label="Primary navigation" className="sidebar eic-staff-sidebar">
        <div className="brand">
          <Image
            alt="EIC - UEMF"
            className="brand-logo"
            height={64}
            priority
            src="/brand/logo-eic.svg"
            width={240}
          />
          <span className="brand-tagline">{t.brand_tagline_short}</span>
        </div>
        <nav className="nav">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "is-active" : undefined}
                href={item.href}
                key={item.href}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="eic-staff-sidebar__logout">
          <LogoutButton className="eic-staff-sidebar__logout-btn">
            {t.nav_logout}
          </LogoutButton>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
