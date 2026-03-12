import assert from "node:assert/strict";
import test from "node:test";

const { buildKeyboardGuestSaveInput, evaluateKeyboardAnswer } = await import(
  new URL("./keyboard-guest.ts", import.meta.url).href
);

test("keyboard guest keeps descending exact answers on the lower octave", () => {
  const question = {
    questionIndex: 0,
    direction: "down" as const,
    baseNote: "C" as const,
    baseMidi: 60,
    targetNote: "B" as const,
    targetMidi: 59,
    distanceSemitones: 1,
    notationStyle: "sharp" as const,
  };

  const result = evaluateKeyboardAnswer({
    question,
    answeredNote: "B",
    responseTimeMs: 800,
    replayBaseCount: 0,
    replayTargetCount: 0,
    presentedAt: "2026-03-12T00:00:00.000Z",
    answeredAt: "2026-03-12T00:00:00.800Z",
  });

  assert.equal(result.isCorrect, true);
  assert.equal(result.errorSemitones, 0);

  const saveInput = buildKeyboardGuestSaveInput({
    config: {
      mode: "keyboard",
      intervalRange: { minSemitone: 1, maxSemitone: 1 },
      directionMode: "mixed",
      includeUnison: false,
      includeOctave: false,
      baseNoteMode: "fixed",
      fixedBaseNote: "C",
      endCondition: { type: "question_count", questionCount: 1 },
    },
    startedAt: "2026-03-12T00:00:00.000Z",
    endedAt: "2026-03-12T00:00:00.800Z",
    finishReason: "target_reached",
    results: [result],
  });

  assert.equal(saveInput.results[0]?.targetMidi, 59);
  assert.equal(saveInput.results[0]?.answerMidi, 59);
});

test("keyboard guest computes signed error from descending answered notes", () => {
  const question = {
    questionIndex: 0,
    direction: "down" as const,
    baseNote: "G" as const,
    baseMidi: 67,
    targetNote: "E" as const,
    targetMidi: 64,
    distanceSemitones: 3,
    notationStyle: "sharp" as const,
  };

  const result = evaluateKeyboardAnswer({
    question,
    answeredNote: "F",
    responseTimeMs: 900,
    replayBaseCount: 0,
    replayTargetCount: 0,
    presentedAt: "2026-03-12T00:00:00.000Z",
    answeredAt: "2026-03-12T00:00:00.900Z",
  });

  assert.equal(result.errorSemitones, -1);

  const saveInput = buildKeyboardGuestSaveInput({
    config: {
      mode: "keyboard",
      intervalRange: { minSemitone: 3, maxSemitone: 3 },
      directionMode: "mixed",
      includeUnison: false,
      includeOctave: false,
      baseNoteMode: "fixed",
      fixedBaseNote: "G",
      endCondition: { type: "question_count", questionCount: 1 },
    },
    startedAt: "2026-03-12T00:00:00.000Z",
    endedAt: "2026-03-12T00:00:00.900Z",
    finishReason: "target_reached",
    results: [result],
  });

  assert.equal(saveInput.results[0]?.answerMidi, 65);
});
