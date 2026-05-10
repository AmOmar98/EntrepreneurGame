import Link from "next/link";
import { signOut } from "@/app/actions";
import { EICLogo } from "@/components/ui";
import { SideMenuTrigger } from "@/components/menu/SideMenu";

export type TopbarLiteProps = {
  navItems: { href: string; label: string }[];
  brandName: string;
  brandSubtitle: string;
  logoutLabel: string;
};

export function TopbarLite({
  navItems,
  brandName,
  brandSubtitle,
  logoutLabel,
}: TopbarLiteProps) {
  return (
    <header className="eic-topbar" role="banner">
      <Link aria-label={brandName} className="eic-topbar__brand" href="/journey">
        <EICLogo />
      </Link>
      <span className="eic-topbar__brand-text">
        <span className="eic-topbar__brand-name">{brandName}</span>
        <span className="eic-topbar__brand-sub">{brandSubtitle}</span>
      </span>
      <span className="eic-topbar__grow" />
      <nav aria-label="Primary navigation" className="eic-topbar__nav">
        {navItems.map((item) => (
          <Link className="eic-topbar__nav-link" href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      <SideMenuTrigger />
      <form action={signOut} className="eic-topbar__logout-form">
        <button className="eic-topbar__logout" type="submit">
          {logoutLabel}
        </button>
      </form>
    </header>
  );
}
