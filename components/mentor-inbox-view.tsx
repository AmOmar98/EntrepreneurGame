// MNT-01 — Inbox view: flat antichrono list of pending submissions.
// Server component (no hooks needed — pure display).
import Link from "next/link";
import type { MentorPendingSubmission } from "@/lib/mentor";

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  return `il y a ${diffD} j`;
}

export function MentorInboxView({
  items,
}: {
  items: MentorPendingSubmission[];
}) {
  if (items.length === 0) {
    return (
      <p style={{ color: "#64748b", fontSize: 14, marginTop: 16 }}>
        Aucun livrable en attente d'evaluation.
      </p>
    );
  }

  return (
    <ul
      aria-label="Inbox — livrables en attente"
      style={{ listStyle: "none", padding: 0, margin: "16px 0 0", display: "flex", flexDirection: "column", gap: 8 }}
    >
      {items.map((item) => (
        <li
          key={item.submissionId}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "10px 14px",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            background: "#fff",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            <strong style={{ fontSize: 14, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.playerName}
            </strong>
            <span style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.missionTitle ?? "Livrable"} · {formatRelative(item.submittedAt)}
            </span>
          </div>
          <Link
            href={`/mentor/submission/${item.submissionId}`}
            style={{
              flexShrink: 0,
              fontSize: 13,
              fontWeight: 600,
              color: "#1e40af",
              textDecoration: "none",
              padding: "4px 10px",
              border: "1px solid #bfdbfe",
              borderRadius: 6,
              background: "#eff6ff",
              whiteSpace: "nowrap",
            }}
          >
            Evaluer →
          </Link>
        </li>
      ))}
    </ul>
  );
}
