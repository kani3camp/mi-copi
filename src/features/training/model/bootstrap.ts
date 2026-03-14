import type { SessionPhase } from "./types";

export function shouldApplyDeferredTrainingBootstrap(input: {
  phase: SessionPhase;
  startedAt: string | null;
  hasEditedConfig: boolean;
}): boolean {
  return (
    input.phase === "config" &&
    input.startedAt === null &&
    input.hasEditedConfig === false
  );
}

export function shouldHydrateResolvedTrainingBootstrap(input: {
  hasResolvedBootstrap: boolean;
  hasHydratedSettings: boolean;
}): boolean {
  return input.hasResolvedBootstrap && input.hasHydratedSettings === false;
}

export function getResolvedTrainingBootstrapConfigDecision(input: {
  hasResolvedBootstrap: boolean;
  hasStoredConfig: boolean;
  hasHandledStoredConfig: boolean;
  phase: SessionPhase;
  startedAt: string | null;
  hasEditedConfig: boolean;
}): "none" | "apply" | "skip" {
  if (
    !input.hasResolvedBootstrap ||
    !input.hasStoredConfig ||
    input.hasHandledStoredConfig
  ) {
    return "none";
  }

  if (input.hasEditedConfig) {
    return "skip";
  }

  return shouldApplyDeferredTrainingBootstrap({
    phase: input.phase,
    startedAt: input.startedAt,
    hasEditedConfig: false,
  })
    ? "apply"
    : "none";
}
