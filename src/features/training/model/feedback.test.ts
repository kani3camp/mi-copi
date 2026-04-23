import assert from "node:assert/strict";
import test from "node:test";

const { getTrainingAnswerFeedbackKind } = await import(
  new URL("./feedback.ts", import.meta.url).href
);

test("feedback kind treats exact matches as correct", () => {
  assert.equal(getTrainingAnswerFeedbackKind(0), "correct");
});

test("feedback kind treats one-semitone misses as close in both directions", () => {
  assert.equal(getTrainingAnswerFeedbackKind(1), "close");
  assert.equal(getTrainingAnswerFeedbackKind(-1), "close");
});

test("feedback kind treats larger misses as incorrect in both directions", () => {
  assert.equal(getTrainingAnswerFeedbackKind(2), "incorrect");
  assert.equal(getTrainingAnswerFeedbackKind(-2), "incorrect");
});
