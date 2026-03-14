import assert from "node:assert/strict";
import test from "node:test";

const { formatPitchComparisonSemitoneLabel, formatSignedSemitoneLabel } =
  await import(new URL("./interval-notation.ts", import.meta.url).href);

test("signed semitone labels keep the existing generic wording", () => {
  assert.equal(formatSignedSemitoneLabel(0), "0半音（ぴったり）");
  assert.equal(formatSignedSemitoneLabel(1), "+1半音（高い）");
  assert.equal(formatSignedSemitoneLabel(-2), "-2半音（低い）");
});

test("pitch comparison labels use target and answer midi only", () => {
  assert.equal(
    formatPitchComparisonSemitoneLabel({
      targetMidi: 57,
      answerMidi: 58,
    }),
    "+1半音（高い）",
  );
  assert.equal(
    formatPitchComparisonSemitoneLabel({
      targetMidi: 57,
      answerMidi: 55,
    }),
    "-2半音（低い）",
  );
  assert.equal(
    formatPitchComparisonSemitoneLabel({
      targetMidi: 60,
      answerMidi: 60,
    }),
    "0半音（ぴったり）",
  );
});
