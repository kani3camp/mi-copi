import assert from "node:assert/strict";
import test from "node:test";

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

function createDistanceConfig() {
  return {
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
}
