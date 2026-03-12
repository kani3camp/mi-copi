import {
  getBaseMidiForNoteClass,
  getNoteClassFromMidi,
  getTargetMidi,
  NOTE_CLASSES,
} from "./pitch.ts";
import type {
  DirectionMode,
  NoteClass,
  Question,
  QuestionDirection,
  TrainingConfig,
} from "./types.ts";

const SIMPLE_INTERVALS = new Set([0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12]);

export interface QuestionGeneratorState {
  candidateDistances: number[];
  distanceCounts: Record<number, number>;
  recentDistances: number[];
}

export interface QuestionGeneratorStepResult {
  state: QuestionGeneratorState;
  question: Question;
}

export function createQuestionGeneratorState(
  config: TrainingConfig,
): QuestionGeneratorState {
  const candidateDistances = getCandidateDistances(config);

  if (candidateDistances.length === 0) {
    throw new Error(
      "No candidate intervals available for question generation.",
    );
  }

  return {
    candidateDistances,
    distanceCounts: Object.fromEntries(
      candidateDistances.map((distance) => [distance, 0]),
    ) as Record<number, number>,
    recentDistances: [],
  };
}

export function takeNextQuestion(
  config: TrainingConfig,
  state: QuestionGeneratorState,
  questionIndex: number,
  randomValue: () => number = Math.random,
): QuestionGeneratorStepResult {
  const distanceSemitones = selectNextDistance(state, randomValue);
  const direction = resolveDirection(config.directionMode, randomValue);
  const baseNote = resolveBaseNote(config, randomValue);
  const baseMidi = getBaseMidiForNoteClass(baseNote);
  const targetMidi = getTargetMidi(baseMidi, direction, distanceSemitones);

  return {
    state: {
      candidateDistances: state.candidateDistances,
      distanceCounts: {
        ...state.distanceCounts,
        [distanceSemitones]: (state.distanceCounts[distanceSemitones] ?? 0) + 1,
      },
      recentDistances: [...state.recentDistances, distanceSemitones].slice(-2),
    },
    question: {
      questionIndex,
      direction,
      baseNote,
      baseMidi,
      targetNote: getNoteClassFromMidi(targetMidi),
      targetMidi,
      distanceSemitones,
      notationStyle: "sharp",
    },
  };
}

function getCandidateDistances(config: TrainingConfig): number[] {
  const candidates: number[] = [];

  for (
    let semitones = config.intervalRange.minSemitone;
    semitones <= config.intervalRange.maxSemitone;
    semitones += 1
  ) {
    if (!config.includeUnison && semitones === 0) {
      continue;
    }

    if (!config.includeOctave && semitones === 12) {
      continue;
    }

    if (
      config.mode === "distance" &&
      config.intervalGranularity === "simple" &&
      !SIMPLE_INTERVALS.has(semitones)
    ) {
      continue;
    }

    candidates.push(semitones);
  }

  return candidates;
}

function selectNextDistance(
  state: QuestionGeneratorState,
  randomValue: () => number,
): number {
  const minCount = Math.min(
    ...state.candidateDistances.map(
      (distance) => state.distanceCounts[distance] ?? 0,
    ),
  );
  let eligibleDistances = state.candidateDistances.filter(
    (distance) => (state.distanceCounts[distance] ?? 0) === minCount,
  );
  const repeatedDistance = getRepeatedDistance(state.recentDistances);

  if (repeatedDistance !== null) {
    const filteredDistances = eligibleDistances.filter(
      (distance) => distance !== repeatedDistance,
    );

    if (filteredDistances.length > 0) {
      eligibleDistances = filteredDistances;
    }
  }

  return eligibleDistances[
    Math.floor(randomValue() * eligibleDistances.length)
  ];
}

function getRepeatedDistance(recentDistances: number[]): number | null {
  if (recentDistances.length < 2 || recentDistances[0] !== recentDistances[1]) {
    return null;
  }

  return recentDistances[0];
}

function resolveDirection(
  directionMode: DirectionMode,
  randomValue: () => number,
): QuestionDirection {
  if (directionMode === "up_only") {
    return "up";
  }

  return randomValue() < 0.5 ? "up" : "down";
}

function resolveBaseNote(
  config: TrainingConfig,
  randomValue: () => number,
): NoteClass {
  if (config.baseNoteMode === "fixed") {
    return config.fixedBaseNote ?? "C";
  }

  return NOTE_CLASSES[Math.floor(randomValue() * NOTE_CLASSES.length)];
}
