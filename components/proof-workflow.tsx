"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Award, Send, Sparkles } from "lucide-react";
import { claimBonusEventFlow, submitDeliverableFlow, type WorkflowState } from "@/app/actions";
import {
  type Startup,
  bonusRules,
  checkpoints,
  deliverableMailBody,
  mailtoUrl,
  stages,
} from "@/lib/data";

const initialState: WorkflowState = { ok: false, message: "" };

export function ProofWorkflow({ startup }: { startup: Startup }) {
  const [deliverableState, deliverableAction, deliverablePending] = useActionState(
    submitDeliverableFlow,
    initialState,
  );
  const [bonusState, bonusAction, bonusPending] = useActionState(claimBonusEventFlow, initialState);
  const [lastMailto, setLastMailto] = useState("");

  useEffect(() => {
    if (deliverableState.ok && deliverableState.mailto) {
      setLastMailto(deliverableState.mailto);
      window.location.href = deliverableState.mailto;
    }
  }, [deliverableState]);

  useEffect(() => {
    if (bonusState.ok && bonusState.mailto) {
      setLastMailto(bonusState.mailto);
      window.location.href = bonusState.mailto;
    }
  }, [bonusState]);

  const previewMailto = useMemo(
    () =>
      mailtoUrl({
        to: [startup.coach.email, "eic@uemf.ma"],
        subject: `Preuve a valider - ${startup.name}`,
        body: deliverableMailBody({
          startup,
          title: "Nouvelle preuve",
          checkpoint: startup.checkpointFocus,
          docUrl: "https://...",
          message: "Merci de valider cette preuve dans le dashboard.",
        }),
      }),
    [startup],
  );

  return (
    <div className="two-col" style={{ marginTop: 18 }}>
      <section className="panel" id="submit-deliverable">
        <div className="panel-header">
          <div>
            <h2>Submit proof</h2>
            <p className="muted">Step 1 saves the proof. Step 2 opens an email draft to coach + EIC.</p>
          </div>
          <a className="button" href={lastMailto || previewMailto}>
            Open draft
          </a>
        </div>
        <form action={deliverableAction} className="panel-body stack">
          <input type="hidden" name="projectId" value={startup.id} />
          <input type="hidden" name="slug" value={startup.slug} />
          <input type="hidden" name="coachEmail" value={startup.coach.email} />
          <input type="hidden" name="coachName" value={startup.coach.fullName} />
          <input type="hidden" name="startupName" value={startup.name} />
          <label className="form-row">
            Title
            <input className="input" name="title" required placeholder="Prototype test, interview synthesis..." />
          </label>
          <label className="form-row">
            Doc link
            <input className="input" name="docUrl" type="url" required placeholder="https://docs..." />
          </label>
          <div className="two-col compact">
            <label className="form-row">
              Checkpoint
              <select className="select" name="checkpoint" defaultValue={startup.checkpointFocus}>
                {checkpoints.map((checkpoint) => (
                  <option key={checkpoint.id} value={checkpoint.id}>{checkpoint.label}</option>
                ))}
              </select>
            </label>
            <label className="form-row">
              XP
              <input className="input" name="baseXp" type="number" min="25" max="150" defaultValue="100" />
            </label>
          </div>
          <label className="form-row">
            Stage
            <select className="select" name="stage" defaultValue={startup.stage}>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>{stage.label}</option>
              ))}
            </select>
          </label>
          <label className="form-row">
            Message
            <textarea className="textarea" name="description" required placeholder="What should the coach validate?" />
          </label>
          {deliverableState.message ? (
            <p className="form-status">{deliverableState.message}</p>
          ) : null}
          <button className="button primary" type="submit" disabled={deliverablePending}>
            <Send aria-hidden="true" size={17} />
            {deliverablePending ? "Saving..." : "Save and mail coach"}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Claim bonus XP</h2>
            <p className="muted">Bonus claims stay pending until validation.</p>
          </div>
          <Sparkles aria-hidden="true" color="var(--gold)" size={20} />
        </div>
        <form action={bonusAction} className="panel-body stack">
          <input type="hidden" name="projectId" value={startup.id} />
          <input type="hidden" name="slug" value={startup.slug} />
          <input type="hidden" name="coachEmail" value={startup.coach.email} />
          <input type="hidden" name="coachName" value={startup.coach.fullName} />
          <input type="hidden" name="startupName" value={startup.name} />
          <label className="form-row">
            Bonus type
            <select className="select" name="type" defaultValue="prospect_interviews">
              {Object.entries(bonusRules).map(([value, rule]) => (
                <option key={value} value={value}>{rule.label}</option>
              ))}
            </select>
          </label>
          <label className="form-row">
            Title
            <input className="input" name="title" required placeholder="First sale, 12 interviews, demo ready..." />
          </label>
          <label className="form-row">
            Proof link
            <input className="input" name="proofUrl" type="url" required placeholder="https://docs..." />
          </label>
          <div className="two-col compact">
            <label className="form-row">
              Quantity
              <input className="input" name="quantity" type="number" min="1" defaultValue="1" />
            </label>
            <label className="form-row">
              Stage
              <select className="select" name="stage" defaultValue={startup.stage}>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>{stage.label}</option>
                ))}
              </select>
            </label>
          </div>
          {bonusState.message ? <p className="form-status">{bonusState.message}</p> : null}
          <button className="button primary" type="submit" disabled={bonusPending}>
            <Award aria-hidden="true" size={17} />
            {bonusPending ? "Saving..." : "Claim and mail coach"}
          </button>
        </form>
      </section>
    </div>
  );
}
