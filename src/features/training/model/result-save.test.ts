import assert from "node:assert/strict";
import test from "node:test";

const { hasTrainingResultSavePayload, shouldAutoSaveTrainingResult } =
  await import(new URL("./result-save.ts", import.meta.url).href);

test("hasTrainingResultSavePayload requires completed authenticated-session data", () => {
  assert.equal(
    hasTrainingResultSavePayload({
      isAuthenticated: true,
      startedAt: "2026-03-11T00:00:00.000Z",
      endedAt: "2026-03-11T00:01:00.000Z",
      finishReason: "target_reached",
      resultsCount: 3,
    }),
    true,
  );

  assert.equal(
    hasTrainingResultSavePayload({
      isAuthenticated: true,
      startedAt: "2026-03-11T00:00:00.000Z",
      endedAt: null,
      finishReason: "target_reached",
      resultsCount: 3,
    }),
    false,
  );

  assert.equal(
    hasTrainingResultSavePayload({
      isAuthenticated: true,
      startedAt: "2026-03-11T00:00:00.000Z",
      endedAt: "2026-03-11T00:01:00.000Z",
      finishReason: "target_reached",
      resultsCount: 0,
    }),
    false,
  );
});

test("shouldAutoSaveTrainingResult runs once per session and only when the payload is complete", () => {
  assert.equal(
    shouldAutoSaveTrainingResult({
      isAuthenticated: true,
      startedAt: "2026-03-11T00:00:00.000Z",
      endedAt: "2026-03-11T00:01:00.000Z",
      finishReason: "target_reached",
      resultsCount: 3,
      attemptedSessionId: null,
      isSavePending: false,
      hasSavedResult: false,
    }),
    true,
  );

  assert.equal(
    shouldAutoSaveTrainingResult({
      isAuthenticated: false,
      startedAt: "2026-03-11T00:00:00.000Z",
      endedAt: "2026-03-11T00:01:00.000Z",
      finishReason: "target_reached",
      resultsCount: 3,
      attemptedSessionId: null,
      isSavePending: false,
      hasSavedResult: false,
    }),
    false,
  );

  assert.equal(
    shouldAutoSaveTrainingResult({
      isAuthenticated: true,
      startedAt: "2026-03-11T00:00:00.000Z",
      endedAt: "2026-03-11T00:01:00.000Z",
      finishReason: "target_reached",
      resultsCount: 3,
      attemptedSessionId: "2026-03-11T00:00:00.000Z",
      isSavePending: false,
      hasSavedResult: false,
    }),
    false,
  );

  assert.equal(
    shouldAutoSaveTrainingResult({
      isAuthenticated: true,
      startedAt: "2026-03-11T00:00:00.000Z",
      endedAt: "2026-03-11T00:01:00.000Z",
      finishReason: "target_reached",
      resultsCount: 3,
      attemptedSessionId: null,
      isSavePending: true,
      hasSavedResult: false,
    }),
    false,
  );

  assert.equal(
    shouldAutoSaveTrainingResult({
      isAuthenticated: true,
      startedAt: "2026-03-11T00:00:00.000Z",
      endedAt: "2026-03-11T00:01:00.000Z",
      finishReason: "target_reached",
      resultsCount: 3,
      attemptedSessionId: null,
      isSavePending: false,
      hasSavedResult: true,
    }),
    false,
  );
});
