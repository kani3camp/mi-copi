import assert from "node:assert/strict";
import test from "node:test";

const {
  TRAINING_CONFIG_LIMITS,
  normalizeTrainingConfig,
  normalizeTrainingConfigOrDefault,
  validateIntervalRange,
  validateQuestionCount,
  validateTimeLimitSeconds,
} = await import(new URL("./config.ts", import.meta.url).href);

test("normalizeTrainingConfig reads legacy minute-based and plural-key configs", () => {
  const normalized = normalizeTrainingConfig({
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
  });

  assert.deepEqual(normalized, {
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

test("normalizeTrainingConfig preserves canonical configs without reshaping values", () => {
  const normalized = normalizeTrainingConfig({
    mode: "keyboard",
    intervalRange: {
      minSemitone: 0,
      maxSemitone: 12,
    },
    directionMode: "up_only",
    includeUnison: true,
    includeOctave: false,
    baseNoteMode: "random",
    fixedBaseNote: null,
    endCondition: {
      type: "question_count",
      questionCount: 12,
    },
  });

  assert.deepEqual(normalized, {
    mode: "keyboard",
    intervalRange: {
      minSemitone: 0,
      maxSemitone: 12,
    },
    directionMode: "up_only",
    includeUnison: true,
    includeOctave: false,
    baseNoteMode: "random",
    fixedBaseNote: null,
    endCondition: {
      type: "question_count",
      questionCount: 12,
    },
  });
});

test("normalizeTrainingConfigOrDefault clamps documented ranges", () => {
  const normalized = normalizeTrainingConfigOrDefault(
    {
      intervalRange: {
        minSemitones: 12,
        maxSemitones: 0,
      },
      endCondition: {
        type: "time_limit",
        timeLimitMinutes: 99,
      },
    },
    "keyboard",
  );

  assert.deepEqual(normalized, {
    mode: "keyboard",
    intervalRange: {
      minSemitone: TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.max,
      maxSemitone: TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.max,
    },
    directionMode: "mixed",
    includeUnison: false,
    includeOctave: true,
    baseNoteMode: "random",
    fixedBaseNote: null,
    endCondition: {
      type: "time_limit",
      timeLimitSeconds: TRAINING_CONFIG_LIMITS.timeLimitSeconds.max,
    },
  });
});

test("validateQuestionCount rejects values outside documented bounds", () => {
  assert.equal(
    validateQuestionCount(TRAINING_CONFIG_LIMITS.questionCount.min - 1),
    `questionCount must be between ${TRAINING_CONFIG_LIMITS.questionCount.min} and ${TRAINING_CONFIG_LIMITS.questionCount.max}.`,
  );
});

test("validateIntervalRange rejects minSemitone above the documented max", () => {
  assert.equal(
    validateIntervalRange({
      minSemitone: TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.max + 1,
      maxSemitone: TRAINING_CONFIG_LIMITS.intervalRange.maxSemitone.max,
    }),
    `minSemitone must be between ${TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.min} and ${TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.max}.`,
  );
});

test("validateTimeLimitSeconds rejects values outside documented bounds", () => {
  assert.equal(
    validateTimeLimitSeconds(TRAINING_CONFIG_LIMITS.timeLimitSeconds.min - 1),
    `timeLimitSeconds must be between ${TRAINING_CONFIG_LIMITS.timeLimitSeconds.min} and ${TRAINING_CONFIG_LIMITS.timeLimitSeconds.max}.`,
  );
});
