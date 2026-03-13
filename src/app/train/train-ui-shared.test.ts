import assert from "node:assert/strict";
import test from "node:test";

const { buildDistanceFeedbackDiagramAnnotations } = await import(
  new URL("./distance-feedback-annotations.ts", import.meta.url).href
);
const { buildDistanceFeedbackDiagramArrows } = await import(
  new URL("./distance-feedback-arrows.ts", import.meta.url).href
);
const { buildDistanceFeedbackDiagramSteps } = await import(
  new URL("./distance-feedback-diagram.ts", import.meta.url).href
);
const { getDistanceFeedbackStatus } = await import(
  new URL("./distance-feedback-status.ts", import.meta.url).href
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
      ["-4", "success"],
      ["-3", "idle"],
      ["-2", "idle"],
      ["-1", "teal"],
      ["0", "neutral"],
    ],
  );
});

test("distance feedback diagram exposes separate correct and answered annotations", () => {
  assert.deepEqual(
    buildDistanceFeedbackDiagramAnnotations({
      correctSemitones: 5,
      answeredSemitones: 3,
    }),
    [
      {
        distance: 3,
        label: "解答",
        tone: "teal",
      },
      {
        distance: 5,
        label: "正解",
        tone: "success",
      },
    ],
  );
});

test("distance feedback diagram stacks correct and answered annotations on exact match", () => {
  assert.deepEqual(
    buildDistanceFeedbackDiagramAnnotations({
      correctSemitones: 5,
      answeredSemitones: 5,
    }),
    [
      {
        distance: 5,
        label: "正解",
        tone: "success",
      },
      {
        distance: 5,
        label: "解答",
        tone: "teal",
      },
    ],
  );
});

test("distance feedback diagram arrows start from the base note and split into two lanes", () => {
  assert.deepEqual(
    buildDistanceFeedbackDiagramArrows({
      stepCount: 6,
      baseIndex: 0,
      correctIndex: 5,
      answeredIndex: 3,
    }),
    [
      {
        columnStart: 1,
        columnEnd: 7,
        direction: "forward",
        lane: "upper",
        tone: "success",
      },
      {
        columnStart: 1,
        columnEnd: 5,
        direction: "forward",
        lane: "lower",
        tone: "teal",
      },
    ],
  );
});

test("distance feedback diagram arrows reverse for downward questions while keeping the base note as the origin", () => {
  assert.deepEqual(
    buildDistanceFeedbackDiagramArrows({
      stepCount: 5,
      baseIndex: 4,
      correctIndex: 0,
      answeredIndex: 2,
    }),
    [
      {
        columnStart: 1,
        columnEnd: 6,
        direction: "backward",
        lane: "upper",
        tone: "success",
      },
      {
        columnStart: 3,
        columnEnd: 6,
        direction: "backward",
        lane: "lower",
        tone: "teal",
      },
    ],
  );
});

test("distance feedback status does not infer reverse direction for distance mode", () => {
  assert.deepEqual(
    getDistanceFeedbackStatus({
      isCorrect: true,
      errorSemitones: 0,
    }),
    {
      label: "完全一致",
      tone: "brand",
    },
  );
});

test("distance feedback status marks one semitone error as close", () => {
  assert.deepEqual(
    getDistanceFeedbackStatus({
      isCorrect: false,
      errorSemitones: -1,
    }),
    {
      label: "惜しい",
      tone: "amber",
    },
  );
});

test("distance feedback status marks larger errors without direction language", () => {
  assert.deepEqual(
    getDistanceFeedbackStatus({
      isCorrect: false,
      errorSemitones: 2,
    }),
    {
      label: "ずれあり",
      tone: "coral",
    },
  );
});
