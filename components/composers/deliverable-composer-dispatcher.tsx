"use client";

import { BmcCanvasComposer } from "@/components/composers/bmc-canvas-composer";
import { DesignThinkingComposer } from "@/components/composers/design-thinking-composer";
import { FeasibilityRoadmapComposer } from "@/components/composers/feasibility-roadmap-composer";
import { FundingNeedsComposer } from "@/components/composers/funding-needs-composer";
import { GtmStrategyComposer } from "@/components/composers/gtm-strategy-composer";
import { J1ConsolidationComposer } from "@/components/composers/j1-consolidation-composer";
import { MarketPositioningComposer } from "@/components/composers/market-positioning-composer";
import { MarketingFundamentalsComposer } from "@/components/composers/marketing-fundamentals-composer";
import { PitchStudioComposer } from "@/components/composers/pitch-studio-composer";
import { ProblemClientComposer } from "@/components/composers/problem-client-composer";
import { SubmissionForm } from "@/components/submission-form";

export type DeliverableComposerDispatcherProps = {
  deliverableTemplateId: string;
  deliverableSlug: string;
  deliverableTitle: string;
  playerId?: string | null;
  version?: 1 | 2;
  initialProofText?: string | null;
  initialProofUrl?: string | null;
};

export function DeliverableComposerDispatcher(
  props: DeliverableComposerDispatcherProps,
) {
  switch (props.deliverableSlug) {
    case "fiche-probleme-client-v1":
    case "persona-v1":
      return <ProblemClientComposer {...props} />;

    case "design-thinking-v1":
      return <DesignThinkingComposer {...props} />;

    case "bmc-v1":
      return <BmcCanvasComposer {...props} />;

    case "etude-marche-positionnement-v1":
    case "tam-sam-som-v1":
    case "positionnement-v1":
      return <MarketPositioningComposer {...props} />;

    case "faisabilite-plan-dev-v1":
    case "marche-technique-v1":
      return <FeasibilityRoadmapComposer {...props} />;

    case "plan-acces-marche-v1":
    case "commercialisation-v1":
    case "strategie-100-users-v1":
      return <GtmStrategyComposer {...props} />;

    case "fondamentaux-marketing-v1":
      return <MarketingFundamentalsComposer {...props} />;

    case "besoin-financement-v1":
    case "unit-economics-v1":
    case "couts-previsions-v1":
      return <FundingNeedsComposer {...props} />;

    case "canevas-consolides-j1-v1":
      return <J1ConsolidationComposer {...props} />;

    case "pitch-3min-support-v1":
    case "pitch-final-objections-v1":
    case "techniques-pitch-v1":
    case "pitch-deck-v1":
      return <PitchStudioComposer {...props} />;

    default:
      return (
        <SubmissionForm
          deliverableTemplateId={props.deliverableTemplateId}
          playerId={props.playerId}
          version={props.version}
        />
      );
  }
}
