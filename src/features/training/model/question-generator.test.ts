import assert from "node:assert/strict";
import test from "node:test";
import type { DistanceTrainingConfig, KeyboardTrainingConfig } from "./types";

const { createQuestionGeneratorState, takeNextQuestion } = await import(
  new URL("./question-generator.ts", import.meta.url).href
);

test("generator state derives effective candidates from config", () => {
  const distanceConfig = createDistanceConfig();
  distanceConfig.intervalRange.minSemitone = 0;
  distanceConfig.intervalRange.maxSemitone = 6;
  distanceConfig.includeUnison = false;
  distanceConfig.includeOctave = false;
  distanceConfig.intervalGranularity = "simple";

  assert.deepEqual(createQuestionGeneratorState(distanceConfig), {
    candidateDistances: [1, 2, 3, 4, 5],
    distanceCounts: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
    recentDistances: [],
  });

  distanceConfig.intervalGranularity = "aug_dim";

  assert.deepEqual(
    createQuestionGeneratorState(distanceConfig).candidateDistances,
    [1, 2, 3, 4, 5, 6],
  );

  const keyboardConfig = createKeyboardConfig();
  keyboardConfig.intervalRange.minSemitone = 10;
  keyboardConfig.intervalRange.maxSemitone = 12;
  keyboardConfig.includeOctave = false;

  assert.deepEqual(
    createQuestionGeneratorState(keyboardConfig).candidateDistances,
    [10, 11],
  );
});

test("generator distributes distances evenly and avoids three repeats in a row", () => {
  const config = createDistanceConfig();
  config.intervalRange.minSemitone = 1;
  config.intervalRange.maxSemitone = 3;
  config.includeOctave = false;
  config.baseNoteMode = "fixed";
  config.fixedBaseNote = "C";
  config.directionMode = "up_only";

  let state = createQuestionGeneratorState(config);
  const generatedDistances: number[] = [];

  for (let index = 0; index < 9; index += 1) {
    const next = takeNextQuestion(config, state, index, () => 0);
    state = next.state;
    generatedDistances.push(next.question.distanceSemitones);
  }

  assert.deepEqual(generatedDistances, [1, 2, 3, 1, 2, 3, 1, 2, 3]);
  assert.deepEqual(state.distanceCounts, {
    1: 3,
    2: 3,
    3: 3,
  });

  for (let index = 2; index < generatedDistances.length; index += 1) {
    assert.notEqual(
      generatedDistances[index],
      generatedDistances[index - 1] === generatedDistances[index - 2]
        ? generatedDistances[index - 1]
        : Number.NaN,
    );
  }
});

test("generator relaxes repeat control when only one candidate is available", () => {
  const config = createKeyboardConfig();
  config.intervalRange.minSemitone = 5;
  config.intervalRange.maxSemitone = 5;
  config.includeUnison = true;
  config.includeOctave = false;
  config.baseNoteMode = "fixed";
  config.fixedBaseNote = "C";
  config.directionMode = "up_only";

  let state = createQuestionGeneratorState(config);
  const generatedDistances: number[] = [];

  for (let index = 0; index < 3; index += 1) {
    const next = takeNextQuestion(config, state, index, () => 0);
    state = next.state;
    generatedDistances.push(next.question.distanceSemitones);
  }

  assert.deepEqual(generatedDistances, [5, 5, 5]);
});

test("generator respects up_only and mixed direction modes", () => {
  const upOnlyConfig = createKeyboardConfig();
  upOnlyConfig.intervalRange.minSemitone = 5;
  upOnlyConfig.intervalRange.maxSemitone = 5;
  upOnlyConfig.baseNoteMode = "fixed";
  upOnlyConfig.fixedBaseNote = "C";
  upOnlyConfig.directionMode = "up_only";

  const upOnlyStep = takeNextQuestion(
    upOnlyConfig,
    createQuestionGeneratorState(upOnlyConfig),
    0,
    () => 0.9,
  );

  assert.equal(upOnlyStep.question.direction, "up");

  const mixedConfig = createKeyboardConfig();
  mixedConfig.intervalRange.minSemitone = 5;
  mixedConfig.intervalRange.maxSemitone = 5;
  mixedConfig.baseNoteMode = "fixed";
  mixedConfig.fixedBaseNote = "C";
  mixedConfig.directionMode = "mixed";

  const randomValue = createSequenceRandom([0, 0.9, 0, 0.1]);
  const firstStep = takeNextQuestion(
    mixedConfig,
    createQuestionGeneratorState(mixedConfig),
    0,
    randomValue,
  );
  const secondStep = takeNextQuestion(
    mixedConfig,
    firstStep.state,
    1,
    randomValue,
  );

  assert.equal(firstStep.question.direction, "down");
  assert.equal(secondStep.question.direction, "up");
});

test("generator keeps fixed base notes and randomizes random base notes", () => {
  const fixedConfig = createDistanceConfig();
  fixedConfig.intervalRange.minSemitone = 1;
  fixedConfig.intervalRange.maxSemitone = 1;
  fixedConfig.baseNoteMode = "fixed";
  fixedConfig.fixedBaseNote = "F#";
  fixedConfig.directionMode = "up_only";

  const fixedStep = takeNextQuestion(
    fixedConfig,
    createQuestionGeneratorState(fixedConfig),
    0,
    () => 0,
  );

  assert.equal(fixedStep.question.baseNote, "F#");

  const randomConfig = createDistanceConfig();
  randomConfig.intervalRange.minSemitone = 1;
  randomConfig.intervalRange.maxSemitone = 1;
  randomConfig.baseNoteMode = "random";
  randomConfig.directionMode = "up_only";

  const randomValue = createSequenceRandom([0, 0.99, 0, 0]);
  const firstStep = takeNextQuestion(
    randomConfig,
    createQuestionGeneratorState(randomConfig),
    0,
    randomValue,
  );
  const secondStep = takeNextQuestion(
    randomConfig,
    firstStep.state,
    1,
    randomValue,
  );

  assert.equal(firstStep.question.baseNote, "B");
  assert.equal(secondStep.question.baseNote, "C");
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

function createDistanceConfig(): DistanceTrainingConfig {
  return {
    mode: "distance" as const,
    intervalRange: {
      minSemitone: 0,
      maxSemitone: 12,
    },
    directionMode: "mixed" as const,
    includeUnison: false,
    includeOctave: true,
    baseNoteMode: "random" as const,
    fixedBaseNote: null,
    endCondition: {
      type: "question_count" as const,
      questionCount: 10,
    },
    intervalGranularity: "simple" as const,
  };
}

function createKeyboardConfig(): KeyboardTrainingConfig {
  return {
    mode: "keyboard" as const,
    intervalRange: {
      minSemitone: 0,
      maxSemitone: 12,
    },
    directionMode: "mixed" as const,
    includeUnison: false,
    includeOctave: true,
    baseNoteMode: "random" as const,
    fixedBaseNote: null,
    endCondition: {
      type: "question_count" as const,
      questionCount: 10,
    },
  };
}
