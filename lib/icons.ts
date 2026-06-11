import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CheckCircle2,
  CircleDot,
  Clock,
  Compass,
  FileText,
  Lightbulb,
  Mic,
  RefreshCcw,
  Rocket,
  Target,
  Trophy,
  Wallet,
  XCircle,
} from "lucide-react";
import type { SubmissionStatus } from "@/lib/types";

// Record<string, LucideIcon>: no longer an exhaustive map over the LevelId union
// (LevelId = string after 14-02). Object literal unchanged -- runtime lookup is safe.
export const levelIcon: Record<string, LucideIcon> = {
  L0_diagnostic: Compass,
  L1_problem: Target,
  L2_solution: Lightbulb,
  L3_market: BarChart3,
  L4_business_model: Wallet,
  L5_pitch: Mic,
  L6_traction: Rocket,
  L7_alumni: Trophy,
};

export const submissionStatusIcon: Record<SubmissionStatus, LucideIcon> = {
  draft: FileText,
  submitted_v1: CircleDot,
  feedback_received: RefreshCcw,
  submitted_v2: Clock,
  validated: CheckCircle2,
  rejected: XCircle,
};
