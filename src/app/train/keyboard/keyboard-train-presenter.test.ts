import assert from "node:assert/strict";
import test from "node:test";

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

function createKeyboardConfig() {
  return {
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
}
