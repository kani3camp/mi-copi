import {
  buildDistanceGuestSummary,
  type DistanceGuestResult,
} from "../../features/training/model/distance-guest";
import {
  buildKeyboardGuestSummary,
  type KeyboardGuestResult,
} from "../../features/training/model/keyboard-guest";
import type { NoteClass, Question } from "../../features/training/model/types";

interface QuestionOverrides extends Partial<Question> {
  baseNote?: NoteClass;
  targetNote?: NoteClass;
}

type DistanceResultOverrides = Omit<
  Partial<DistanceGuestResult>,
  "question"
> & {
  question?: QuestionOverrides;
};

type KeyboardResultOverrides = Omit<
  Partial<KeyboardGuestResult>,
  "question"
> & {
  question?: QuestionOverrides;
  answeredNote?: NoteClass;
};

export function createStoryQuestion(
  overrides: QuestionOverrides = {},
): Question {
  return {
    questionIndex: 0,
    direction: "up",
    baseNote: "C",
    baseMidi: 60,
    targetNote: "G",
    targetMidi: 67,
    distanceSemitones: 7,
    notationStyle: "sharp",
    ...overrides,
  };
}

export function createDistanceResult(
  overrides: DistanceResultOverrides = {},
): DistanceGuestResult {
  const { question, ...rest } = overrides;

  return {
    question: createStoryQuestion(question),
    answeredDistanceSemitones: 7,
    isCorrect: true,
    errorSemitones: 0,
    responseTimeMs: 1420,
    score: 97.125,
    scoreFormulaVersion: "v1",
    replayBaseCount: 1,
    replayTargetCount: 0,
    presentedAt: "2026-03-12T10:00:00.000Z",
    answeredAt: "2026-03-12T10:00:01.420Z",
    ...rest,
  };
}

export function createKeyboardResult(
  overrides: KeyboardResultOverrides = {},
): KeyboardGuestResult {
  const { question, ...rest } = overrides;

  return {
    question: createStoryQuestion(question),
    answeredNote: "G",
    answeredDistanceSemitones: 7,
    isCorrect: true,
    errorSemitones: 0,
    responseTimeMs: 1180,
    score: 96.875,
    scoreFormulaVersion: "v1",
    replayBaseCount: 0,
    replayTargetCount: 1,
    presentedAt: "2026-03-12T10:00:00.000Z",
    answeredAt: "2026-03-12T10:00:01.180Z",
    ...rest,
  };
}

export function createDistanceSummary(results: DistanceGuestResult[]) {
  return buildDistanceGuestSummary(results);
}

export function createKeyboardSummary(results: KeyboardGuestResult[]) {
  return buildKeyboardGuestSummary(results);
}
