import {
  buildDistanceGuestSaveInput,
  buildDistanceGuestSummary,
  type DistanceGuestResult,
  type DistanceGuestSummary,
  evaluateDistanceAnswer,
  getDistanceQuestionCount,
  validateDistanceTrainingConfig,
} from "../distance-guest";
import {
  createQuestionGeneratorState,
  takeNextQuestion,
} from "../question-generator.ts";
import type { TrainingSessionAdapter } from "../training-session-adapter.ts";
import type {
  DistanceTrainingConfig,
  Question,
  SaveTrainingSessionInput,
} from "../types.ts";

export const distanceTrainingSessionAdapter: TrainingSessionAdapter<
  DistanceTrainingConfig,
  Question,
  number,
  DistanceGuestResult,
  DistanceGuestSummary,
  SaveTrainingSessionInput
> = {
  buildSaveInput: ({ config, endedAt, finishReason, results, startedAt }) =>
    buildDistanceGuestSaveInput({
      config,
      endedAt,
      finishReason,
      results,
      startedAt,
    }),
  buildSummary: buildDistanceGuestSummary,
  createQuestionGeneratorState,
  evaluateAnswer: ({
    answeredAt,
    presentedAt,
    question,
    replayBaseCount,
    replayTargetCount,
    responseTimeMs,
    userAnswer,
  }) =>
    evaluateDistanceAnswer({
      answeredAt,
      answeredDistanceSemitones: userAnswer,
      presentedAt,
      question,
      replayBaseCount,
      replayTargetCount,
      responseTimeMs,
    }),
  getPlannedQuestionCount: getDistanceQuestionCount,
  takeNextQuestion,
  validateConfig: validateDistanceTrainingConfig,
};
