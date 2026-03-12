import assert from "node:assert/strict";
import test from "node:test";

const {
  getNextReplayCount,
  resolvePostFeedbackProgress,
  resolveTimeLimitExpiry,
} = await import(new URL("./session-flow.ts", import.meta.url).href);

test("getNextReplayCount increments only when playback actually starts", () => {
  assert.equal(getNextReplayCount(2, true), 3);
  assert.equal(getNextReplayCount(2, false), 2);
});

test("resolveTimeLimitExpiry moves to result and discards the unanswered question state", () => {
  assert.deepEqual(resolveTimeLimitExpiry("2026-03-12T00:03:00.000Z"), {
    phase: "result",
    finishReason: "time_up",
    endedAt: "2026-03-12T00:03:00.000Z",
    discardActiveQuestion: true,
    discardFeedbackResult: true,
    lastAnsweredWasFinal: true,
  });
});

test("resolvePostFeedbackProgress finishes when the question-count target is reached", () => {
  assert.deepEqual(
    resolvePostFeedbackProgress({
      endCondition: {
        type: "question_count",
        questionCount: 2,
      },
      currentQuestionIndex: 1,
      lastAnsweredWasFinal: false,
      answeredAt: "2026-03-12T00:03:00.000Z",
    }),
    {
      phase: "result",
      finishReason: "target_reached",
      endedAt: "2026-03-12T00:03:00.000Z",
    },
  );
});

test("resolvePostFeedbackProgress advances to the next question when the session should continue", () => {
  assert.deepEqual(
    resolvePostFeedbackProgress({
      endCondition: {
        type: "time_limit",
        timeLimitSeconds: 180,
      },
      currentQuestionIndex: 1,
      lastAnsweredWasFinal: false,
      answeredAt: "2026-03-12T00:03:00.000Z",
    }),
    {
      phase: "playing",
      nextQuestionIndex: 2,
    },
  );
});
