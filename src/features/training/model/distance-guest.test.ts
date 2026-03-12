import assert from "node:assert/strict";
import test from "node:test";

const {
  buildDistanceGuestSaveInput,
  evaluateDistanceAnswer,
  generateDistanceQuestion,
} = await import(new URL("./distance-guest.ts", import.meta.url).href);

test("distance guest keeps descending target midi and exact answers aligned", () => {
  const question = generateDistanceQuestion(
    {
      mode: "distance",
      intervalRange: { minSemitone: 1, maxSemitone: 1 },
      directionMode: "mixed",
      includeUnison: false,
      includeOctave: false,
      baseNoteMode: "fixed",
      fixedBaseNote: "C",
      endCondition: { type: "question_count", questionCount: 1 },
      intervalGranularity: "simple",
    },
    0,
    createSequenceRandom([0, 0.9]),
  );

  assert.equal(question.baseMidi, 60);
  assert.equal(question.targetNote, "B");
  assert.equal(question.targetMidi, 59);

  const result = evaluateDistanceAnswer({
    question,
    answeredDistanceSemitones: 1,
    responseTimeMs: 900,
    replayBaseCount: 0,
    replayTargetCount: 0,
    presentedAt: "2026-03-12T00:00:00.000Z",
    answeredAt: "2026-03-12T00:00:00.900Z",
  });

  assert.equal(result.isCorrect, true);
  assert.equal(result.errorSemitones, 0);

  const saveInput = buildDistanceGuestSaveInput({
    config: {
      mode: "distance",
      intervalRange: { minSemitone: 1, maxSemitone: 1 },
      directionMode: "mixed",
      includeUnison: false,
      includeOctave: false,
      baseNoteMode: "fixed",
      fixedBaseNote: "C",
      endCondition: { type: "question_count", questionCount: 1 },
      intervalGranularity: "simple",
    },
    startedAt: "2026-03-12T00:00:00.000Z",
    endedAt: "2026-03-12T00:00:00.900Z",
    finishReason: "target_reached",
    results: [result],
  });

  assert.equal(saveInput.results[0]?.targetMidi, 59);
  assert.equal(saveInput.results[0]?.answerMidi, 59);
});

test("distance guest save payload keeps descending wrong answers signed correctly", () => {
  const question = {
    questionIndex: 0,
    direction: "down" as const,
    baseNote: "C" as const,
    baseMidi: 60,
    targetNote: "A" as const,
    targetMidi: 57,
    distanceSemitones: 3,
    notationStyle: "sharp" as const,
  };

  const result = evaluateDistanceAnswer({
    question,
    answeredDistanceSemitones: 2,
    responseTimeMs: 900,
    replayBaseCount: 0,
    replayTargetCount: 0,
    presentedAt: "2026-03-12T00:00:00.000Z",
    answeredAt: "2026-03-12T00:00:00.900Z",
  });

  assert.equal(result.errorSemitones, -1);

  const saveInput = buildDistanceGuestSaveInput({
    config: {
      mode: "distance",
      intervalRange: { minSemitone: 3, maxSemitone: 3 },
      directionMode: "mixed",
      includeUnison: false,
      includeOctave: false,
      baseNoteMode: "fixed",
      fixedBaseNote: "C",
      endCondition: { type: "question_count", questionCount: 1 },
      intervalGranularity: "simple",
    },
    startedAt: "2026-03-12T00:00:00.000Z",
    endedAt: "2026-03-12T00:00:00.900Z",
    finishReason: "target_reached",
    results: [result],
  });

  assert.equal(saveInput.results[0]?.answerNoteName, "A#");
  assert.equal(saveInput.results[0]?.answerMidi, 58);
});

function createSequenceRandom(values: number[]): () => number {
  let index = 0;

  return () => {
    const value = values[index];

    if (value === undefined) {
      throw new Error("Ran out of deterministic random values.");
    }

    index += 1;

    return value;
  };
}
