"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export function MentorPendingFilter({ active }: { active: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function toggle() {
    const params = new URLSearchParams(searchParams.toString());
    if (active) {
      params.delete("pending");
    } else {
      params.set("pending", "1");
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 14,
        color: "#0f172a",
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={active}
        onChange={toggle}
        aria-label={t.mentor_filter_pending}
      />
      <span>{t.mentor_filter_pending}</span>
    </label>
  );
}
