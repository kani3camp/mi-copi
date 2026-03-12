import {
  createDefaultKeyboardTrainingConfig as createCanonicalDefaultKeyboardTrainingConfig,
  validateIntervalRange,
  validateQuestionCount,
  validateTimeLimitSeconds,
} from "./config.ts";
import {
  getBaseMidiForNoteClass,
  getDirectedDistanceSemitonesFromMidi,
  getFrequencyFromMidi,
  getNoteClassFromMidi,
  getTargetMidi,
  NOTE_CLASSES,
} from "./pitch.ts";
import {
  calculateQuestionScoreV1,
  isCorrectByErrorSemitones,
  roundTo3,
  SCORE_FORMULA_VERSION_V1,
} from "./scoring.ts";
import { buildSessionSummaryFromResults } from "./summary.ts";
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
} from "./types.ts";

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
  return createCanonicalDefaultKeyboardTrainingConfig();
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
  const intervalRangeError = validateIntervalRange(config.intervalRange);

  if (intervalRangeError) {
    return intervalRangeError;
  }

  if (getKeyboardPlayableIntervals(config).length === 0) {
    return "The selected interval settings do not produce any playable questions.";
  }

  if (config.endCondition.type === "question_count") {
    return validateQuestionCount(config.endCondition.questionCount);
  }

  if (config.endCondition.type === "time_limit") {
    return validateTimeLimitSeconds(config.endCondition.timeLimitSeconds);
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
  const baseMidi = getBaseMidiForNoteClass(baseNote);
  const targetMidi = getTargetMidi(baseMidi, direction, distanceSemitones);

  return {
    questionIndex,
    direction,
    baseNote,
    baseMidi,
    targetNote: getNoteClassFromMidi(targetMidi),
    targetMidi,
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
  const answeredMidi = isCorrect
    ? params.question.targetMidi
    : getAnsweredMidi(
        params.question.baseMidi,
        params.answeredNote,
        params.question.direction,
      );
  const answeredDistanceSemitones = isCorrect
    ? params.question.distanceSemitones
    : getDirectedDistanceSemitonesFromMidi(
        params.question.baseMidi,
        answeredMidi,
        params.question.direction,
      );
  const errorSemitones =
    answeredDistanceSemitones - params.question.distanceSemitones;

  return {
    question: params.question,
    answeredNote: params.answeredNote,
    answeredDistanceSemitones,
    isCorrect: isCorrectByErrorSemitones(errorSemitones),
    errorSemitones,
    responseTimeMs: params.responseTimeMs,
    score: calculateQuestionScoreV1({
      errorSemitones,
      responseTimeMs: params.responseTimeMs,
      targetIntervalSemitones: params.question.distanceSemitones,
    }),
    scoreFormulaVersion: SCORE_FORMULA_VERSION_V1,
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

export function getNoteFrequency(midi: number): number {
  return getFrequencyFromMidi(midi);
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

function toSaveQuestionResultInput(
  result: KeyboardGuestResult,
): SaveQuestionResultInput {
  const answerMidi = getAnsweredMidi(
    result.question.baseMidi,
    result.answeredNote,
    result.question.direction,
    result.question.targetMidi,
  );

  return {
    questionIndex: result.question.questionIndex,
    presentedAt: result.presentedAt,
    answeredAt: result.answeredAt,
    mode: "keyboard",
    baseNoteName: result.question.baseNote,
    baseMidi: result.question.baseMidi,
    targetNoteName: result.question.targetNote,
    targetMidi: result.question.targetMidi,
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

function getAnsweredMidi(
  baseMidi: number,
  answeredNote: NoteClass,
  direction: QuestionDirection,
  exactTargetMidi?: number,
): number {
  if (
    exactTargetMidi !== undefined &&
    getNoteClassFromMidi(exactTargetMidi) === answeredNote
  ) {
    return exactTargetMidi;
  }

  const baseClassIndex =
    ((baseMidi % NOTE_CLASSES.length) + NOTE_CLASSES.length) %
    NOTE_CLASSES.length;
  const answeredIndex = NOTE_CLASSES.indexOf(answeredNote);

  if (direction === "up") {
    const upwardOffset =
      (answeredIndex - baseClassIndex + NOTE_CLASSES.length) %
      NOTE_CLASSES.length;

    return baseMidi + upwardOffset;
  }

  const downwardOffset =
    (baseClassIndex - answeredIndex + NOTE_CLASSES.length) %
    NOTE_CLASSES.length;

  return baseMidi - downwardOffset;
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
