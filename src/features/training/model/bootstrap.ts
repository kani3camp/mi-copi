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
