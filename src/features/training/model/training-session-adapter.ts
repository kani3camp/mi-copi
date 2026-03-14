import type { QuestionGeneratorState } from "./question-generator.ts";
import type { Question, SessionFinishReason, TrainingConfig } from "./types.ts";

export type TrainingSessionPlaybackKind = "question" | "base" | "target";

export interface TrainingSessionEvaluatedResultBase<
  TQuestion extends Question,
> {
  answeredAt: string;
  isCorrect: boolean;
  question: TQuestion;
}

export interface TrainingSessionEvaluationInput<
  TQuestion extends Question,
  TUserAnswer,
> {
  answeredAt: string;
  presentedAt: string;
  question: TQuestion;
  replayBaseCount: number;
  replayTargetCount: number;
  responseTimeMs: number;
  userAnswer: TUserAnswer;
}

export interface TrainingSessionBuildSaveInputParams<
  TConfig extends TrainingConfig,
  TResult,
  TSummary,
> {
  config: TConfig;
  endedAt: string;
  finishReason: SessionFinishReason;
  results: TResult[];
  startedAt: string;
  summary: TSummary;
}

export interface TrainingSessionQuestionStepResult<TQuestion extends Question> {
  question: TQuestion;
  state: QuestionGeneratorState;
}

export interface TrainingSessionAdapter<
  TConfig extends TrainingConfig,
  TQuestion extends Question,
  TUserAnswer,
  TResult extends TrainingSessionEvaluatedResultBase<TQuestion>,
  TSummary,
  TSaveInput,
> {
  buildSaveInput: (
    input: TrainingSessionBuildSaveInputParams<TConfig, TResult, TSummary>,
  ) => TSaveInput;
  buildSummary: (results: TResult[]) => TSummary;
  createQuestionGeneratorState: (config: TConfig) => QuestionGeneratorState;
  evaluateAnswer: (
    input: TrainingSessionEvaluationInput<TQuestion, TUserAnswer>,
  ) => TResult;
  getPlannedQuestionCount: (config: TConfig) => number;
  takeNextQuestion: (
    config: TConfig,
    state: QuestionGeneratorState,
    questionIndex: number,
  ) => TrainingSessionQuestionStepResult<TQuestion>;
  validateConfig: (config: TConfig) => string | null;
}

export interface TrainingSessionActiveQuestion<TQuestion extends Question> {
  answeringStartedAt: string | null;
  playbackKind: TrainingSessionPlaybackKind;
  playRequestId: number;
  presentedAt: string;
  question: TQuestion;
  replayBaseCount: number;
  replayTargetCount: number;
}

export interface TrainingSessionPlaybackGeneration {
  handledAnsweringRequestId: number | null;
  inFlightPlayRequestId: number | null;
  nextPlayRequestId: number;
}
