import {
  buildKeyboardGuestSaveInput,
  buildKeyboardGuestSummary,
  getKeyboardQuestionCount,
  type KeyboardGuestResult,
  type KeyboardGuestSummary,
} from "../keyboard-guest";
import type { QuestionGeneratorState } from "../question-generator.ts";
import type { TrainingSessionAdapter } from "../training-session-adapter.ts";
import type {
  KeyboardTrainingConfig,
  NoteClass,
  Question,
  SaveTrainingSessionInput,
} from "../types.ts";

export interface KeyboardTrainingSessionAdapterDependencies {
  createQuestionGeneratorState: (
    config: KeyboardTrainingConfig,
  ) => QuestionGeneratorState;
  evaluateKeyboardAnswer: (input: {
    answeredAt: string;
    answeredNote: NoteClass;
    presentedAt: string;
    question: Question;
    replayBaseCount: number;
    replayTargetCount: number;
    responseTimeMs: number;
  }) => KeyboardGuestResult;
  takeNextQuestion: (
    config: KeyboardTrainingConfig,
    state: QuestionGeneratorState,
    questionIndex: number,
  ) => { question: Question; state: QuestionGeneratorState };
  validateKeyboardTrainingConfig: (
    config: KeyboardTrainingConfig,
  ) => string | null;
}

export function createKeyboardTrainingSessionAdapter(
  deps: KeyboardTrainingSessionAdapterDependencies,
): TrainingSessionAdapter<
  KeyboardTrainingConfig,
  Question,
  NoteClass,
  KeyboardGuestResult,
  KeyboardGuestSummary,
  SaveTrainingSessionInput
> {
  return {
    buildSaveInput: ({ config, endedAt, finishReason, results, startedAt }) =>
      buildKeyboardGuestSaveInput({
        config,
        endedAt,
        finishReason,
        results,
        startedAt,
      }),
    buildSummary: buildKeyboardGuestSummary,
    createQuestionGeneratorState: deps.createQuestionGeneratorState,
    evaluateAnswer: ({
      answeredAt,
      presentedAt,
      question,
      replayBaseCount,
      replayTargetCount,
      responseTimeMs,
      userAnswer,
    }) =>
      deps.evaluateKeyboardAnswer({
        answeredAt,
        answeredNote: userAnswer,
        presentedAt,
        question,
        replayBaseCount,
        replayTargetCount,
        responseTimeMs,
      }),
    getPlannedQuestionCount: getKeyboardQuestionCount,
    takeNextQuestion: deps.takeNextQuestion,
    validateConfig: deps.validateKeyboardTrainingConfig,
  };
}
