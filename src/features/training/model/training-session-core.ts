import {
  shouldStartAnsweringTransition,
  shouldStartQuestionPlayback,
} from "./answering-transition.ts";
import type {
  TrainingSessionActiveQuestion,
  TrainingSessionEvaluatedResultBase,
  TrainingSessionPlaybackGeneration,
} from "./training-session-adapter.ts";
import type {
  Question,
  QuestionDirection,
  SessionFinishReason,
  SessionPhase,
  TrainingConfig,
} from "./types.ts";

export interface TrainingSessionState<
  TConfig extends TrainingConfig,
  TQuestion extends Question,
  TResult extends TrainingSessionEvaluatedResultBase<TQuestion>,
  TSummary,
  TSaveInput,
> {
  activeQuestion: TrainingSessionActiveQuestion<TQuestion> | null;
  config: TConfig | null;
  deadlineAtMs: number | null;
  endedAt: string | null;
  feedbackResult: TResult | null;
  finishReason: SessionFinishReason | null;
  lastAnsweredWasFinal: boolean;
  pendingSaveInput: TSaveInput | null;
  phase: SessionPhase;
  playbackGeneration: TrainingSessionPlaybackGeneration;
  questionGeneratorState:
    | import("./question-generator.ts").QuestionGeneratorState
    | null;
  results: TResult[];
  startedAt: string | null;
  summary: TSummary | null;
}

export type TrainingSessionAction<
  TConfig extends TrainingConfig,
  TQuestion extends Question,
  TResult extends TrainingSessionEvaluatedResultBase<TQuestion>,
  TSummary,
  TSaveInput,
> =
  | {
      type: "session_started";
      activeQuestion: TrainingSessionActiveQuestion<TQuestion>;
      config: TConfig;
      deadlineAtMs: number | null;
      questionGeneratorState: import("./question-generator.ts").QuestionGeneratorState;
      startedAt: string;
    }
  | { type: "preparing_ready" }
  | { type: "playback_started"; playRequestId: number }
  | { type: "playback_cancelled"; playRequestId: number }
  | {
      type: "answering_unlocked";
      answeringStartedAt: string;
      playRequestId: number;
    }
  | { type: "replay_recorded"; replayKind: "base" | "target" }
  | {
      type: "answer_committed";
      lastAnsweredWasFinal: boolean;
      result: TResult;
    }
  | {
      type: "advanced_to_next_question";
      activeQuestion: TrainingSessionActiveQuestion<TQuestion>;
      questionGeneratorState: import("./question-generator.ts").QuestionGeneratorState;
    }
  | {
      type: "session_finished";
      endedAt: string;
      finishReason: SessionFinishReason;
      pendingSaveInput: TSaveInput | null;
      summary: TSummary;
    }
  | { type: "session_reset" };

export function createTrainingSessionState<
  TConfig extends TrainingConfig,
  TQuestion extends Question,
  TResult extends TrainingSessionEvaluatedResultBase<TQuestion>,
  TSummary,
  TSaveInput,
>(): TrainingSessionState<TConfig, TQuestion, TResult, TSummary, TSaveInput> {
  return {
    activeQuestion: null,
    config: null,
    deadlineAtMs: null,
    endedAt: null,
    feedbackResult: null,
    finishReason: null,
    lastAnsweredWasFinal: false,
    pendingSaveInput: null,
    phase: "config",
    playbackGeneration: {
      handledAnsweringRequestId: null,
      inFlightPlayRequestId: null,
      nextPlayRequestId: 1,
    },
    questionGeneratorState: null,
    results: [],
    startedAt: null,
    summary: null,
  };
}

export function trainingSessionReducer<
  TConfig extends TrainingConfig,
  TQuestion extends Question,
  TResult extends TrainingSessionEvaluatedResultBase<TQuestion>,
  TSummary,
  TSaveInput,
