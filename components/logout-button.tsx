"use client";

import { signOut } from "@/app/actions";

export function LogoutButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button className={className} onClick={() => signOut()} type="button">
      {children}
    </button>
  );
}
