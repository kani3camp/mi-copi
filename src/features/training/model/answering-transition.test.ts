import assert from "node:assert/strict";
import test from "node:test";

const { shouldStartAnsweringTransition, shouldStartQuestionPlayback } =
  await import(
  new URL("./answering-transition.ts", import.meta.url).href
);

test("starts playback when the active question nonce is not already in flight", () => {
  assert.equal(
    shouldStartQuestionPlayback({
      phase: "playing",
      activePlayNonce: 4,
      inFlightPlayNonce: null,
    }),
    true,
  );
});

test("blocks duplicate playback setup while the same nonce is already in flight", () => {
  assert.equal(
    shouldStartQuestionPlayback({
      phase: "playing",
      activePlayNonce: 4,
      inFlightPlayNonce: 4,
    }),
    false,
  );
});

test("allows playback setup again after cleanup cleared the in-flight nonce", () => {
  assert.equal(
    shouldStartQuestionPlayback({
      phase: "playing",
      activePlayNonce: 4,
      inFlightPlayNonce: null,
    }),
    true,
  );
});

test("allows the first answering transition for the active question nonce", () => {
  assert.equal(
    shouldStartAnsweringTransition({
      phase: "playing",
      activePlayNonce: 4,
      targetPlayNonce: 4,
      handledPlayNonce: null,
    }),
    true,
  );
});

test("blocks duplicate answering transitions for the same question nonce", () => {
  assert.equal(
    shouldStartAnsweringTransition({
      phase: "playing",
      activePlayNonce: 4,
      targetPlayNonce: 4,
      handledPlayNonce: 4,
    }),
    false,
  );
});

test("blocks stale timers from unlocking a newer active question", () => {
  assert.equal(
    shouldStartAnsweringTransition({
      phase: "playing",
      activePlayNonce: 5,
      targetPlayNonce: 4,
      handledPlayNonce: null,
    }),
    false,
  );
});

test("does not unlock when the session has already left playing phase", () => {
  assert.equal(
    shouldStartAnsweringTransition({
      phase: "feedback",
      activePlayNonce: 4,
      targetPlayNonce: 4,
      handledPlayNonce: null,
    }),
    false,
  );
});
