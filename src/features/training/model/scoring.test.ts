import assert from "node:assert/strict";
import test from "node:test";

const { calculateQuestionScoreV1, isCorrectByErrorSemitones } = await import(
  new URL("./scoring.ts", import.meta.url).href
);

test("calculateQuestionScoreV1 follows the canonical v1 formula", () => {
  assert.equal(
    calculateQuestionScoreV1({
      errorSemitones: 0,
      responseTimeMs: 1500,
      targetIntervalSemitones: 12,
    }),
    192,
  );

  assert.equal(
    calculateQuestionScoreV1({
      errorSemitones: -1,
      responseTimeMs: 5000,
      targetIntervalSemitones: 6,
    }),
    58.905,
  );

  assert.equal(
    calculateQuestionScoreV1({
      errorSemitones: 3,
      responseTimeMs: 1000,
      targetIntervalSemitones: 7,
    }),
    0,
  );
});

test("isCorrectByErrorSemitones maps only zero error to correct", () => {
  assert.equal(isCorrectByErrorSemitones(0), true);
  assert.equal(isCorrectByErrorSemitones(-1), false);
  assert.equal(isCorrectByErrorSemitones(2), false);
});
