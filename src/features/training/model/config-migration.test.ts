import assert from "node:assert/strict";
import test from "node:test";

const { readStoredTrainingConfigOrDefault } = await import(
  new URL("./config-migration.ts", import.meta.url).href
);

test("readStoredTrainingConfigOrDefault migrates legacy config shapes to canonical JSON", () => {
  const migrated = readStoredTrainingConfigOrDefault(
    {
      mode: "distance",
      intervalRange: {
        minSemitones: 1,
        maxSemitones: 9,
      },
      directionMode: "mixed",
      includeUnison: false,
      includeOctave: true,
      baseNoteMode: "fixed",
      fixedBaseNote: "F#",
      endCondition: {
        type: "time_limit",
        timeLimitMinutes: 4,
      },
      intervalGranularity: "aug_dim",
    },
    "distance",
  );

  assert.equal(migrated.shouldRewrite, true);
  assert.deepEqual(migrated.config, {
    mode: "distance",
    intervalRange: {
      minSemitone: 1,
      maxSemitone: 9,
    },
    directionMode: "mixed",
    includeUnison: false,
    includeOctave: true,
    baseNoteMode: "fixed",
    fixedBaseNote: "F#",
    endCondition: {
      type: "time_limit",
      timeLimitSeconds: 240,
    },
    intervalGranularity: "aug_dim",
  });
});

test("readStoredTrainingConfigOrDefault leaves canonical config snapshots untouched", () => {
  const stored = readStoredTrainingConfigOrDefault(
    {
      mode: "keyboard",
      intervalRange: {
        minSemitone: 0,
        maxSemitone: 12,
      },
      directionMode: "mixed",
      includeUnison: false,
      includeOctave: true,
      baseNoteMode: "random",
      fixedBaseNote: null,
      endCondition: {
        type: "question_count",
        questionCount: 10,
      },
    },
    "keyboard",
  );

  assert.equal(stored.shouldRewrite, false);
  assert.deepEqual(stored.config, {
    mode: "keyboard",
    intervalRange: {
      minSemitone: 0,
      maxSemitone: 12,
    },
    directionMode: "mixed",
    includeUnison: false,
    includeOctave: true,
    baseNoteMode: "random",
    fixedBaseNote: null,
    endCondition: {
      type: "question_count",
      questionCount: 10,
    },
  });
});
