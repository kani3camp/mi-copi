"use client";

import {
  type MutableRefObject,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  getQuestionPlaybackDurationMs,
  type PlaybackKind,
  playFeedbackEffect,
  playQuestionAudio,
} from "../../../app/train/audio-playback";
import { createTrainingResultSaveFailureResult } from "../../../lib/async-action-errors";
import type { TrainingSessionAdapter } from "../model/training-session-adapter";
import {
  createActiveQuestion,
  createSummaryAndSaveInput,
  createTrainingSessionState,
  getNextPlayRequestId,
  getQuestionCountReached,
  getQuestionDeadlineAtMs,
  isQuestionAnsweringReady,
  type TrainingSessionState,
  trainingSessionReducer,
} from "../model/training-session-core";
import type {
  Question,
  SessionFinishReason,
  TrainingConfig,
} from "../model/types";
import type { SaveTrainingSessionResult } from "../server/saveTrainingSession";

type SaveAction<TSaveInput> = (
  input: TSaveInput,
) => Promise<SaveTrainingSessionResult>;

export interface UseTrainingSessionCoreOptions<
  TConfig extends TrainingConfig,
  TUserAnswer,
  TResult extends {
    answeredAt: string;
    isCorrect: boolean;
    question: Question;
  },
  TSummary,
  TSaveInput,
> {
  adapterRef: MutableRefObject<TrainingSessionAdapter<
    TConfig,
    Question,
    TUserAnswer,
    TResult,
    TSummary,
    TSaveInput
  > | null>;
  config: TConfig;
  isAuthenticated: boolean;
  masterVolume: number;
  saveResultsAction: SaveAction<TSaveInput>;
  soundEffectsEnabled: boolean;
}

export interface StartTrainingSessionResult {
  ok: boolean;
  startedAt: string | null;
}

export function useTrainingSessionCore<
  TConfig extends TrainingConfig,
  TUserAnswer,
  TResult extends {
    answeredAt: string;
    isCorrect: boolean;
    question: Question;
  },
  TSummary,
  TSaveInput,
