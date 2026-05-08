"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { saveOnboardingKyc, type WorkflowState } from "@/app/actions";
import type { FounderKyc, ProjectHolderKyc, Startup } from "@/lib/data";

const initialState: WorkflowState = { ok: false, message: "" };

export function OnboardingKycForm({
  startup,
  founder,
  project,
}: {
  startup: Startup;
  founder?: FounderKyc;
  project?: ProjectHolderKyc;
}) {
  const [state, action, pending] = useActionState(saveOnboardingKyc, initialState);
  const owner = startup.team[0];

  return (
    <form action={action} className="stack">
      <input type="hidden" name="projectId" value={startup.id} />
      <input type="hidden" name="userId" value={owner?.userId ?? "usr-yasmine"} />
      <div className="two-col compact">
        <label className="form-row">
          Founder phone
          <input className="input" name="phone" defaultValue={founder?.phone ?? ""} required />
        </label>
        <label className="form-row">
          CIN / Passport ref
          <input className="input" name="cinOrPassport" defaultValue={founder?.cinOrPassport ?? ""} required />
        </label>
      </div>
      <div className="two-col compact">
        <label className="form-row">
          School / organization
          <input className="input" name="schoolOrOrg" defaultValue={founder?.schoolOrOrg ?? "UEMF"} required />
        </label>
        <label className="form-row">
          Founder role
          <input className="input" name="roleTitle" defaultValue={founder?.roleTitle ?? "Project holder"} required />
        </label>
      </div>
      <label className="form-row">
        Project logo URL
        <input className="input" name="logoUrl" type="url" defaultValue={project?.logoUrl ?? ""} required />
      </label>
      <div className="two-col compact">
        <label className="form-row">
          Project legal/display name
          <input className="input" name="legalName" defaultValue={project?.legalName ?? startup.name} required />
        </label>
        <label className="form-row">
          Holder type
          <select className="select" name="projectHolderType" defaultValue={project?.projectHolderType ?? "student"}>
            <option value="student">Student</option>
            <option value="researcher">Researcher</option>
            <option value="alumni">Alumni</option>
            <option value="external">External</option>
          </select>
        </label>
      </div>
      <label className="form-row">
        One-line idea
        <input className="input" name="ideaOneLiner" defaultValue={project?.ideaOneLiner ?? startup.summary} required />
      </label>
      <label className="form-row">
        Problem statement
        <textarea className="textarea" name="problemStatement" defaultValue={project?.problemStatement ?? ""} required />
      </label>
      <label className="form-row">
        Target customer
        <input className="input" name="targetCustomer" defaultValue={project?.targetCustomer ?? ""} required />
      </label>
      {state.message ? <p className="form-status">{state.message}</p> : null}
      <button className="button primary" type="submit" disabled={pending}>
        <Save aria-hidden="true" size={17} />
        {pending ? "Saving..." : "Save pre-bootcamp profile"}
      </button>
    </form>
  );
}
