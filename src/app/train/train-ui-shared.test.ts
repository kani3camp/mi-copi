import assert from "node:assert/strict";
import test from "node:test";

const { buildDistanceFeedbackDiagramSteps } = await import(
  new URL("./distance-feedback-diagram.ts", import.meta.url).href
);

test("distance feedback diagram keeps the base note on the left for upward questions", () => {
  assert.deepEqual(
    buildDistanceFeedbackDiagramSteps({
      direction: "up",
      correctSemitones: 5,
      answeredSemitones: 3,
    }).map((step: { label: string }) => step.label),
    ["0", "+1", "+2", "+3", "+4", "+5"],
  );
});

test("distance feedback diagram moves the base note to the right for downward questions", () => {
  assert.deepEqual(
    buildDistanceFeedbackDiagramSteps({
      direction: "down",
      correctSemitones: 5,
      answeredSemitones: 3,
    }).map((step: { label: string }) => step.label),
    ["-5", "-4", "-3", "-2", "-1", "0"],
  );
});

test("distance feedback diagram preserves marker roles after reversing direction", () => {
  assert.deepEqual(
    buildDistanceFeedbackDiagramSteps({
      direction: "down",
      correctSemitones: 4,
      answeredSemitones: 1,
    }).map((step: { label: string; tone: string }) => [step.label, step.tone]),
    [
      ["-4", "brand"],
      ["-3", "idle"],
      ["-2", "idle"],
      ["-1", "teal"],
      ["0", "neutral"],
    ],
  );
});
