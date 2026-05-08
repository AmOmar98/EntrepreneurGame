"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type AppRole, journeyPhases, navItems } from "@/lib/data";

export function AppShell({
  children,
  role = "eic_admin",
}: {
  children: React.ReactNode;
  role?: AppRole;
}) {
  const pathname = usePathname();
  const visibleNav = navItems.filter((item) => item.roles.includes(role));
  const currentPhase =
    pathname.startsWith("/startup") || pathname.startsWith("/coach")
      ? "bootcamp"
      : pathname.startsWith("/committee")
        ? "committee"
        : pathname.startsWith("/admin")
          ? "validation"
          : pathname.startsWith("/journey")
            ? "entering"
            : "bootcamp";

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <strong>EIC Venture Journey</strong>
          <span>Founder game ops for pilot-2026-S1</span>
        </div>
        <nav className="nav">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                href={item.href}
                key={item.href}
                style={active ? { background: "rgba(255,255,255,0.14)" } : undefined}
              >
                <Icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="journey-rail" aria-label="Program workflow">
          {journeyPhases.map((phase) => (
            <Link
              className={phase.id === currentPhase ? "journey-step active" : "journey-step"}
              href="/journey"
              key={phase.id}
            >
              <span>{phase.label}</span>
            </Link>
          ))}
        </div>
        <div className="sidebar-footer">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="status-dot" aria-hidden="true" />
            <strong>Pilot stack nominal</strong>
          </div>
          <span>Supabase self-hosted, mailto-only notifications, RPO 24h / RTO 4h.</span>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
