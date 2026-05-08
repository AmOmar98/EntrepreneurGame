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
import type { LevelId, SubmissionStatus } from "@/lib/types";

export const levelIcon: Record<LevelId, LucideIcon> = {
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
