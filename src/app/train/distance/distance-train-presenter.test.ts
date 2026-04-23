import assert from "node:assert/strict";
import test from "node:test";

import type { DistanceTrainingConfig } from "../../../features/training/model/types.ts";

const { buildDistanceTrainViewModel } = await import(
  new URL("./distance-train-presenter.ts", import.meta.url).href
);

test("distance presenter keeps the bounded question label contract", () => {
  const viewModel = buildDistanceTrainViewModel({
    activeQuestionIndex: 1,
    audioError: null,
    config: createDistanceConfig(),
    intervalNotationStyle: "ja",
    isAuthenticated: false,
    phase: "answering",
    remainingTimeMs: null,
    results: [],
    saveResult: null,
    summary: null,
  });

  assert.equal(viewModel.questionLabel, "2 / 10");
  assert.equal(viewModel.answerChoiceValues.includes(12), true);
});

test("distance presenter keeps stable answer rows and live score metadata", () => {
  const viewModel = buildDistanceTrainViewModel({
    activeQuestionIndex: 1,
    audioError: null,
    config: createDistanceConfig({
      intervalRange: { minSemitone: 1, maxSemitone: 6 },
      includeOctave: false,
      endCondition: {
        type: "time_limit",
        timeLimitSeconds: 61,
      },
      intervalGranularity: "aug_dim",
    }),
    intervalNotationStyle: "ja",
    isAuthenticated: true,
    phase: "answering",
    remainingTimeMs: 61_000,
    results: [
      createDistanceResult({ questionIndex: 0, score: 97.125 }),
      createDistanceResult({ questionIndex: 1, score: 96.875 }),
    ],
    saveResult: null,
    summary: null,
  });

  assert.equal(viewModel.questionLabel, "2");
  assert.equal(viewModel.headerMeta, "1:01");
  assert.equal(viewModel.runningScoreLabel, "194");
  assert.deepEqual(viewModel.answerChoiceRows, [
    [1, 2, 3],
    [4, 5, 6],
  ]);
});

test("distance presenter marks empty result sessions as unsaveable", () => {
  const viewModel = buildDistanceTrainViewModel({
    activeQuestionIndex: null,
    audioError: null,
    config: createDistanceConfig(),
    intervalNotationStyle: "ja",
    isAuthenticated: true,
    phase: "result",
    remainingTimeMs: null,
    results: [],
    saveResult: null,
    summary: null,
  });

  assert.equal(viewModel.cannotSaveBecauseNoAnswers, true);
});

function createDistanceConfig(
  overrides: Partial<DistanceTrainingConfig> = {},
): DistanceTrainingConfig {
  const config: DistanceTrainingConfig = {
    mode: "distance" as const,
    intervalRange: { minSemitone: 0, maxSemitone: 12 },
    directionMode: "mixed" as const,
    includeUnison: false,
    includeOctave: true,
    baseNoteMode: "random" as const,
    fixedBaseNote: null,
    endCondition: {
      type: "question_count" as const,
      questionCount: 10,
    },
    intervalGranularity: "simple" as const,
  };

  return {
    ...config,
    ...overrides,
    intervalRange: overrides.intervalRange ?? config.intervalRange,
    endCondition: overrides.endCondition ?? config.endCondition,
  };
}

function createDistanceResult(props: { questionIndex: number; score: number }) {
  return {
    question: {
      questionIndex: props.questionIndex,
      direction: "up" as const,
      baseNote: "C" as const,
      baseMidi: 60,
      targetNote: "E" as const,
      targetMidi: 64,
      distanceSemitones: 4,
      notationStyle: "sharp" as const,
    },
    answeredDistanceSemitones: 4,
    isCorrect: true,
    errorSemitones: 0,
    responseTimeMs: 1320,
    score: props.score,
    scoreFormulaVersion: "v1" as const,
    replayBaseCount: 1,
    replayTargetCount: 1,
    presentedAt: "2026-04-24T10:00:00.000Z",
    answeredAt: "2026-04-24T10:00:01.320Z",
  };
}
