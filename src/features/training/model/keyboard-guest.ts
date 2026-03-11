import { buildSessionSummaryFromResults } from "./summary";
import type {
  DirectionMode,
  KeyboardTrainingConfig,
  NoteClass,
  Question,
  QuestionDirection,
  SaveQuestionResultInput,
  SaveTrainingSessionInput,
  ScoreFormulaVersion,
  SessionFinishReason,
} from "./types";

const NOTE_CLASSES: NoteClass[] = [
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
];

export interface KeyboardGuestResult {
  question: Question;
  answeredNote: NoteClass;
  answeredDistanceSemitones: number;
  isCorrect: boolean;
  errorSemitones: number;
  responseTimeMs: number;
  score: number;
  scoreFormulaVersion: ScoreFormulaVersion;
  replayBaseCount: number;
  replayTargetCount: number;
  presentedAt: string;
  answeredAt: string;
}

export interface KeyboardGuestSummary {
  questionCount: number;
  correctCount: number;
  accuracyRate: number;
  avgErrorAbs: number;
  avgResponseTimeMs: number;
  sessionScore: number;
}

export function createDefaultKeyboardTrainingConfig(): KeyboardTrainingConfig {
  return {
    mode: "keyboard",
    intervalRange: {
      minSemitones: 0,
      maxSemitones: 12,
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
  };
}

export function getKeyboardQuestionCount(
  config: KeyboardTrainingConfig,
): number {
  if (config.endCondition.type === "question_count") {
    return config.endCondition.questionCount;
  }

  return 0;
}

export function getKeyboardAnswerChoices(): NoteClass[] {
  return NOTE_CLASSES;
}

export function validateKeyboardTrainingConfig(
  config: KeyboardTrainingConfig,
): string | null {
  if (config.intervalRange.minSemitones > config.intervalRange.maxSemitones) {
    return "minSemitones must be less than or equal to maxSemitones.";
  }

  if (getKeyboardPlayableIntervals(config).length === 0) {
    return "The selected interval settings do not produce any playable questions.";
  }

  if (
    config.endCondition.type === "question_count" &&
    config.endCondition.questionCount <= 0
  ) {
    return "questionCount must be at least 1.";
  }

  if (
    config.endCondition.type === "time_limit" &&
    config.endCondition.timeLimitMinutes <= 0
  ) {
    return "timeLimitMinutes must be at least 1.";
  }

  return null;
}

export function generateKeyboardQuestion(
  config: KeyboardTrainingConfig,
  questionIndex: number,
  randomValue: () => number = Math.random,
): Question {
  const intervals = getKeyboardPlayableIntervals(config);

  if (intervals.length === 0) {
    throw new Error("No candidate intervals available for keyboard question.");
  }

  const distanceSemitones =
    intervals[Math.floor(randomValue() * intervals.length)];
  const direction = resolveDirection(config.directionMode, randomValue);
  const baseNote =
    config.baseNoteMode === "fixed" && config.fixedBaseNote
      ? config.fixedBaseNote
      : NOTE_CLASSES[Math.floor(randomValue() * NOTE_CLASSES.length)];

  return {
    questionIndex,
    direction,
    baseNote,
    targetNote: shiftNote(
      baseNote,
      direction === "up" ? distanceSemitones : -distanceSemitones,
    ),
    distanceSemitones,
    notationStyle: "sharp",
  };
}

export function evaluateKeyboardAnswer(params: {
  question: Question;
  answeredNote: NoteClass;
  responseTimeMs: number;
  replayBaseCount: number;
  replayTargetCount: number;
  presentedAt: string;
  answeredAt: string;
}): KeyboardGuestResult {
  const isCorrect = params.answeredNote === params.question.targetNote;
  const answeredDistanceSemitones = isCorrect
    ? params.question.distanceSemitones
    : getDirectedDistanceSemitones(
        params.question.baseNote,
        params.answeredNote,
        params.question.direction,
      );
  const errorSemitones =
    answeredDistanceSemitones - params.question.distanceSemitones;

  return {
    question: params.question,
    answeredNote: params.answeredNote,
    answeredDistanceSemitones,
    isCorrect,
    errorSemitones,
    responseTimeMs: params.responseTimeMs,
    score: calculateQuestionScore(
      Math.abs(errorSemitones) * 100,
      params.responseTimeMs,
      params.question.distanceSemitones,
    ),
    scoreFormulaVersion: "v1",
    replayBaseCount: params.replayBaseCount,
    replayTargetCount: params.replayTargetCount,
    presentedAt: params.presentedAt,
    answeredAt: params.answeredAt,
  };
}

export function buildKeyboardGuestSummary(
  results: KeyboardGuestResult[],
): KeyboardGuestSummary {
  const questionCount = results.length;
  const correctCount = results.filter((result) => result.isCorrect).length;
  const totalError = sumBy(results, (result) =>
    Math.abs(result.errorSemitones),
  );
  const totalResponseTime = sumBy(results, (result) => result.responseTimeMs);
  const totalScore = sumBy(results, (result) => result.score);

  return {
    questionCount,
    correctCount,
    accuracyRate: averageOrZero(correctCount, questionCount),
    avgErrorAbs: averageOrZero(totalError, questionCount),
    avgResponseTimeMs: averageOrZero(totalResponseTime, questionCount),
    sessionScore: roundTo3(totalScore),
  };
}

export function getNoteFrequency(noteClass: NoteClass): number {
  const offsetFromA =
    NOTE_CLASSES.indexOf(noteClass) - NOTE_CLASSES.indexOf("A");

  return 440 * 2 ** (offsetFromA / 12);
}

export function buildKeyboardGuestSaveInput(params: {
  config: KeyboardTrainingConfig;
  startedAt: string;
  endedAt: string;
  finishReason: SessionFinishReason;
  results: KeyboardGuestResult[];
}): SaveTrainingSessionInput {
  const saveResults = params.results.map(toSaveQuestionResultInput);
  const plannedQuestionCount =
    params.config.endCondition.type === "question_count"
      ? params.config.endCondition.questionCount
      : undefined;

  return {
    config: params.config,
    finishReason: params.finishReason,
    endCondition: params.config.endCondition,
    startedAt: params.startedAt,
    endedAt: params.endedAt,
    summary: buildSessionSummaryFromResults(saveResults, {
      plannedQuestionCount,
    }),
    results: saveResults,
  };
}

function getKeyboardPlayableIntervals(
  config: KeyboardTrainingConfig,
): number[] {
  const intervals: number[] = [];

  for (
    let semitones = config.intervalRange.minSemitones;
    semitones <= config.intervalRange.maxSemitones;
    semitones += 1
  ) {
    if (!config.includeUnison && semitones === 0) {
      continue;
    }

    if (!config.includeOctave && semitones === 12) {
      continue;
    }

    intervals.push(semitones);
  }

  return intervals;
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

function shiftNote(baseNote: NoteClass, distanceSemitones: number): NoteClass {
  const startIndex = NOTE_CLASSES.indexOf(baseNote);
  const shiftedIndex =
    (startIndex + distanceSemitones + NOTE_CLASSES.length * 2) %
    NOTE_CLASSES.length;

  return NOTE_CLASSES[shiftedIndex];
}

function getDirectedDistanceSemitones(
  baseNote: NoteClass,
  answeredNote: NoteClass,
  direction: QuestionDirection,
): number {
  const baseIndex = NOTE_CLASSES.indexOf(baseNote);
  const answeredIndex = NOTE_CLASSES.indexOf(answeredNote);

  if (direction === "up") {
    return (
      (answeredIndex - baseIndex + NOTE_CLASSES.length) % NOTE_CLASSES.length
    );
  }

  return (
    (baseIndex - answeredIndex + NOTE_CLASSES.length) % NOTE_CLASSES.length
  );
}

function toSaveQuestionResultInput(
  result: KeyboardGuestResult,
): SaveQuestionResultInput {
  const directionFactor = result.question.direction === "up" ? 1 : -1;
  const baseMidi = getBaseMidi(result.question.baseNote);
  const targetMidi =
    baseMidi + result.question.distanceSemitones * directionFactor;
  const answerMidi =
    baseMidi + result.answeredDistanceSemitones * directionFactor;

  return {
    questionIndex: result.question.questionIndex,
    presentedAt: result.presentedAt,
    answeredAt: result.answeredAt,
    mode: "keyboard",
    baseNoteName: result.question.baseNote,
    baseMidi,
    targetNoteName: result.question.targetNote,
    targetMidi,
    answerNoteName: result.answeredNote,
    answerMidi,
    targetIntervalSemitones: result.question.distanceSemitones,
    answerIntervalSemitones: result.answeredDistanceSemitones,
    direction: result.question.direction,
    isCorrect: result.isCorrect,
    errorSemitones: result.errorSemitones,
    responseTimeMs: result.responseTimeMs,
    replayBaseCount: result.replayBaseCount,
    replayTargetCount: result.replayTargetCount,
    score: result.score,
    scoreFormulaVersion: result.scoreFormulaVersion,
  };
}

function getBaseMidi(noteClass: NoteClass): number {
  return 60 + NOTE_CLASSES.indexOf(noteClass);
}

function calculateQuestionScore(
  pitchErrorCents: number,
  responseTimeMs: number,
  distanceSemitones: number,
): number {
  return roundTo3(
    100 *
      accuracyMultiplier(pitchErrorCents) *
      speedMultiplier(responseTimeMs) *
      distanceMultiplier(distanceSemitones),
  );
}

function accuracyMultiplier(pitchErrorCents: number): number {
  if (pitchErrorCents <= 5) {
    return 1;
  }

  if (pitchErrorCents <= 10) {
    return 0.95;
  }

  if (pitchErrorCents <= 20) {
    return 0.85;
  }

  if (pitchErrorCents <= 35) {
    return 0.7;
  }

  if (pitchErrorCents <= 50) {
    return 0.5;
  }

  return 0.25;
}

function speedMultiplier(responseTimeMs: number): number {
  if (responseTimeMs <= 1000) {
    return 1;
  }

  if (responseTimeMs <= 2000) {
    return 0.95;
  }

  if (responseTimeMs <= 3500) {
    return 0.85;
  }

  if (responseTimeMs <= 5000) {
    return 0.7;
  }

  if (responseTimeMs <= 8000) {
    return 0.5;
  }

  return 0.25;
}

function distanceMultiplier(distanceSemitones: number): number {
  if (distanceSemitones <= 2) {
    return 1;
  }

  if (distanceSemitones <= 5) {
    return 1.05;
  }

  if (distanceSemitones <= 8) {
    return 1.1;
  }

  return 1.15;
}

function sumBy<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((sum, item) => sum + selector(item), 0);
}

function averageOrZero(total: number, count: number): number {
  if (count === 0) {
    return 0;
  }

  return roundTo3(total / count);
}

function roundTo3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
