// T3X-EXPANSION wave 3 / plan 12-09 — MoSCoW Kanban card (D-04).
// Sortable card via @dnd-kit/sortable. Drag handle, content, edit/delete buttons.
// R1 STRICT : 0 chiffre score/rank/multiplier dans le rendu.
// R3 : pas de DOM disabled.
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MoscowCard as MoscowCardType } from "@/lib/types";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

const BUCKET_COLOR: Record<string, string> = {
  must: "#dc2626",
  should: "#ea580c",
  could: "#0284c7",
  wont: "#64748b",
};

export function MoscowCard({
  card,
  onEdit,
  onDelete,
}: {
  card: MoscowCardType;
  onEdit: (card: MoscowCardType) => void;
  onDelete: (cardId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <article
      ref={setNodeRef}
      style={{
        ...style,
        background: "#ffffff",
        border: `2px solid ${BUCKET_COLOR[card.bucket] ?? "#cbd5e1"}`,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.12)" : "0 1px 2px rgba(0,0,0,0.04)",
      }}
      aria-label={`Carte ${card.bucket}`}
    >
      {/* Drag handle - top of card. Hamburger glyph kept inline (display only). */}
      <div
        {...attributes}
        {...listeners}
        style={{
          alignSelf: "flex-start",
          padding: "2px 6px",
          fontSize: 14,
          color: "#94a3b8",
          userSelect: "none",
        }}
        aria-label="Deplacer la carte"
        role="button"
        tabIndex={0}
      >
        {"☰"}
      </div>

      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{card.feature}</p>

      {card.pourquoi ? (
        <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>
          <strong>{t.moscow_card_pourquoi_label} :</strong> {card.pourquoi}
        </p>
      ) : null}

      {card.contrainte ? (
        <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>
          <strong>{t.moscow_card_contrainte_label} :</strong> {card.contrainte}
        </p>
      ) : null}

      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
        <button
          type="button"
          onClick={() => onEdit(card)}
          style={{
            padding: "4px 10px",
            background: "#f1f5f9",
            color: "#334155",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            fontSize: 12,
            cursor: "pointer",
          }}
          aria-label={`Editer la carte ${card.feature}`}
        >
          {t.moscow_card_save}
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Supprimer cette carte ?")) onDelete(card.id);
          }}
          style={{
            padding: "4px 10px",
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fca5a5",
            borderRadius: 6,
            fontSize: 12,
            cursor: "pointer",
          }}
          aria-label={`Supprimer la carte ${card.feature}`}
        >
          {t.moscow_card_delete}
        </button>
      </div>
    </article>
  );
}