>(
  state: TrainingSessionState<
    TConfig,
    TQuestion,
    TResult,
    TSummary,
    TSaveInput
  >,
  action: TrainingSessionAction<
    TConfig,
    TQuestion,
    TResult,
    TSummary,
    TSaveInput
  >,
): TrainingSessionState<TConfig, TQuestion, TResult, TSummary, TSaveInput> {
  switch (action.type) {
    case "session_started":
      return {
        activeQuestion: action.activeQuestion,
        config: action.config,
        deadlineAtMs: action.deadlineAtMs,
        endedAt: null,
        feedbackResult: null,
        finishReason: null,
        lastAnsweredWasFinal: false,
        pendingSaveInput: null,
        phase: "preparing",
        playbackGeneration: {
          handledAnsweringRequestId: null,
          inFlightPlayRequestId: null,
          nextPlayRequestId: action.activeQuestion.playRequestId + 1,
        },
        questionGeneratorState: action.questionGeneratorState,
        results: [],
        startedAt: action.startedAt,
        summary: null,
      };
    case "preparing_ready":
      if (state.phase !== "preparing" || !state.activeQuestion) {
        return state;
      }

      return {
        ...state,
        phase: "playing",
      };
    case "playback_started":
      if (
        !shouldStartQuestionPlayback({
          phase: state.phase,
          activePlayNonce: state.activeQuestion?.playRequestId ?? null,
          inFlightPlayNonce: state.playbackGeneration.inFlightPlayRequestId,
        }) ||
        action.playRequestId !== state.activeQuestion?.playRequestId
      ) {
        return state;
      }

      return {
        ...state,
        playbackGeneration: {
          ...state.playbackGeneration,
          handledAnsweringRequestId: null,
          inFlightPlayRequestId: action.playRequestId,
        },
      };
    case "playback_cancelled":
      if (
        state.playbackGeneration.inFlightPlayRequestId !== action.playRequestId
      ) {
        return state;
      }

      return {
        ...state,
        playbackGeneration: {
          ...state.playbackGeneration,
          inFlightPlayRequestId: null,
        },
      };
    case "answering_unlocked":
      if (
        !shouldStartAnsweringTransition({
          phase: state.phase,
          activePlayNonce: state.activeQuestion?.playRequestId ?? null,
          handledPlayNonce: state.playbackGeneration.handledAnsweringRequestId,
          targetPlayNonce: action.playRequestId,
        }) ||
        !state.activeQuestion
      ) {
        return state;
      }

      return {
        ...state,
        activeQuestion: {
          ...state.activeQuestion,
          answeringStartedAt:
            state.activeQuestion.answeringStartedAt ??
            action.answeringStartedAt,
        },
        phase: "answering",
        playbackGeneration: {
          ...state.playbackGeneration,
          handledAnsweringRequestId: action.playRequestId,
          inFlightPlayRequestId:
            state.playbackGeneration.inFlightPlayRequestId ===
            action.playRequestId
              ? null
              : state.playbackGeneration.inFlightPlayRequestId,
        },
      };
    case "replay_recorded":
      if (!state.activeQuestion) {
        return state;
      }

      return {
        ...state,
        activeQuestion: {
          ...state.activeQuestion,
          replayBaseCount:
            action.replayKind === "base"
              ? state.activeQuestion.replayBaseCount + 1
              : state.activeQuestion.replayBaseCount,
          replayTargetCount:
            action.replayKind === "target"
              ? state.activeQuestion.replayTargetCount + 1
              : state.activeQuestion.replayTargetCount,
        },
      };
    case "answer_committed":
      return {
        ...state,
        feedbackResult: action.result,
        lastAnsweredWasFinal: action.lastAnsweredWasFinal,
        phase: "feedback",
        results: [...state.results, action.result],
      };
    case "advanced_to_next_question":
      return {
        ...state,
        activeQuestion: action.activeQuestion,
        feedbackResult: null,
        lastAnsweredWasFinal: false,
        phase: "preparing",
        playbackGeneration: {
          handledAnsweringRequestId: null,
          inFlightPlayRequestId: null,
          nextPlayRequestId: action.activeQuestion.playRequestId + 1,
        },
        questionGeneratorState: action.questionGeneratorState,
      };
    case "session_finished":
      return {
        ...state,
        activeQuestion: null,
        endedAt: action.endedAt,
        feedbackResult: null,
        finishReason: action.finishReason,
        lastAnsweredWasFinal: true,
        pendingSaveInput: action.pendingSaveInput,
        phase: "result",
        playbackGeneration: {
          ...state.playbackGeneration,
          inFlightPlayRequestId: null,
        },
        summary: action.summary,
      };
    case "session_reset":
      return createTrainingSessionState();
    default:
      return state;
  }
}

