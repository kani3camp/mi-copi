import type { TrainingEndCondition } from "./types";

export function getNextReplayCount(
  currentCount: number,
  didStartPlayback: boolean,
): number {
  return didStartPlayback ? currentCount + 1 : currentCount;
}

export function resolveTimeLimitExpiry(endedAt: string) {
  return {
    phase: "result" as const,
    finishReason: "time_up" as const,
    endedAt,
    discardActiveQuestion: true,
    discardFeedbackResult: true,
    lastAnsweredWasFinal: true,
  };
}

export function resolvePostFeedbackProgress(params: {
  endCondition: TrainingEndCondition;
  currentQuestionIndex: number;
  lastAnsweredWasFinal: boolean;
  answeredAt: string;
}) {
  const nextQuestionIndex = params.currentQuestionIndex + 1;
  const reachedTarget =
    params.endCondition.type === "question_count" &&
    nextQuestionIndex >= params.endCondition.questionCount;

  if (params.lastAnsweredWasFinal || reachedTarget) {
    return {
      phase: "result" as const,
      finishReason: "target_reached" as const,
      endedAt: params.answeredAt,
    };
  }

  return {
    phase: "playing" as const,
    nextQuestionIndex,
  };
}
