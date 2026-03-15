import assert from "node:assert/strict";
import test from "node:test";

const {
  buildTrainingHeaderMeta,
  buildTrainingHeaderNotice,
  formatTrainingPhaseLabel,
} = await import(new URL("./training-route-header.ts", import.meta.url).href);

test("training header meta shows saved state on result", () => {
  assert.equal(
    buildTrainingHeaderMeta({
      cannotSaveBecauseNoAnswers: false,
      isAuthenticated: true,
      phase: "result",
      remainingTimeMs: null,
      saveResult: {
        ok: true,
        savedQuestionCount: 3,
        sessionId: "session-1",
      },
    }),
    "保存済み",
  );
});

test("training header meta shows remaining time outside result", () => {
  assert.equal(
    buildTrainingHeaderMeta({
      cannotSaveBecauseNoAnswers: false,
      isAuthenticated: true,
      phase: "answering",
      remainingTimeMs: 61_000,
      saveResult: null,
    }),
    "1:01",
  );
});

test("training header meta shows out-of-scope save state for empty authenticated results", () => {
  assert.equal(
    buildTrainingHeaderMeta({
      cannotSaveBecauseNoAnswers: true,
      isAuthenticated: true,
      phase: "result",
      remainingTimeMs: null,
      saveResult: null,
    }),
    "保存対象外",
  );
});

test("training header notice prioritizes audio errors", () => {
  assert.equal(
    buildTrainingHeaderNotice({
      audioError: "音声の再生に失敗しました。",
      isAuthenticated: false,
    }),
    "音声の再生に失敗しました。",
  );
  assert.equal(formatTrainingPhaseLabel("feedback"), "フィードバック");
});