export function createActiveQuestion<TQuestion extends Question>(params: {
  playRequestId: number;
  presentedAt: string;
  question: TQuestion;
}): TrainingSessionActiveQuestion<TQuestion> {
  return {
    answeringStartedAt: null,
    playbackKind: "question",
    playRequestId: params.playRequestId,
    presentedAt: params.presentedAt,
    question: params.question,
    replayBaseCount: 0,
    replayTargetCount: 0,
  };
}

export function getNextPlayRequestId<
  TConfig extends TrainingConfig,
  TQuestion extends Question,
  TResult extends TrainingSessionEvaluatedResultBase<TQuestion>,
  TSummary,
  TSaveInput,
>(
  state: TrainingSessionState<
    TConfig,
    TQuestion,
    TResult,
    TSummary,
    TSaveInput
  >,
): number {
  return state.playbackGeneration.nextPlayRequestId;
}

export function getQuestionDeadlineAtMs(
  config: TrainingConfig,
  startedAt: string,
) {
  if (config.endCondition.type !== "time_limit") {
    return null;
  }

  return Date.parse(startedAt) + config.endCondition.timeLimitSeconds * 1000;
}

export function getQuestionCountReached(params: {
  answeredCount: number;
  config: TrainingConfig;
}): boolean {
  return (
    params.config.endCondition.type === "question_count" &&
    params.answeredCount >= params.config.endCondition.questionCount
  );
}

export function shouldDiscardActiveQuestionOnFinish(
  finishReason: SessionFinishReason,
): boolean {
  return finishReason === "time_up";
}

export function createSummaryAndSaveInput<
  TConfig extends TrainingConfig,
  TResult,
  TSummary,
  TSaveInput,
>(params: {
  buildSaveInput: (input: {
    config: TConfig;
    endedAt: string;
    finishReason: SessionFinishReason;
    results: TResult[];
    startedAt: string;
    summary: TSummary;
  }) => TSaveInput;
  buildSummary: (results: TResult[]) => TSummary;
  config: TConfig;
  endedAt: string;
  finishReason: SessionFinishReason;
  results: TResult[];
  startedAt: string;
}): { pendingSaveInput: TSaveInput | null; summary: TSummary } {
  const summary = params.buildSummary(params.results);

  return {
    pendingSaveInput:
      params.results.length === 0
        ? null
        : params.buildSaveInput({
            config: params.config,
            endedAt: params.endedAt,
            finishReason: params.finishReason,
            results: params.results,
            startedAt: params.startedAt,
            summary,
          }),
    summary,
  };
}

export function isQuestionAnsweringReady<TQuestion extends Question>(
  activeQuestion: TrainingSessionActiveQuestion<TQuestion> | null,
): activeQuestion is TrainingSessionActiveQuestion<TQuestion> & {
  answeringStartedAt: string;
} {
  return Boolean(activeQuestion?.answeringStartedAt);
}

export function getQuestionIndexLabel(
  question: {
    question: { questionIndex: number };
  } | null,
) {
  return question ? question.question.questionIndex + 1 : null;
}

export function getSessionResultEndedAt(
  result: TrainingSessionEvaluatedResultBase<Question>,
) {
  return result.answeredAt;
}

export function getResultingQuestionDirection(
  question: Question,
): QuestionDirection {
  return question.direction;
}
