import assert from "node:assert/strict";
import test from "node:test";

const {
  buildKeyboardGuestSaveInput,
  evaluateKeyboardAnswer,
  getKeyboardFeedbackMidi,
} = await import(new URL("./keyboard-guest.ts", import.meta.url).href);

test("feedback audition covers all chromatic keys in the question direction", () => {
  const question = {
    questionIndex: 0,
    direction: "up" as const,
    baseNote: "C#" as const,
    baseMidi: 61,
    targetNote: "G#" as const,
    targetMidi: 68,
    distanceSemitones: 7,
    notationStyle: "sharp" as const,
  };
  const notes = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ] as const;
  assert.deepEqual(
    notes.map((note) => getKeyboardFeedbackMidi(question, note)),
    [72, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71],
  );
  assert.deepEqual(
    notes.map((note) =>
      getKeyboardFeedbackMidi(
        {
          ...question,
          direction: "down",
          targetMidi: 56,
          distanceSemitones: 5,
        },
        note,
      ),
    ),
    [60, 61, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
  );
});

test("feedback correct key uses the exact target for unison and both octaves", () => {
  for (const [direction, targetMidi] of [
    ["up", 60],
    ["up", 72],
    ["down", 48],
  ] as const) {
    assert.equal(
      getKeyboardFeedbackMidi(
        {
          questionIndex: 0,
          direction,
          baseNote: "C",
          baseMidi: 60,
          targetNote: "C",
          targetMidi,
          distanceSemitones: Math.abs(targetMidi - 60),
          notationStyle: "sharp",
        },
        "C",
      ),
      targetMidi,
    );
  }
});

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
