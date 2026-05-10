// T3X-EXPANSION wave 3 / plan 12-09 — MoSCoW Kanban board (D-04).
// 4 colonnes Must/Should/Could/Wont, DnD via @dnd-kit/core, persist via
// app/actions.ts (Plan 12-06).
// R1 STRICT : 0 chiffre score/rank/multiplier rendu sur le board.
// R2 : warn-only message via submitMoscowDeliverableFlow suffix, affiche tel quel.
// R3 : aucun DOM disabled hors submit pending, aucun blocage cross-mission.
// Per Plan 12-02 CONTEXT (issue revision #7) : pas d'optimistic state update,
// revalidatePath + router.refresh() apres chaque mutation.
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  createMoscowCardFlow,
  deleteMoscowCardFlow,
  reorderMoscowCardsFlow,
  submitMoscowDeliverableFlow,
  updateMoscowCardFlow,
} from "@/app/actions";
import { dictionaries } from "@/lib/i18n";
import type { MoscowBucket, MoscowCard as MoscowCardType } from "@/lib/types";
import { MoscowCard } from "@/components/moscow-card";

const t = dictionaries.fr;

const BUCKETS: { id: MoscowBucket; label: string }[] = [
  { id: "must", label: t.moscow_bucket_must },
  { id: "should", label: t.moscow_bucket_should },
  { id: "could", label: t.moscow_bucket_could },
  { id: "wont", label: t.moscow_bucket_wont },
];

const BUCKET_IDS = BUCKETS.map((b) => b.id) as string[];

