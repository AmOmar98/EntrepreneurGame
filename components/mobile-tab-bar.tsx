"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type MobileTabBarItem = { href: string; label: string; key: string };

export type MobileTabBarProps = {
  items: MobileTabBarItem[];
};

export function MobileTabBar({ items }: MobileTabBarProps) {
  const pathname = usePathname();
  return (
    <nav aria-label="Mobile primary" className="eic-mobile-tabbar">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={active ? "eic-mobile-tab is-active" : "eic-mobile-tab"}
            href={item.href}
            key={item.key}
          >
            <span aria-hidden="true" className="eic-mobile-tab__icon">
              ·
            </span>
            <span className="eic-mobile-tab__label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
