import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { submissionSchema } from "@/lib/schemas";

const ROOT = process.cwd();
const VALID_UUID = "00000000-0000-0000-0000-000000000000";

const IDEAWAVE_STUDIO_DISPATCH_SLUGS = [
  { slug: "fiche-probleme-client-v1", component: "ProblemClientComposer", file: "problem-client-composer.tsx" },
  { slug: "design-thinking-v1", component: "DesignThinkingComposer", file: "design-thinking-composer.tsx" },
  { slug: "bmc-v1", component: "BmcCanvasComposer", file: "bmc-canvas-composer.tsx" },
  { slug: "etude-marche-positionnement-v1", component: "MarketPositioningComposer", file: "market-positioning-composer.tsx" },
  { slug: "faisabilite-plan-dev-v1", component: "FeasibilityRoadmapComposer", file: "feasibility-roadmap-composer.tsx" },
  { slug: "plan-acces-marche-v1", component: "GtmStrategyComposer", file: "gtm-strategy-composer.tsx" },
  { slug: "fondamentaux-marketing-v1", component: "MarketingFundamentalsComposer", file: "marketing-fundamentals-composer.tsx" },
  { slug: "besoin-financement-v1", component: "FundingNeedsComposer", file: "funding-needs-composer.tsx" },
  { slug: "canevas-consolides-j1-v1", component: "J1ConsolidationComposer", file: "j1-consolidation-composer.tsx" },
  { slug: "pitch-3min-support-v1", component: "PitchStudioComposer", file: "pitch-studio-composer.tsx" },
  { slug: "pitch-final-objections-v1", component: "PitchStudioComposer", file: "pitch-studio-composer.tsx" },
] as const;

describe("Idea'Wave interactive deliverable studios & dispatcher", () => {
  it("dispatches all Idea'Wave deliverable slugs to dedicated interactive studio components", () => {
    const dispatcherSource = fs.readFileSync(
      path.join(ROOT, "components", "composers", "deliverable-composer-dispatcher.tsx"),
      "utf8",
    );

    for (const { slug, component } of IDEAWAVE_STUDIO_DISPATCH_SLUGS) {
      expect(dispatcherSource).toContain(`case "${slug}":`);
      expect(dispatcherSource).toContain(`<${component} {...props} />`);
    }

    // Verify moscow-v1 is handled via MoscowKanban on the deliverable detail page
    const pageSource = fs.readFileSync(
      path.join(ROOT, "app", "journey", "deliverable", "[id]", "page.tsx"),
      "utf8",
    );
    expect(pageSource).toContain("<MoscowKanban");
    expect(pageSource).toContain("<DeliverableComposerDispatcher");
  });

  it("ensures all 10 interactive studio files exist, scope drafts with buildDraftStorageKey, and include SubmissionForm fallback", () => {
    const uniqueFiles = Array.from(new Set(IDEAWAVE_STUDIO_DISPATCH_SLUGS.map((item) => item.file)));
    expect(uniqueFiles).toHaveLength(10);

    for (const fileName of uniqueFiles) {
      const fullPath = path.join(ROOT, "components", "composers", fileName);
      expect(fs.existsSync(fullPath)).toBe(true);
      const source = fs.readFileSync(fullPath, "utf8");
      expect(source).toContain("buildDraftStorageKey");
      expect(source).toContain("_studio");
      expect(source).toContain("<SubmissionForm");
      expect(source).toContain("<AutoSaveBadge");
    }
  });

  it("wires DeliverableComposerDispatcher into RevisionPanel for V2 revisions", () => {
    const revisionSource = fs.readFileSync(
      path.join(ROOT, "components", "revision-panel.tsx"),
      "utf8",
    );
    expect(revisionSource).toContain("DeliverableComposerDispatcher");
    expect(revisionSource).toContain("version={2}");
  });

  it("accepts serialized studio Markdown up to 16,000 chars in submissionSchema and rejects >16,000 chars", () => {
    const richStudioMarkdown = "# Studio Livrable Idea'Wave\n\n" + "x".repeat(12000);
    expect(
      submissionSchema.safeParse({
        deliverableTemplateId: VALID_UUID,
        kind: "proof_text",
        proofText: richStudioMarkdown,
      }).success,
    ).toBe(true);

    expect(
      submissionSchema.safeParse({
        deliverableTemplateId: VALID_UUID,
        kind: "proof_text",
        proofText: "a".repeat(16000),
      }).success,
    ).toBe(true);

    expect(
      submissionSchema.safeParse({
        deliverableTemplateId: VALID_UUID,
        kind: "proof_text",
        proofText: "a".repeat(16001),
      }).success,
    ).toBe(false);
  });
});