export function MoscowKanban({
  deliverableTemplateId,
  initialCards,
}: {
  deliverableTemplateId: string;
  initialCards: MoscowCardType[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitMessage, setSubmitMessage] = useState<string>("");

  // No optimistic state : initialCards is the source of truth, server actions
  // mutate the DB, router.refresh() re-fetches the parent SSR data.
  const cards = initialCards;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const cardsByBucket = useMemo(() => {
    const groups: Record<MoscowBucket, MoscowCardType[]> = {
      must: [],
      should: [],
      could: [],
      wont: [],
    };
    for (const c of cards) {
      groups[c.bucket].push(c);
    }
    for (const b of Object.keys(groups) as MoscowBucket[]) {
      groups[b].sort((a, b2) => a.ord - b2.ord);
    }
    return groups;
  }, [cards]);

  function findContainer(cardId: string): MoscowBucket | null {
    const card = cards.find((c) => c.id === cardId);
    return card?.bucket ?? null;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeBucket = findContainer(String(active.id));
    if (!activeBucket) return;

    // Determine target bucket : if over.id is a bucket-id (column), it's cross-bucket.
    // Otherwise, infer from the bucket of the over card.
    const overIsBucket = BUCKET_IDS.includes(String(over.id));
    const targetBucket = overIsBucket
      ? (String(over.id) as MoscowBucket)
      : findContainer(String(over.id));
    if (!targetBucket) return;

    // Compute new ordered list (NOT mutating local state — just to build batch payload).
    // Use the current per-bucket grouping as the basis.
    const grouping: Record<MoscowBucket, MoscowCardType[]> = {
      must: [...cardsByBucket.must],
      should: [...cardsByBucket.should],
      could: [...cardsByBucket.could],
      wont: [...cardsByBucket.wont],
    };

    const activeCard = cards.find((c) => c.id === active.id);
    if (!activeCard) return;

    // Remove active from its source bucket.
    grouping[activeBucket] = grouping[activeBucket].filter((c) => c.id !== active.id);

    // Insert into target bucket at the right position.
    if (activeBucket === targetBucket) {
      const targetIdx = grouping[targetBucket].findIndex((c) => c.id === over.id);
      const insertAt = targetIdx >= 0 ? targetIdx : grouping[targetBucket].length;
      grouping[targetBucket] = [
        ...grouping[targetBucket].slice(0, insertAt),
        { ...activeCard, bucket: targetBucket },
        ...grouping[targetBucket].slice(insertAt),
      ];
    } else {
      const targetIdx = overIsBucket
        ? grouping[targetBucket].length
        : grouping[targetBucket].findIndex((c) => c.id === over.id);
      const insertAt = targetIdx >= 0 ? targetIdx : grouping[targetBucket].length;
      grouping[targetBucket] = [
        ...grouping[targetBucket].slice(0, insertAt),
        { ...activeCard, bucket: targetBucket },
        ...grouping[targetBucket].slice(insertAt),
      ];
    }

    // Reassign ord per bucket and flatten.
    const items: { id: string; bucket: MoscowBucket; ord: number }[] = [];
    for (const b of BUCKET_IDS as MoscowBucket[]) {
      grouping[b].forEach((c, idx) => {
        items.push({ id: c.id, bucket: b, ord: idx });
      });
    }

    const fd = new FormData();
    fd.set("deliverableTemplateId", deliverableTemplateId);
    fd.set("items", JSON.stringify(items));
    startTransition(async () => {
      const res = await reorderMoscowCardsFlow({ ok: false, message: "" }, fd);
      if (!res.ok) {
        setSubmitMessage(res.message);
        return;
      }
      router.refresh();
    });
  }

  async function handleAddCard(bucket: MoscowBucket) {
    const feature = window.prompt(t.moscow_card_feature_label);
    if (!feature) return;
    const fd = new FormData();
    fd.set("deliverableTemplateId", deliverableTemplateId);
    fd.set("bucket", bucket);
    fd.set("ord", String(cardsByBucket[bucket].length));
    fd.set("feature", feature);
    fd.set("pourquoi", "");
    fd.set("contrainte", "");
    const res = await createMoscowCardFlow({ ok: false, message: "" }, fd);
    setSubmitMessage(res.message);
    if (res.ok) {
      // Pas d'optimistic state update : revalidatePath dans l'action invalide
      // le cache server, router.refresh() force le re-fetch -> la nouvelle
      // carte apparait avec son vrai UUID via la nouvelle prop initialCards.
      router.refresh();
    }
  }

  async function handleDelete(cardId: string) {
    const fd = new FormData();
    fd.set("cardId", cardId);
    const res = await deleteMoscowCardFlow({ ok: false, message: "" }, fd);
    setSubmitMessage(res.message);
    if (res.ok) {
      router.refresh();
    }
  }

  async function handleEdit(card: MoscowCardType) {
    // Minimal inline-edit : prompts successifs. Dialog custom out of scope T-3.
    const newFeature = window.prompt(t.moscow_card_feature_label, card.feature);
    if (newFeature === null) return;
    const newPourquoi = window.prompt(t.moscow_card_pourquoi_label, card.pourquoi) ?? "";
    const newContrainte = window.prompt(t.moscow_card_contrainte_label, card.contrainte) ?? "";

    const fd = new FormData();
    fd.set("cardId", card.id);
    fd.set("bucket", card.bucket);
    fd.set("ord", String(card.ord));
    fd.set("feature", newFeature);
    fd.set("pourquoi", newPourquoi);
    fd.set("contrainte", newContrainte);
    const res = await updateMoscowCardFlow({ ok: false, message: "" }, fd);
    setSubmitMessage(res.message);
    if (res.ok) {
      router.refresh();
    }
  }

  async function handleSubmitDeliverable() {
    const fd = new FormData();
    fd.set("deliverableTemplateId", deliverableTemplateId);
    const res = await submitMoscowDeliverableFlow({ ok: false, message: "" }, fd);
    setSubmitMessage(res.message);
    if (res.ok) {
      router.refresh();
    }
  }

  // R2 detection : message warn-only contient "recommandation" (cf. submitMoscowDeliverableFlow)
  const isWarnMessage = submitMessage.toLowerCase().includes("recommandation");

  return (
    <section style={{ padding: 16 }}>
      <header style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t.moscow_kanban_title}</h2>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#475569" }}>
          {t.moscow_kanban_subtitle}
        </p>
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {BUCKETS.map((b) => (
            <div
              key={b.id}
              id={b.id}
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: 8,
                minHeight: 200,
              }}
            >
              <header
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                <span>{b.label}</span>
                <button
                  type="button"
                  onClick={() => handleAddCard(b.id)}
                  style={{
                    padding: "2px 8px",
                    background: "#1d4ed8",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                  aria-label={`${t.moscow_card_add} - ${b.label}`}
                >
                  + {t.moscow_card_add}
                </button>
              </header>
              <SortableContext
                items={cardsByBucket[b.id].map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {cardsByBucket[b.id].map((card) => (
                  <MoscowCard
                    key={card.id}
                    card={card}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>

      <footer style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          type="button"
          onClick={handleSubmitDeliverable}
          disabled={pending}
          style={{
            padding: "10px 16px",
            background: pending ? "#94a3b8" : "#15803d",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: pending ? "wait" : "pointer",
            alignSelf: "flex-start",
          }}
        >
          {t.moscow_submit_deliverable}
        </button>
        {submitMessage ? (
          <p
            role="status"
            style={{
              margin: 0,
              fontSize: 13,
              color: isWarnMessage ? "#92400e" : "#15803d",
            }}
          >
            {submitMessage}
          </p>
        ) : null}
      </footer>
    </section>
  );
}
