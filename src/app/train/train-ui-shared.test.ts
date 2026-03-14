import assert from "node:assert/strict";
import test from "node:test";

const { buildDistanceFeedbackDiagramAnnotations } = await import(
  new URL("./distance-feedback-annotations.ts", import.meta.url).href
);
const { buildDistanceFeedbackDiagramArrows } = await import(
  new URL("./distance-feedback-arrows.ts", import.meta.url).href
);
const { getDistanceFeedbackArrowRenderGeometry } = await import(
  new URL("./distance-feedback-arrow-render.ts", import.meta.url).href
);
const { buildDistanceFeedbackDiagramSteps } = await import(
  new URL("./distance-feedback-diagram.ts", import.meta.url).href
);
const { getDistanceFeedbackStatus } = await import(
  new URL("./distance-feedback-status.ts", import.meta.url).href
);

test("distance feedback diagram keeps the base note on the left for upward questions", () => {
  const labels = buildDistanceFeedbackDiagramSteps({
    direction: "up",
    correctSemitones: 5,
    answeredSemitones: 3,
  }).map((step: { label: string }) => step.label);
  assert.equal(labels.length, 13);
  assert.equal(labels[0], "0");
  assert.equal(labels[12], "+12");
});

test("distance feedback diagram moves the base note to the right for downward questions", () => {
  const labels = buildDistanceFeedbackDiagramSteps({
    direction: "down",
    correctSemitones: 5,
    answeredSemitones: 3,
  }).map((step: { label: string }) => step.label);
  assert.equal(labels.length, 13);
  assert.equal(labels[0], "-12");
  assert.equal(labels[12], "0");
});

test("distance feedback diagram preserves marker roles after reversing direction", () => {
  const steps = buildDistanceFeedbackDiagramSteps({
    direction: "down",
    correctSemitones: 4,
    answeredSemitones: 1,
  });
  const byLabel = Object.fromEntries(
    steps.map((step: { label: string; tone: string }) => [
      step.label,
      step.tone,
    ]),
  );
  assert.equal(byLabel["-4"], "success");
  assert.equal(byLabel["-1"], "teal");
  assert.equal(byLabel["0"], "neutral");
  assert.equal(byLabel["-12"], "idle");
});

test("distance feedback diagram exposes separate correct and answered annotations", () => {
  assert.deepEqual(
    buildDistanceFeedbackDiagramAnnotations({
      correctSemitones: 5,
      answeredSemitones: 3,
    }),
    [
      { distance: 0, label: "基準音", tone: "neutral" },
      {
        distance: 3,
        label: "回答",
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
      { distance: 0, label: "基準音", tone: "neutral" },
      {
        distance: 5,
        label: "正解",
        tone: "success",
      },
      {
        distance: 5,
        label: "回答",
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

test("distance feedback diagram arrows have direction for fixed scale (13 steps)", () => {
  const arrows = buildDistanceFeedbackDiagramArrows({
    stepCount: 13,
    baseIndex: 0,
    correctIndex: 5,
    answeredIndex: 3,
  });
  assert.equal(arrows.length, 2);
  for (const arrow of arrows) {
    assert.ok(
      arrow.direction === "forward" || arrow.direction === "backward",
      `each arrow has direction forward or backward, got ${arrow.direction}`,
    );
    assert.ok(
      arrow.tone === "success" || arrow.tone === "teal",
      `each arrow has tone success or teal, got ${arrow.tone}`,
    );
  }
});

test("distance feedback diagram arrows return no geometry for invalid indices", () => {
  assert.deepEqual(
    buildDistanceFeedbackDiagramArrows({
      stepCount: 13,
      baseIndex: -1,
      correctIndex: 5,
      answeredIndex: 3,
    }),
    [],
  );
});

test("distance feedback diagram does not render a negative-length arrow for zero distance", () => {
  assert.equal(
    getDistanceFeedbackArrowRenderGeometry({
      x1: 4.5,
      x2: 4.5,
      yLane: 2.3,
      tone: "teal",
      direction: "forward",
    }),
    null,
  );
});

test("distance feedback layout input: base index 0 for up, 12 for down", () => {
  const stepsUp = buildDistanceFeedbackDiagramSteps({
    direction: "up",
    correctSemitones: 5,
    answeredSemitones: 3,
  });
  const stepsDown = buildDistanceFeedbackDiagramSteps({
    direction: "down",
    correctSemitones: 5,
    answeredSemitones: 3,
  });
  const baseIndexUp = stepsUp.findIndex(
    (s: { distance: number }) => s.distance === 0,
  );
  const baseIndexDown = stepsDown.findIndex(
    (s: { distance: number }) => s.distance === 0,
  );
  assert.equal(baseIndexUp, 0);
  assert.equal(baseIndexDown, 12);
});

test("distance feedback layout input: exact match yields same distance for correct and answered annotations", () => {
  const annotations = buildDistanceFeedbackDiagramAnnotations({
    correctSemitones: 2,
    answeredSemitones: 2,
  });
  const correctAnn = annotations.find(
    (a: { label: string }) => a.label === "正解",
  );
  const answerAnn = annotations.find(
    (a: { label: string }) => a.label === "回答",
  );
  assert.ok(correctAnn && answerAnn);
  assert.equal(correctAnn.distance, answerAnn.distance);
});

test("distance feedback layout input: answer at base has answer distance 0", () => {
  const annotations = buildDistanceFeedbackDiagramAnnotations({
    correctSemitones: 3,
    answeredSemitones: 0,
  });
  const answerAnn = annotations.find(
    (a: { label: string; distance: number }) => a.label === "回答",
  );
  assert.ok(answerAnn);
  assert.equal(answerAnn.distance, 0);
});

test("distance feedback layout input: 13 steps and valid indices at range edge", () => {
  const steps = buildDistanceFeedbackDiagramSteps({
    direction: "up",
    correctSemitones: 12,
    answeredSemitones: 11,
  });
  assert.equal(steps.length, 13);
  const baseIndex = steps.findIndex(
    (s: { distance: number }) => s.distance === 0,
  );
  const correctIndex = steps.findIndex(
    (s: { distance: number }) => s.distance === 12,
  );
  const answeredIndex = steps.findIndex(
    (s: { distance: number }) => s.distance === 11,
  );
  assert.equal(baseIndex, 0);
  assert.equal(correctIndex, 12);
  assert.equal(answeredIndex, 11);
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
