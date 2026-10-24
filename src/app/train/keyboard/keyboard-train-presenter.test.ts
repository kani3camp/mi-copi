import assert from "node:assert/strict";
import test from "node:test";

import type { KeyboardTrainingConfig } from "../../../features/training/model/types.ts";

const { buildKeyboardTrainViewModel } = await import(
  new URL("./keyboard-train-presenter.ts", import.meta.url).href
);

test("keyboard presenter shows only the current index for time-limit sessions", () => {
  const viewModel = buildKeyboardTrainViewModel({
    activeQuestionIndex: 1,
    audioError: null,
    config: createKeyboardConfig(),
    isAuthenticated: false,
    phase: "answering",
    remainingTimeMs: null,
    results: [],
    saveResult: null,
    summary: null,
  });

  assert.equal(viewModel.questionLabel, "2");
});

test("keyboard presenter exposes running score alongside time-limit header meta", () => {
  const viewModel = buildKeyboardTrainViewModel({
    activeQuestionIndex: 1,
    audioError: null,
    config: createKeyboardConfig(),
    isAuthenticated: true,
    phase: "answering",
    remainingTimeMs: 61_000,
    results: [
      createKeyboardResult({ questionIndex: 0, score: 97.125 }),
      createKeyboardResult({ questionIndex: 1, score: 96.875 }),
    ],
    saveResult: null,
    summary: null,
  });

  assert.equal(viewModel.questionLabel, "2");
  assert.equal(viewModel.headerMeta, "1:01");
  assert.equal(viewModel.runningScoreLabel, "194");
});

test("keyboard presenter marks empty result sessions as unsaveable", () => {
  const viewModel = buildKeyboardTrainViewModel({
    activeQuestionIndex: null,
    audioError: null,
    config: createKeyboardConfig(),
    isAuthenticated: true,
    phase: "result",
    remainingTimeMs: null,
    results: [],
    saveResult: null,
    summary: null,
  });

  assert.equal(viewModel.cannotSaveBecauseNoAnswers, true);
});

function createKeyboardConfig(
  overrides: Partial<KeyboardTrainingConfig> = {},
): KeyboardTrainingConfig {
  const config: KeyboardTrainingConfig = {
    mode: "keyboard" as const,
    intervalRange: { minSemitone: 0, maxSemitone: 12 },
    directionMode: "mixed" as const,
    includeUnison: false,
    includeOctave: true,
    baseNoteMode: "random" as const,
    fixedBaseNote: null,
    endCondition: {
      type: "time_limit" as const,
      timeLimitSeconds: 180,
    },
  };

  return {
    ...config,
    ...overrides,
    intervalRange: overrides.intervalRange ?? config.intervalRange,
    endCondition: overrides.endCondition ?? config.endCondition,
  };
}

function createKeyboardResult(props: { questionIndex: number; score: number }) {
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
    answeredNote: "E" as const,
    answeredDistanceSemitones: 4,
    isCorrect: true,
    errorSemitones: 0,
    responseTimeMs: 1250,
    score: props.score,
    scoreFormulaVersion: "v1" as const,
    replayBaseCount: 1,
    replayTargetCount: 1,
    presentedAt: "2026-04-24T10:00:00.000Z",
    answeredAt: "2026-04-24T10:00:01.250Z",
  };
}
