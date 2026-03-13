"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { useGlobalUserSettings } from "../../../features/settings/client/global-user-settings-provider";
import { shouldApplyDeferredTrainingBootstrap } from "../../../features/training/model/bootstrap";
import {
  clampIntervalMaxSemitone,
  clampIntervalMinSemitone,
  createDefaultQuestionCountEndCondition,
  createDefaultTimeLimitEndCondition,
  getQuestionCountSelectOptions,
  getTimeLimitSecondsSelectOptions,
  TRAINING_CONFIG_LIMITS,
} from "../../../features/training/model/config";
import { formatDirectionModeLabel } from "../../../features/training/model/interval-notation";
import type {
  buildKeyboardGuestSaveInput,
  KeyboardGuestResult,
  KeyboardGuestSummary,
} from "../../../features/training/model/keyboard-guest";
import type { QuestionGeneratorState } from "../../../features/training/model/question-generator";
import {
  canRetryTrainingResultSave,
  hasTrainingResultSavePayload,
  shouldAutoSaveTrainingResult,
} from "../../../features/training/model/result-save";
import type {
  KeyboardTrainingConfig,
  NoteClass,
  Question,
  SessionFinishReason,
} from "../../../features/training/model/types";
import type { KeyboardTrainingPageBootstrap } from "../../../features/training/server/getTrainingPageBootstrap";
import type { SaveTrainingSessionResult } from "../../../features/training/server/saveTrainingSession";
import { ButtonLink } from "../../ui/navigation-link";
import {
  AppShell,
  Button,
  Field,
  FieldGrid,
  KeyValueCard,
  Notice,
  SectionHeader,
  Surface,
} from "../../ui/primitives";
import type { PlaybackKind } from "../audio-playback";
import { formatRemainingTimeLabel } from "../train-ui-shared";
import { TrainingProgressHeader } from "../training-page-shell";
import { formatKeyboardNoteLabel } from "./keyboard-note-label";

const KeyboardQuestionPanel = dynamic(async () => {
  const mod = await import("./keyboard-train-panels");

  return mod.KeyboardQuestionPanel;
});

const KeyboardFeedbackPanel = dynamic(async () => {
  const mod = await import("./keyboard-train-panels");

  return mod.KeyboardFeedbackPanel;
});

const KeyboardResultPanel = dynamic(async () => {
  const mod = await import("./keyboard-train-panels");

  return mod.KeyboardResultPanel;
});

type KeyboardTrainPhase =
  | "config"
  | "preparing"
  | "playing"
  | "answering"
  | "feedback"
  | "result";

interface ActiveQuestionState {
  question: Question;
  presentedAt: string;
  answeringStartedAt: string | null;
  replayBaseCount: number;
  replayTargetCount: number;
  playbackKind: PlaybackKind;
  playNonce: number;
}