>({
  adapterRef,
  config,
  isAuthenticated,
  masterVolume,
  saveResultsAction,
  soundEffectsEnabled,
}: UseTrainingSessionCoreOptions<
  TConfig,
  TUserAnswer,
  TResult,
  TSummary,
  TSaveInput
>) {
  const [state, dispatch] = useReducer(
    trainingSessionReducer<TConfig, Question, TResult, TSummary, TSaveInput>,
    undefined,
    createTrainingSessionState<
      TConfig,
      Question,
      TResult,
      TSummary,
      TSaveInput
    >,
  );
  const [configError, setConfigError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [saveResult, setSaveResult] =
    useState<SaveTrainingSessionResult | null>(null);
  const [remainingTimeMs, setRemainingTimeMs] = useState<number | null>(null);
  const [isSavePending, startSaveTransition] = useTransition();
  const autoSaveAttemptedSessionRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackLockRef = useRef(false);
  const answeringUnlockTimeoutRef = useRef<ReturnType<
    typeof globalThis.setTimeout
  > | null>(null);
  const sessionStateRef =
    useRef<
      TrainingSessionState<TConfig, Question, TResult, TSummary, TSaveInput>
    >(state);

  const finalizeCurrentSession = useCallback(
    (finishReason: SessionFinishReason, endedAt: string) => {
      const currentState = sessionStateRef.current;
      const adapter = adapterRef.current;

      if (!adapter || !currentState.config || !currentState.startedAt) {
        throw new Error("Session cannot be finalized before it has started.");
      }

      return {
        endedAt,
        ...createSummaryAndSaveInput({
          buildSaveInput: adapter.buildSaveInput,
          buildSummary: adapter.buildSummary,
          config: currentState.config,
          endedAt,
          finishReason,
          results: currentState.results,
          startedAt: currentState.startedAt,
        }),
      };
    },
    [adapterRef],
  );

  useEffect(() => {
    sessionStateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (state.phase !== "preparing" || !state.activeQuestion) {
      return;
    }

    dispatch({ type: "preparing_ready" });
  }, [state.activeQuestion, state.phase]);

  useEffect(() => {
    if (!state.activeQuestion || state.phase !== "playing") {
      return;
    }

    const playRequestId = state.activeQuestion.playRequestId;

    dispatch({
      type: "playback_started",
      playRequestId,
    });

    let cancelled = false;

    const unlockAnswering = () => {
      if (cancelled) {
        return;
      }

      dispatch({
        type: "answering_unlocked",
        answeringStartedAt: new Date().toISOString(),
        playRequestId,
      });
    };

    answeringUnlockTimeoutRef.current = globalThis.setTimeout(
      unlockAnswering,
      getQuestionPlaybackDurationMs(state.activeQuestion.playbackKind),
    );

    void playQuestionAudio(
      state.activeQuestion.question,
      state.activeQuestion.playbackKind as PlaybackKind,
      audioContextRef,
      masterVolume,
      playbackLockRef,
    )
      .catch(() => {
        if (!cancelled) {
          setAudioError(
            "音声の再生に失敗しました。回答と続行はそのまま行えます。",
          );
        }
      })
      .finally(unlockAnswering);

    return () => {
      cancelled = true;
      dispatch({
        type: "playback_cancelled",
        playRequestId,
      });
      if (answeringUnlockTimeoutRef.current !== null) {
        globalThis.clearTimeout(answeringUnlockTimeoutRef.current);
        answeringUnlockTimeoutRef.current = null;
      }
    };
  }, [masterVolume, state.activeQuestion, state.phase]);

  useEffect(() => {
    if (
      !state.startedAt ||
      state.deadlineAtMs === null ||
      state.phase === "config" ||
      state.phase === "preparing" ||
      state.phase === "result"
    ) {
      setRemainingTimeMs(null);
      return;
    }

    const updateRemaining = () => {
      const currentState = sessionStateRef.current;

      if (currentState.deadlineAtMs === null) {
        return;
      }

      const nextRemaining = Math.max(0, currentState.deadlineAtMs - Date.now());
      setRemainingTimeMs(nextRemaining);

      if (nextRemaining !== 0 || currentState.phase === "result") {
        return;
      }

      const finalized = finalizeCurrentSession(
        "time_up",
        new Date().toISOString(),
      );

      dispatch({
        type: "session_finished",
        endedAt: finalized.endedAt,
        finishReason: "time_up",
        pendingSaveInput: finalized.pendingSaveInput,
        summary: finalized.summary,
      });
    };

    updateRemaining();
    const intervalId = window.setInterval(updateRemaining, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    finalizeCurrentSession,
    state.deadlineAtMs,
    state.phase,
    state.startedAt,
  ]);

  useEffect(() => {
    if (
      !isAuthenticated ||
      !state.pendingSaveInput ||
      isSavePending ||
      saveResult?.ok ||
      autoSaveAttemptedSessionRef.current === state.startedAt
    ) {
      return;
    }

    autoSaveAttemptedSessionRef.current = state.startedAt;

    const pendingSaveInput = state.pendingSaveInput;

    if (!pendingSaveInput) {
      return;
    }

    startSaveTransition(async () => {
      let result: SaveTrainingSessionResult;

      try {
        result = await saveResultsAction(pendingSaveInput);
      } catch {
        result = createTrainingResultSaveFailureResult();
      }

      setSaveResult(result);
    });
  }, [
    isAuthenticated,
    isSavePending,
    saveResult?.ok,
    saveResultsAction,
    state.pendingSaveInput,
    state.startedAt,
  ]);

  function startSession(): StartTrainingSessionResult {
    const adapter = adapterRef.current;

    if (!adapter) {
      setConfigError(
        "トレーニングの準備中です。少し待ってから開始してください。",
      );
      return { ok: false, startedAt: null };
    }

    const validationError = adapter.validateConfig(config);

    if (validationError) {
      setConfigError(validationError);
      return { ok: false, startedAt: null };
    }

    const startedAt = new Date().toISOString();
    const generatorState = adapter.createQuestionGeneratorState(config);
    const nextQuestion = adapter.takeNextQuestion(config, generatorState, 0);

    setConfigError(null);
    setAudioError(null);
    setSaveResult(null);
    autoSaveAttemptedSessionRef.current = null;

    dispatch({
      type: "session_started",
      activeQuestion: createActiveQuestion({
        playRequestId: getNextPlayRequestId(state),
        presentedAt: new Date().toISOString(),
        question: nextQuestion.question,
      }),
      config,
      deadlineAtMs: getQuestionDeadlineAtMs(config, startedAt),
      questionGeneratorState: nextQuestion.state,
      startedAt,
    });

    return { ok: true, startedAt };
  }

  function replayBase() {
    if (!state.activeQuestion) {
      return;
    }

    void playQuestionAudio(
      state.activeQuestion.question,
      "base",
      audioContextRef,
      masterVolume,
      playbackLockRef,
    )
      .then((didStartPlayback) => {
        if (didStartPlayback) {
          dispatch({ type: "replay_recorded", replayKind: "base" });
        }
      })
      .catch(() => {
        setAudioError("音声の再生に失敗しました。そのまま続行できます。");
      });
  }

  function replayTarget() {
    if (!state.activeQuestion) {
      return;
    }

    void playQuestionAudio(
      state.activeQuestion.question,
      "target",
      audioContextRef,
      masterVolume,
      playbackLockRef,
    )
      .then((didStartPlayback) => {
        if (didStartPlayback) {
          dispatch({ type: "replay_recorded", replayKind: "target" });
        }
      })
      .catch(() => {
        setAudioError("音声の再生に失敗しました。そのまま続行できます。");
      });
  }

  function answerQuestion(userAnswer: TUserAnswer) {
    const adapter = adapterRef.current;

    if (!adapter || !isQuestionAnsweringReady(state.activeQuestion)) {
      return;
    }

    const answeredAt = new Date().toISOString();
    const responseTimeMs = Math.max(
      0,
      Date.parse(answeredAt) -
        Date.parse(state.activeQuestion.answeringStartedAt),
    );
    const result = adapter.evaluateAnswer({
      answeredAt,
      presentedAt: state.activeQuestion.presentedAt,
      question: state.activeQuestion.question,
      replayBaseCount: state.activeQuestion.replayBaseCount,
      replayTargetCount: state.activeQuestion.replayTargetCount,
      responseTimeMs,
      userAnswer,
    });
    const lastAnsweredWasFinal = getQuestionCountReached({
      answeredCount: state.results.length + 1,
      config,
    });

    dispatch({
      type: "answer_committed",
      lastAnsweredWasFinal,
      result,
    });

    void playFeedbackEffect(
      audioContextRef,
      masterVolume,
      soundEffectsEnabled,
      result.isCorrect,
      playbackLockRef,
    );
  }

  function replayCorrectTarget() {
    if (!state.feedbackResult) {
      return;
    }

    void playQuestionAudio(
      state.feedbackResult.question,
      "target",
      audioContextRef,
      masterVolume,
      playbackLockRef,
    ).catch(() => {
      setAudioError("音声の再生に失敗しました。そのまま続行できます。");
    });
  }

  function continueAfterFeedback() {
    const adapter = adapterRef.current;

    if (
      !adapter ||
      !state.feedbackResult ||
      !state.config ||
      !state.startedAt
    ) {
      return;
    }

    if (state.lastAnsweredWasFinal) {
      const finalized = finalizeCurrentSession(
        "target_reached",
        state.feedbackResult.answeredAt,
      );

      dispatch({
        type: "session_finished",
        endedAt: finalized.endedAt,
        finishReason: "target_reached",
        pendingSaveInput: finalized.pendingSaveInput,
        summary: finalized.summary,
      });
      return;
    }

    if (!state.activeQuestion || !state.questionGeneratorState) {
      return;
    }

    const nextQuestion = adapter.takeNextQuestion(
      state.config,
      state.questionGeneratorState,
      state.activeQuestion.question.questionIndex + 1,
    );

    dispatch({
      type: "advanced_to_next_question",
      activeQuestion: createActiveQuestion({
        playRequestId: state.playbackGeneration.nextPlayRequestId,
        presentedAt: new Date().toISOString(),
        question: nextQuestion.question,
      }),
      questionGeneratorState: nextQuestion.state,
    });
  }

  function endSessionManually() {
    if (state.phase !== "feedback") {
      return;
    }

    const finalized = finalizeCurrentSession(
      "manual_end",
      new Date().toISOString(),
    );

    dispatch({
      type: "session_finished",
      endedAt: finalized.endedAt,
      finishReason: "manual_end",
      pendingSaveInput: finalized.pendingSaveInput,
      summary: finalized.summary,
    });
  }

  function retrySaveResults() {
    if (!state.pendingSaveInput || !isAuthenticated || saveResult?.ok) {
      return;
    }

    const pendingSaveInput = state.pendingSaveInput;

    if (!pendingSaveInput) {
      return;
    }

    startSaveTransition(async () => {
      let result: SaveTrainingSessionResult;

      try {
        result = await saveResultsAction(pendingSaveInput);
      } catch {
        result = createTrainingResultSaveFailureResult();
      }

      setSaveResult(result);
    });
  }

  function resetSession() {
    setConfigError(null);
    setAudioError(null);
    setSaveResult(null);
    autoSaveAttemptedSessionRef.current = null;
    if (answeringUnlockTimeoutRef.current !== null) {
      globalThis.clearTimeout(answeringUnlockTimeoutRef.current);
      answeringUnlockTimeoutRef.current = null;
    }
    dispatch({ type: "session_reset" });
  }

  return {
    activeQuestion: state.activeQuestion,
    answerQuestion,
    audioError,
    canSaveResult: state.pendingSaveInput !== null,
    configError,
    continueAfterFeedback,
    endSessionManually,
    feedbackResult: state.feedbackResult,
    finishReason: state.finishReason,
    isSavePending,
    lastAnsweredWasFinal: state.lastAnsweredWasFinal,
    pendingSaveInput: state.pendingSaveInput,
    phase: state.phase,
    remainingTimeMs,
    replayBase,
    replayCorrectTarget,
    replayTarget,
    resetSession,
    results: state.results,
    retrySaveResults,
    saveResult,
    startSession,
    startedAt: state.startedAt,
    summary: state.summary,
  };
}
