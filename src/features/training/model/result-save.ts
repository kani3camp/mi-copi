import type { SessionFinishReason } from "./types";

export interface TrainingResultSaveContext {
  isAuthenticated: boolean;
  startedAt: string | null;
  endedAt: string | null;
  finishReason: SessionFinishReason | null;
  resultsCount: number;
}

export interface TrainingResultAutoSaveContext
  extends TrainingResultSaveContext {
  attemptedSessionId: string | null;
  isSavePending: boolean;
  hasSavedResult: boolean;
}

export interface CompleteTrainingResultSaveContext
  extends TrainingResultSaveContext {
  startedAt: string;
  endedAt: string;
  finishReason: SessionFinishReason;
}

export function hasTrainingResultSavePayload(
  context: TrainingResultSaveContext,
): context is CompleteTrainingResultSaveContext {
  return Boolean(
    context.startedAt &&
      context.endedAt &&
      context.finishReason &&
      context.resultsCount > 0,
  );
}

export function shouldAutoSaveTrainingResult(
  context: TrainingResultAutoSaveContext,
): context is CompleteTrainingResultSaveContext & {
  attemptedSessionId: string | null;
  isSavePending: boolean;
  hasSavedResult: boolean;
} {
  if (!context.isAuthenticated) {
    return false;
  }

  if (!hasTrainingResultSavePayload(context)) {
    return false;
  }

  if (context.isSavePending || context.hasSavedResult) {
    return false;
  }

  return context.attemptedSessionId !== context.startedAt;
}