const NOTE_CLASS_OPTIONS: NoteClass[] = [
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

type KeyboardTrainRuntimeModule = typeof import("./keyboard-train-runtime");

interface KeyboardTrainClientProps {
  isAuthenticated: boolean;
  initialConfig: KeyboardTrainingConfig;
  hasStoredConfig: boolean;
  loadBootstrapAction?: () => Promise<KeyboardTrainingPageBootstrap>;
  persistLastUsedConfigAction: (
    config: KeyboardTrainingConfig,
  ) => Promise<void>;
  saveResultsAction: (
    input: Parameters<typeof buildKeyboardGuestSaveInput>[0],
  ) => Promise<SaveTrainingSessionResult>;
}

export function KeyboardTrainClient({
  isAuthenticated,
  initialConfig,
  hasStoredConfig,
  loadBootstrapAction,
  persistLastUsedConfigAction,
  saveResultsAction,
}: KeyboardTrainClientProps) {
  const { settings, hydrateFromServer } = useGlobalUserSettings();
  const [isAuthenticatedState, setIsAuthenticatedState] =
    useState(isAuthenticated);
  const [hasStoredConfigState, setHasStoredConfigState] =
    useState(hasStoredConfig);
  const [config, setConfig] = useState<KeyboardTrainingConfig>(initialConfig);
  const [phase, setPhase] = useState<KeyboardTrainPhase>("config");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<string | null>(null);
  const [finishReason, setFinishReason] = useState<SessionFinishReason | null>(
    null,
  );
  const [activeQuestion, setActiveQuestion] =
    useState<ActiveQuestionState | null>(null);
  const [results, setResults] = useState<KeyboardGuestResult[]>([]);
  const [summary, setSummary] = useState<KeyboardGuestSummary | null>(null);
  const [feedbackResult, setFeedbackResult] =
    useState<KeyboardGuestResult | null>(null);
  const [lastAnsweredWasFinal, setLastAnsweredWasFinal] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [saveResult, setSaveResult] =
    useState<SaveTrainingSessionResult | null>(null);
  const [bootstrapNotice, setBootstrapNotice] = useState<string | null>(null);
  const [isSavePending, startSaveTransition] = useTransition();
  const [isBootstrapPending, startBootstrapTransition] = useTransition();
  const persistedConfigSessionRef = useRef<string | null>(null);
  const autoSaveAttemptedSessionRef = useRef<string | null>(null);
  const playbackIdRef = useRef(0);
  const playedNonceRef = useRef<number | null>(null);
  const playbackLockRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const questionGeneratorStateRef = useRef<QuestionGeneratorState | null>(null);
  const sessionDeadlineAtRef = useRef<number | null>(null);
  const timeoutHandledRef = useRef(false);
  const hasEditedConfigRef = useRef(false);
  const bootstrapRequestedRef = useRef(false);
  const phaseRef = useRef<KeyboardTrainPhase>("config");
  const startedAtRef = useRef<string | null>(null);
  const resultsRef = useRef<KeyboardGuestResult[]>([]);
  const runtimeRef = useRef<KeyboardTrainRuntimeModule | null>(null);
  const runtimePromiseRef = useRef<Promise<KeyboardTrainRuntimeModule> | null>(
    null,
  );
  const plannedQuestionCount =
    config.endCondition.type === "question_count"
      ? config.endCondition.questionCount
      : 0;
  const questionCountOptions =
    getQuestionCountSelectOptions(plannedQuestionCount);
  const timeLimitOptions =
    config.endCondition.type === "time_limit"
      ? getTimeLimitSecondsSelectOptions(config.endCondition.timeLimitSeconds)
      : getTimeLimitSecondsSelectOptions(
          createDefaultTimeLimitEndCondition().timeLimitSeconds,
        );
  const [remainingTimeMs, setRemainingTimeMs] = useState<number | null>(null);
  const answerChoices = NOTE_CLASS_OPTIONS;
  const cannotSaveBecauseNoAnswers = phase === "result" && results.length === 0;
  const saveContext = {
    isAuthenticated: isAuthenticatedState,
    startedAt,
    endedAt,
    finishReason,
    resultsCount: results.length,
  };
  const canSaveResult = hasTrainingResultSavePayload(saveContext);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    startedAtRef.current = startedAt;
  }, [startedAt]);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  const loadKeyboardRuntime = useCallback(() => {
    if (runtimeRef.current) {
      return Promise.resolve(runtimeRef.current);
    }

    if (!runtimePromiseRef.current) {
      runtimePromiseRef.current = import("./keyboard-train-runtime").then(
        (runtime) => {
          runtimeRef.current = runtime;

          return runtime;
        },
      );
    }

    return runtimePromiseRef.current;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const warmUp = () => {
      void loadKeyboardRuntime();
      void import("./keyboard-train-panels");
    };

    if ("requestIdleCallback" in window) {
      const idleCallbackId = window.requestIdleCallback(warmUp, {
        timeout: 1500,
      });

      return () => {
        window.cancelIdleCallback(idleCallbackId);
      };
    }

    const timeoutId = globalThis.setTimeout(warmUp, 0);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [loadKeyboardRuntime]);

  useEffect(() => {
    if (!loadBootstrapAction || bootstrapRequestedRef.current) {
      return;
    }

    bootstrapRequestedRef.current = true;
    let cancelled = false;

    startBootstrapTransition(async () => {
      const bootstrap = await loadBootstrapAction();

      if (cancelled) {
        return;
      }

      setIsAuthenticatedState(bootstrap.isAuthenticated);
      setHasStoredConfigState(bootstrap.hasStoredConfig);
      hydrateFromServer({
        isAuthenticated: bootstrap.isAuthenticated,
        settings: bootstrap.settings,
        updatedAt: bootstrap.settingsUpdatedAt,
      });

      if (
        bootstrap.config &&
        shouldApplyDeferredTrainingBootstrap({
          phase: phaseRef.current,
          startedAt: startedAtRef.current,
          hasEditedConfig: hasEditedConfigRef.current,
        })
      ) {
        setConfig(bootstrap.config);
        setBootstrapNotice("前回設定を読み込み済みです。");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [hydrateFromServer, loadBootstrapAction]);

  function updateConfig(
    updater: (current: KeyboardTrainingConfig) => KeyboardTrainingConfig,
  ) {
    hasEditedConfigRef.current = true;
    setBootstrapNotice(null);
    setConfig((current) => updater(current));
  }

  useEffect(() => {
    if (phase !== "playing" || !activeQuestion) {
      return;
    }

    if (playedNonceRef.current === activeQuestion.playNonce) {
      return;
    }

    playedNonceRef.current = activeQuestion.playNonce;
    let cancelled = false;

    void loadKeyboardRuntime()
      .then((runtime) =>
        runtime.playQuestionAudio(
          activeQuestion.question,
          activeQuestion.playbackKind,
          audioContextRef,
          settings.masterVolume,
          playbackLockRef,
        ),
      )
      .catch(() => {
        if (!cancelled) {
          setAudioError(
            "音声の再生に失敗しました。回答と続行はそのまま行えます。",
          );
        }
      })
      .finally(() => {
        if (cancelled) {
          return;
        }

        setActiveQuestion((current) =>
          current
            ? {
                ...current,
                answeringStartedAt:
                  current.answeringStartedAt ?? new Date().toISOString(),
              }
            : current,
        );
        setPhase("answering");
      });

    return () => {
      cancelled = true;
    };
  }, [activeQuestion, loadKeyboardRuntime, phase, settings.masterVolume]);

  useEffect(() => {
    if (
      !startedAt ||
      phase === "config" ||
      phase === "preparing" ||
      phase === "result" ||
      config.endCondition.type !== "time_limit" ||
      sessionDeadlineAtRef.current === null
    ) {
      setRemainingTimeMs(null);
      return;
    }

    const updateRemaining = () => {
      if (sessionDeadlineAtRef.current === null) {
        return;
      }

      const nextRemaining = Math.max(
        0,
        sessionDeadlineAtRef.current - Date.now(),
      );
      setRemainingTimeMs(nextRemaining);

      if (nextRemaining === 0 && !timeoutHandledRef.current) {
        const runtime = runtimeRef.current;

        if (!runtime) {
          return;
        }

        timeoutHandledRef.current = true;
        const timedOutSession = runtime.resolveTimeLimitExpiry(
          new Date().toISOString(),
        );
        setActiveQuestion(null);
        setFeedbackResult(null);
        setSummary(runtime.buildKeyboardGuestSummary(resultsRef.current));
        setLastAnsweredWasFinal(timedOutSession.lastAnsweredWasFinal);
        setFinishReason(timedOutSession.finishReason);
        setEndedAt(timedOutSession.endedAt);
        setPhase(timedOutSession.phase);
      }
    };

    updateRemaining();
    const intervalId = window.setInterval(updateRemaining, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [config.endCondition, phase, startedAt]);

  useEffect(() => {
    if (phase !== "preparing" || !activeQuestion) {
      return;
    }

    setPhase("playing");
  }, [activeQuestion, phase]);

  useEffect(() => {
    const autoSaveContext = {
      isAuthenticated: isAuthenticatedState,
      startedAt,
      endedAt,
      finishReason,
      resultsCount: results.length,
      attemptedSessionId: autoSaveAttemptedSessionRef.current,
      isSavePending,
      hasSavedResult: Boolean(saveResult?.ok),
    };

    if (!shouldAutoSaveTrainingResult(autoSaveContext)) {
      return;
    }

    autoSaveAttemptedSessionRef.current = autoSaveContext.startedAt;

    startSaveTransition(async () => {
      const result = await saveResultsAction({
        config,
        startedAt: autoSaveContext.startedAt,
        endedAt: autoSaveContext.endedAt,
        finishReason: autoSaveContext.finishReason,
        results,
      });
      setSaveResult(result);
    });
  }, [
    config,
    endedAt,
    finishReason,
    isAuthenticatedState,
    isSavePending,
    results,
    saveResult?.ok,
    saveResultsAction,
    startedAt,
  ]);

  async function handleStart() {
    const runtime = await loadKeyboardRuntime();
    const validationError = runtime.validateKeyboardTrainingConfig(config);

    if (validationError) {
      setConfigError(validationError);
      return;
    }

    const nextStartedAt = new Date().toISOString();

    setConfigError(null);
    setAudioError(null);
    setSaveResult(null);
    persistedConfigSessionRef.current = null;
    autoSaveAttemptedSessionRef.current = null;
    timeoutHandledRef.current = false;
    setStartedAt(nextStartedAt);
    setEndedAt(null);
    setFinishReason(null);
    setResults([]);
    setSummary(null);
    setFeedbackResult(null);
    setLastAnsweredWasFinal(false);
    sessionDeadlineAtRef.current =
      config.endCondition.type === "time_limit"
        ? Date.parse(nextStartedAt) +
          config.endCondition.timeLimitSeconds * 1000
        : null;
    setRemainingTimeMs(
      config.endCondition.type === "time_limit"
        ? config.endCondition.timeLimitSeconds * 1000
        : null,
    );
    questionGeneratorStateRef.current =
      runtime.createQuestionGeneratorState(config);
    setActiveQuestion(
      createActiveQuestion(
        runtime,
        config,
        0,
        playbackIdRef,
        questionGeneratorStateRef,
      ),
    );
    if (isAuthenticatedState) {
      persistedConfigSessionRef.current = nextStartedAt;
      void persistLastUsedConfigAction(config);
    }
    setPhase("preparing");
  }

  const handleReplayBase = useCallback(() => {
    if (!activeQuestion) {
      return;
    }

    const runtime = runtimeRef.current;

    if (!runtime) {
      return;
    }

    void runtime
      .playQuestionAudio(
        activeQuestion.question,
        "base",
        audioContextRef,
        settings.masterVolume,
        playbackLockRef,
      )
      .then((didStartPlayback) => {
        if (!didStartPlayback) {
          return;
        }

        setActiveQuestion((current) =>
          current
            ? {
                ...current,
                replayBaseCount: runtime.getNextReplayCount(
                  current.replayBaseCount,
                  didStartPlayback,
                ),
              }
            : current,
        );
      })
      .catch(() => {
        setAudioError("音声の再生に失敗しました。そのまま続行できます。");
      });
  }, [activeQuestion, settings.masterVolume]);

  const handleReplayTarget = useCallback(() => {
    if (!activeQuestion) {
      return;
    }

    const runtime = runtimeRef.current;

    if (!runtime) {
      return;
    }

    void runtime
      .playQuestionAudio(
        activeQuestion.question,
        "target",
        audioContextRef,
        settings.masterVolume,
        playbackLockRef,
      )
      .then((didStartPlayback) => {
        if (!didStartPlayback) {
          return;
        }

        setActiveQuestion((current) =>
          current
            ? {
                ...current,
                replayTargetCount: runtime.getNextReplayCount(
                  current.replayTargetCount,
                  didStartPlayback,
                ),
              }
            : current,
        );
      })
      .catch(() => {
        setAudioError("音声の再生に失敗しました。そのまま続行できます。");
      });
  }, [activeQuestion, settings.masterVolume]);

  const handleAnswer = useCallback(
    (answeredNote: NoteClass) => {
      if (!activeQuestion?.answeringStartedAt) {
        return;
      }

      const runtime = runtimeRef.current;

      if (!runtime) {
        return;
      }

      const answeredAt = new Date().toISOString();
      const responseTimeMs = Math.max(
        0,
        Date.parse(answeredAt) - Date.parse(activeQuestion.answeringStartedAt),
      );
      const result = runtime.evaluateKeyboardAnswer({
        question: activeQuestion.question,
        answeredNote,
        responseTimeMs,
        replayBaseCount: activeQuestion.replayBaseCount,
        replayTargetCount: activeQuestion.replayTargetCount,
        presentedAt: activeQuestion.presentedAt,
        answeredAt,
      });

      const updatedCount = results.length + 1;

      setResults((current) => [...current, result]);
      setFeedbackResult(result);
      setLastAnsweredWasFinal(
        config.endCondition.type === "question_count" &&
          updatedCount >= config.endCondition.questionCount,
      );
      setPhase("feedback");
      void runtime.playFeedbackEffect(
        audioContextRef,
        settings.masterVolume,
        settings.soundEffectsEnabled,
        result.isCorrect,
        playbackLockRef,
      );
    },
    [
      activeQuestion,
      config.endCondition,
      results.length,
      settings.masterVolume,
      settings.soundEffectsEnabled,
    ],
  );

  const handleReplayCorrectTarget = useCallback(() => {
    if (!feedbackResult) {
      return;
    }

    const runtime = runtimeRef.current;

    if (!runtime) {
      return;
    }

    void runtime
      .playQuestionAudio(
        feedbackResult.question,
        "target",
        audioContextRef,
        settings.masterVolume,
        playbackLockRef,
      )
      .catch(() => {
        setAudioError("音声の再生に失敗しました。そのまま続行できます。");
      });
  }, [feedbackResult, settings.masterVolume]);

  const handleContinue = useCallback(() => {
    if (!feedbackResult || !activeQuestion) {
      return;
    }

    const runtime = runtimeRef.current;

    if (!runtime) {
      return;
    }

    const nextProgress = runtime.resolvePostFeedbackProgress({
      endCondition: config.endCondition,
      currentQuestionIndex: activeQuestion.question.questionIndex,
      lastAnsweredWasFinal,
      answeredAt: feedbackResult.answeredAt,
    });

    if (nextProgress.phase === "result") {
      setActiveQuestion(null);
      setSummary(runtime.buildKeyboardGuestSummary(resultsRef.current));
      setFinishReason(nextProgress.finishReason);
      setEndedAt(nextProgress.endedAt);
      setPhase(nextProgress.phase);
      return;
    }

    setFeedbackResult(null);
    setActiveQuestion(
      createActiveQuestion(
        runtime,
        config,
        nextProgress.nextQuestionIndex,
        playbackIdRef,
        questionGeneratorStateRef,
      ),
    );
    setPhase(nextProgress.phase);
  }, [activeQuestion, config, feedbackResult, lastAnsweredWasFinal]);

  const handleReset = useCallback(() => {
    setPhase("config");
    setStartedAt(null);
    setEndedAt(null);
    setFinishReason(null);
    setActiveQuestion(null);
    setResults([]);
    setSummary(null);
    setFeedbackResult(null);
    setLastAnsweredWasFinal(false);
    setConfigError(null);
    setAudioError(null);
    setSaveResult(null);
    persistedConfigSessionRef.current = null;
    autoSaveAttemptedSessionRef.current = null;
    questionGeneratorStateRef.current = null;
    sessionDeadlineAtRef.current = null;
    timeoutHandledRef.current = false;
    setRemainingTimeMs(null);
  }, []);

  const handleSaveResults = useCallback(() => {
    const retrySaveContext = {
      isAuthenticated: isAuthenticatedState,
      startedAt,
      endedAt,
      finishReason,
      resultsCount: results.length,
      hasSavedResult: Boolean(saveResult?.ok),
    };

    if (!canRetryTrainingResultSave(retrySaveContext)) {
      return;
    }

    startSaveTransition(async () => {
      const result = await saveResultsAction({
        config,
        startedAt: retrySaveContext.startedAt,
        endedAt: retrySaveContext.endedAt,
        finishReason: retrySaveContext.finishReason,
        results,
      });
      setSaveResult(result);
    });
  }, [
    config,
    endedAt,
    finishReason,
    isAuthenticatedState,
    results,
    saveResult?.ok,
    saveResultsAction,
    startedAt,
  ]);

  return (
    <AppShell narrow className="ui-train-shell">
      <TrainingProgressHeader
        modeLabel="鍵盤モード"
        modeTone="teal"
        questionLabel={getKeyboardHeaderLabel(
          phase,
          activeQuestion,
          plannedQuestionCount,
        )}
        meta={getKeyboardHeaderMeta({
          phase,
          remainingTimeMs,
          isAuthenticated: isAuthenticatedState,
          saveResult,
        })}
        actions={
          <>
            <ButtonLink
              href="/"
              variant="ghost"
              pendingLabel="ホームを開いています..."
            >
              ホームへ戻る
            </ButtonLink>
            <ButtonLink
              href="/train/distance"
              variant="ghost"
              pendingLabel="距離モードを開いています..."
            >
              距離モードへ
            </ButtonLink>
          </>
        }
        notice={
          audioError
            ? audioError
            : isAuthenticatedState
              ? "結果画面では自動保存されます。"
              : "ゲストでは保存されません。"
        }
      />

      {phase === "config" ? (
        <Surface tone="accent">
          <SectionHeader
            title="出題設定"
            description="終了条件、出題レンジ、基準音条件を整えてから始めます。"
          />
          <div className="ui-grid-cards">
            <div className="ui-panel-card ui-stack-md">
              <strong>セッション終了</strong>
              <Field label="終了条件">
                <select
                  className="ui-select"
                  value={config.endCondition.type}
                  onChange={(event) =>
                    updateConfig((current) => ({
                      ...current,
                      endCondition:
                        event.target.value === "time_limit"
                          ? createDefaultTimeLimitEndCondition()
                          : createDefaultQuestionCountEndCondition(),
                    }))
                  }
                >
                  <option value="question_count">問題数</option>
                  <option value="time_limit">制限時間</option>
                </select>
              </Field>

              {config.endCondition.type === "question_count" ? (
                <Field label="問題数">
                  <select
                    className="ui-select"
                    value={plannedQuestionCount}
                    onChange={(event) =>
                      updateConfig((current) => ({
                        ...current,
                        endCondition: {
                          type: "question_count",
                          questionCount: Number(event.target.value),
                        },
                      }))
                    }
                  >
                    {questionCountOptions.map((option) => (
                      <option key={option} value={option}>
                        {option} 問
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <Field label="制限時間（秒）">
                  <select
                    className="ui-select"
                    value={config.endCondition.timeLimitSeconds}
                    onChange={(event) =>
                      updateConfig((current) => ({
                        ...current,
                        endCondition: {
                          type: "time_limit",
                          timeLimitSeconds: Number(event.target.value),
                        },
                      }))
                    }
                  >
                    {timeLimitOptions.map((option) => (
                      <option key={option} value={option}>
                        {option} 秒
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>

            <div className="ui-panel-card ui-stack-md">
              <strong>問題レンジ</strong>
              <FieldGrid>
                <Field label="最小半音数">
                  <input
                    className="ui-input"
                    type="number"
                    min={TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.min}
                    max={TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.max}
                    value={config.intervalRange.minSemitone}
                    onChange={(event) =>
                      updateConfig((current) => {
                        const minSemitone = clampIntervalMinSemitone(
                          event.target.value,
                        );

                        return {
                          ...current,
                          intervalRange: {
                            minSemitone,
                            maxSemitone: clampIntervalMaxSemitone(
                              current.intervalRange.maxSemitone,
                              minSemitone,
                            ),
                          },
                        };
                      })
                    }
                  />
                </Field>
                <Field label="最大半音数">
                  <input
                    className="ui-input"
                    type="number"
                    min={Math.max(
                      TRAINING_CONFIG_LIMITS.intervalRange.maxSemitone.min,
                      config.intervalRange.minSemitone,
                    )}
                    max={TRAINING_CONFIG_LIMITS.intervalRange.maxSemitone.max}
                    value={config.intervalRange.maxSemitone}
                    onChange={(event) =>
                      updateConfig((current) => ({
                        ...current,
                        intervalRange: {
                          ...current.intervalRange,
                          maxSemitone: clampIntervalMaxSemitone(
                            event.target.value,
                            current.intervalRange.minSemitone,
                          ),
                        },
                      }))
                    }
                  />
                </Field>
              </FieldGrid>

              <Field label="出題方向">
                <select
                  className="ui-select"
                  value={config.directionMode}
                  onChange={(event) =>
                    updateConfig((current) => ({
                      ...current,
                      directionMode: event.target
                        .value as KeyboardTrainingConfig["directionMode"],
                    }))
                  }
                >
                  <option value="mixed">
                    {formatDirectionModeLabel("mixed")}
                  </option>
                  <option value="up_only">
                    {formatDirectionModeLabel("up_only")}
                  </option>
                </select>
              </Field>

              <Field label="基準音モード">
                <select
                  className="ui-select"
                  value={config.baseNoteMode}
                  onChange={(event) =>
                    updateConfig((current) => ({
                      ...current,
                      baseNoteMode: event.target
                        .value as KeyboardTrainingConfig["baseNoteMode"],
                      fixedBaseNote:
                        event.target.value === "fixed"
                          ? (current.fixedBaseNote ?? "C")
                          : null,
                    }))
                  }
                >
                  <option value="random">ランダム</option>
                  <option value="fixed">固定</option>
                </select>
              </Field>

              {config.baseNoteMode === "fixed" ? (
                <Field label="固定する基準音">
                  <select
                    className="ui-select"
                    value={config.fixedBaseNote ?? "C"}
                    onChange={(event) =>
                      updateConfig((current) => ({
                        ...current,
                        fixedBaseNote: event.target.value as NoteClass,
                      }))
                    }
                  >
                    {NOTE_CLASS_OPTIONS.map((note) => (
                      <option key={note} value={note}>
                        {note}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}
            </div>

            <div className="ui-panel-card ui-stack-md">
              <strong>回答スタイル</strong>
              <label className="ui-checkbox-card">
                <input
                  type="checkbox"
                  checked={config.includeUnison}
                  onChange={(event) =>
                    updateConfig((current) => ({
                      ...current,
                      includeUnison: event.target.checked,
                    }))
                  }
                />
                <span>同音を含める</span>
              </label>

              <label className="ui-checkbox-card">
                <input
                  type="checkbox"
                  checked={config.includeOctave}
                  onChange={(event) =>
                    updateConfig((current) => ({
                      ...current,
                      includeOctave: event.target.checked,
                    }))
                  }
                />
                <span>オクターブを含める</span>
              </label>

              <KeyValueCard
                label="回答候補"
                value={
                  settings.keyboardNoteLabelsVisible
                    ? answerChoices
                        .map((choice) => formatKeyboardNoteLabel(choice))
                        .join(", ")
                    : "鍵盤上の音名ラベルは非表示です。"
                }
                detail={
                  settings.keyboardNoteLabelsVisible
                    ? "黒鍵はシャープ / フラット表記で表示します。"
                    : "ラベル表示は設定画面で切り替えられます。"
                }
              />
            </div>
          </div>

          {isBootstrapPending ? (
            <Notice>保存済み設定を確認しています...</Notice>
          ) : null}
          {bootstrapNotice ? <Notice>{bootstrapNotice}</Notice> : null}
          {isAuthenticatedState && hasStoredConfigState && !bootstrapNotice ? (
            <Notice>保存済み設定があります。</Notice>
          ) : null}

          {configError ? <Notice tone="error">{configError}</Notice> : null}

          <div className="ui-sticky-actions">
            <div className="ui-stack-sm">
              <strong>準備できたら開始</strong>
              <span className="ui-muted">
                開始タップを最初の audio unlock として使います。
              </span>
            </div>
            <Button type="button" onClick={handleStart} variant="primary" block>
              開始
            </Button>
          </div>
        </Surface>
      ) : null}

      {phase === "preparing" && activeQuestion ? (
        <Surface tone="accent">
          <SectionHeader
            title="準備中"
            description="次の問題を準備して、基準音と問題音の再生に入ります。"
          />
          <Notice>
            問題 {activeQuestion.question.questionIndex + 1} を準備しています...
          </Notice>
        </Surface>
      ) : null}

      {(phase === "playing" || phase === "answering") && activeQuestion ? (
        <KeyboardQuestionPanel
          phase={phase}
          questionIndex={activeQuestion.question.questionIndex}
          direction={activeQuestion.question.direction}
          replayBaseCount={activeQuestion.replayBaseCount}
          replayTargetCount={activeQuestion.replayTargetCount}
          playbackKind={activeQuestion.playbackKind}
          answerChoices={answerChoices}
          referenceNote={activeQuestion.question.baseNote}
          showLabels={settings.keyboardNoteLabelsVisible}
          onReplayBase={handleReplayBase}
          onReplayTarget={handleReplayTarget}
          onAnswer={handleAnswer}
        />
      ) : null}

      {phase === "feedback" && feedbackResult ? (
        <KeyboardFeedbackPanel
          feedbackResult={feedbackResult}
          lastAnsweredWasFinal={lastAnsweredWasFinal}
          showLabels={settings.keyboardNoteLabelsVisible}
          onReplayCorrectTarget={handleReplayCorrectTarget}
          onContinue={handleContinue}
        />
      ) : null}

      {phase === "result" && summary ? (
        <KeyboardResultPanel
          summary={summary}
          finishReason={finishReason}
          isAuthenticated={isAuthenticatedState}
          canSaveResult={canSaveResult}
          cannotSaveBecauseNoAnswers={cannotSaveBecauseNoAnswers}
          isSavePending={isSavePending}
          saveResult={saveResult}
          onRetrySave={handleSaveResults}
          onReset={handleReset}
        />
      ) : null}

      {phase === "result" && !summary ? (
        <Surface>
          <SectionHeader
            title="結果を集計中"
            description="今回のセッション結果をまとめています。"
          />
        </Surface>
      ) : null}
    </AppShell>
  );
}

function createActiveQuestion(
  runtime: KeyboardTrainRuntimeModule,
  config: KeyboardTrainingConfig,
  questionIndex: number,
  playbackIdRef: React.MutableRefObject<number>,
  questionGeneratorStateRef: React.MutableRefObject<QuestionGeneratorState | null>,
): ActiveQuestionState {
  if (!questionGeneratorStateRef.current) {
    throw new Error(
      "Question generator state must be initialized before play.",
    );
  }

  const nextQuestion = runtime.takeNextQuestion(
    config,
    questionGeneratorStateRef.current,
    questionIndex,
  );
  questionGeneratorStateRef.current = nextQuestion.state;

  return {
    question: nextQuestion.question,
    presentedAt: new Date().toISOString(),
    answeringStartedAt: null,
    replayBaseCount: 0,
    replayTargetCount: 0,
    playbackKind: "question",
    playNonce: nextPlaybackNonce(playbackIdRef),
  };
}

function getKeyboardHeaderLabel(
  phase: KeyboardTrainPhase,
  activeQuestion: ActiveQuestionState | null,
  plannedQuestionCount: number,
): string | undefined {
  if (phase === "result") {
    return "結果";
  }

  if (activeQuestion && plannedQuestionCount > 0) {
    return `${activeQuestion.question.questionIndex + 1} / ${plannedQuestionCount}`;
  }

  if (activeQuestion) {
    return `${activeQuestion.question.questionIndex + 1}`;
  }

  return phase === "config" ? "設定" : formatPhaseLabel(phase);
}

function getKeyboardHeaderMeta(props: {
  phase: KeyboardTrainPhase;
  remainingTimeMs: number | null;
  isAuthenticated: boolean;
  saveResult: SaveTrainingSessionResult | null;
}): string | null {
  if (props.phase === "result") {
    if (props.saveResult?.ok) {
      return "保存済み";
    }

    return props.isAuthenticated ? "保存待機" : "ゲスト";
  }

  if (props.remainingTimeMs !== null) {
    return formatRemainingTimeLabel(props.remainingTimeMs);
  }

  return null;
}

function nextPlaybackNonce(
  playbackIdRef: React.MutableRefObject<number>,
): number {
  playbackIdRef.current += 1;

  return playbackIdRef.current;
}

function formatPhaseLabel(phase: KeyboardTrainPhase): string {
  switch (phase) {
    case "config":
      return "設定";
    case "preparing":
      return "準備中";
    case "playing":
      return "再生中";
    case "answering":
      return "回答中";
    case "feedback":
      return "フィードバック";
    case "result":
      return "結果";
  }
}
