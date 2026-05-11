// MNT-01 — Client toggle between "Inbox" and "Vue par equipe" tabs.
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function MentorViewToggle({
  activeView,
  pendingCount,
}: {
  activeView: "inbox" | "team";
  pendingCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function switchTo(view: "inbox" | "team") {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "inbox") {
      params.set("view", "inbox");
    } else {
      params.delete("view");
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const btnBase: React.CSSProperties = {
    padding: "6px 16px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    background: "#f8fafc",
    color: "#334155",
  };
  const btnActive: React.CSSProperties = {
    ...btnBase,
    background: "#1e40af",
    color: "#fff",
    border: "1px solid #1e40af",
  };

  return (
    <div
      role="tablist"
      aria-label="Vue mentor"
      style={{ display: "flex", gap: 6, marginBottom: 4 }}
    >
      <button
        role="tab"
        aria-selected={activeView === "inbox"}
        onClick={() => switchTo("inbox")}
        style={activeView === "inbox" ? btnActive : btnBase}
        type="button"
      >
        {pendingCount > 0 ? `Inbox (${pendingCount})` : "Inbox"}
      </button>
      <button
        role="tab"
        aria-selected={activeView === "team"}
        onClick={() => switchTo("team")}
        style={activeView === "team" ? btnActive : btnBase}
        type="button"
      >
        Vue par equipe
      </button>
    </div>
  );
}
