"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useGlobalUserSettings } from "../../../features/settings/client/global-user-settings-provider";
import {
  clampIntervalMaxSemitone,
  clampIntervalMinSemitone,
  createDefaultQuestionCountEndCondition,
  createDefaultTimeLimitEndCondition,
  getQuestionCountSelectOptions,
  getTimeLimitSecondsSelectOptions,
  TRAINING_CONFIG_LIMITS,
} from "../../../features/training/model/config";
import {
  type buildDistanceGuestSaveInput,
  buildDistanceGuestSummary,
  type DistanceGuestResult,
  evaluateDistanceAnswer,
  getDistanceAnswerChoices,
  getDistanceQuestionCount,
  getNoteFrequency,
  validateDistanceTrainingConfig,
} from "../../../features/training/model/distance-guest";
import { formatDateTimeLabel } from "../../../features/training/model/format";
import {
  formatDirectionModeLabel,
  getIntervalLabel,
} from "../../../features/training/model/interval-notation";
import {
  createQuestionGeneratorState,
  type QuestionGeneratorState,
  takeNextQuestion,
} from "../../../features/training/model/question-generator";
import {
  canRetryTrainingResultSave,
  hasTrainingResultSavePayload,
  shouldAutoSaveTrainingResult,
} from "../../../features/training/model/result-save";
import {
  getNextReplayCount,
  resolvePostFeedbackProgress,
  resolveTimeLimitExpiry,
} from "../../../features/training/model/session-flow";
import type {
  DistanceTrainingConfig,
  NoteClass,
  Question,
  SessionFinishReason,
} from "../../../features/training/model/types";
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
import { formatRemainingTimeLabel } from "../train-ui-shared";
import { TrainingPageHero } from "../training-page-shell";
import {
  DistanceFeedbackPanel,
  DistanceQuestionPanel,
  DistanceResultPanel,
} from "./distance-train-panels";

type DistanceTrainPhase =
  | "config"
  | "preparing"
  | "playing"
  | "answering"
  | "feedback"
  | "result";

type PlaybackKind = "question" | "base" | "target";

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

interface DistanceTrainClientProps {
  isAuthenticated: boolean;
  initialConfig: DistanceTrainingConfig;
  hasStoredConfig: boolean;
  persistLastUsedConfigAction: (
    config: DistanceTrainingConfig,
  ) => Promise<void>;
  saveResultsAction: (
    input: Parameters<typeof buildDistanceGuestSaveInput>[0],
  ) => Promise<SaveTrainingSessionResult>;
}

export function DistanceTrainClient({
  isAuthenticated,
  initialConfig,
  hasStoredConfig,
  persistLastUsedConfigAction,
  saveResultsAction,
}: DistanceTrainClientProps) {
  const { settings } = useGlobalUserSettings();
  const [config, setConfig] = useState<DistanceTrainingConfig>(initialConfig);
  const [phase, setPhase] = useState<DistanceTrainPhase>("config");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<string | null>(null);
  const [finishReason, setFinishReason] = useState<SessionFinishReason | null>(
    null,
  );
  const [activeQuestion, setActiveQuestion] =
    useState<ActiveQuestionState | null>(null);
  const [results, setResults] = useState<DistanceGuestResult[]>([]);
  const [feedbackResult, setFeedbackResult] =
    useState<DistanceGuestResult | null>(null);
  const [lastAnsweredWasFinal, setLastAnsweredWasFinal] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [saveResult, setSaveResult] =
    useState<SaveTrainingSessionResult | null>(null);
  const [isSavePending, startSaveTransition] = useTransition();
  const persistedConfigSessionRef = useRef<string | null>(null);
  const autoSaveAttemptedSessionRef = useRef<string | null>(null);
  const playbackIdRef = useRef(0);
  const playedNonceRef = useRef<number | null>(null);
  const playbackLockRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const questionGeneratorStateRef = useRef<QuestionGeneratorState | null>(null);
  const sessionDeadlineAtRef = useRef<number | null>(null);
  const timeoutHandledRef = useRef(false);
  const plannedQuestionCount = getDistanceQuestionCount(config);
  const questionCountOptions =
    getQuestionCountSelectOptions(plannedQuestionCount);
  const timeLimitOptions =
    config.endCondition.type === "time_limit"
      ? getTimeLimitSecondsSelectOptions(config.endCondition.timeLimitSeconds)
      : getTimeLimitSecondsSelectOptions(
          createDefaultTimeLimitEndCondition().timeLimitSeconds,
        );
  const [remainingTimeMs, setRemainingTimeMs] = useState<number | null>(null);
  const answerChoiceValues = useMemo(
    () => getDistanceAnswerChoices(config),
    [config],
  );
  const summary = useMemo(() => buildDistanceGuestSummary(results), [results]);
  const recentResults = useMemo(() => results.slice(-3).reverse(), [results]);
  const cannotSaveBecauseNoAnswers = phase === "result" && results.length === 0;
  const saveContext = {
    isAuthenticated,
    startedAt,
    endedAt,
    finishReason,
    resultsCount: results.length,
  };
  const canSaveResult = hasTrainingResultSavePayload(saveContext);
  const intervalNotationStyle = settings.intervalNotationStyle;
  const formatIntervalName = (semitones: number) =>
    getIntervalLabel(semitones, intervalNotationStyle);

  useEffect(() => {
    if (phase !== "playing" || !activeQuestion) {
      return;
    }

    if (playedNonceRef.current === activeQuestion.playNonce) {
      return;
    }

    playedNonceRef.current = activeQuestion.playNonce;
    let cancelled = false;

    void playQuestionAudio(
      activeQuestion.question,
      activeQuestion.playbackKind,
      audioContextRef,
      settings.masterVolume,
      playbackLockRef,
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
  }, [activeQuestion, phase, settings.masterVolume]);

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
        timeoutHandledRef.current = true;
        const timedOutSession = resolveTimeLimitExpiry(
          new Date().toISOString(),
        );
        setActiveQuestion(null);
        setFeedbackResult(null);
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
      isAuthenticated,
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
    isAuthenticated,
    isSavePending,
    results,
    saveResult?.ok,
    saveResultsAction,
    startedAt,
  ]);

  function handleStart() {
    const validationError = validateDistanceTrainingConfig(config);

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
    questionGeneratorStateRef.current = createQuestionGeneratorState(config);
    setActiveQuestion(
      createActiveQuestion(config, 0, playbackIdRef, questionGeneratorStateRef),
    );
    if (isAuthenticated) {
      persistedConfigSessionRef.current = nextStartedAt;
      void persistLastUsedConfigAction(config);
    }
    setPhase("preparing");
  }

  function handleReplayBase() {
    if (!activeQuestion) {
      return;
    }

    void playQuestionAudio(
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
                replayBaseCount: getNextReplayCount(
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
  }

  function handleReplayTarget() {
    if (!activeQuestion) {
      return;
    }

    void playQuestionAudio(
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
                replayTargetCount: getNextReplayCount(
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
  }

  function handleAnswer(answeredDistanceSemitones: number) {
    if (!activeQuestion?.answeringStartedAt) {
      return;
    }

    const answeredAt = new Date().toISOString();
    const responseTimeMs = Math.max(
      0,
      Date.parse(answeredAt) - Date.parse(activeQuestion.answeringStartedAt),
    );
    const result = evaluateDistanceAnswer({
      question: activeQuestion.question,
      answeredDistanceSemitones,
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
    void playFeedbackEffect(
      audioContextRef,
      settings.masterVolume,
      settings.soundEffectsEnabled,
      result.isCorrect,
      playbackLockRef,
    );
  }

  function handleReplayCorrectTarget() {
    if (!feedbackResult) {
      return;
    }

    void playQuestionAudio(
      feedbackResult.question,
      "target",
      audioContextRef,
      settings.masterVolume,
      playbackLockRef,
    ).catch(() => {
      setAudioError("音声の再生に失敗しました。そのまま続行できます。");
    });
  }

  function handleContinue() {
    if (!feedbackResult || !activeQuestion) {
      return;
    }

    const nextProgress = resolvePostFeedbackProgress({
      endCondition: config.endCondition,
      currentQuestionIndex: activeQuestion.question.questionIndex,
      lastAnsweredWasFinal,
      answeredAt: feedbackResult.answeredAt,
    });

    if (nextProgress.phase === "result") {
      setActiveQuestion(null);
      setFinishReason(nextProgress.finishReason);
      setEndedAt(nextProgress.endedAt);
      setPhase(nextProgress.phase);
      return;
    }

    setFeedbackResult(null);
    setActiveQuestion(
      createActiveQuestion(
        config,
        nextProgress.nextQuestionIndex,
        playbackIdRef,
        questionGeneratorStateRef,
      ),
    );
    setPhase(nextProgress.phase);
  }

  function handleReset() {
    setPhase("config");
    setStartedAt(null);
    setEndedAt(null);
    setFinishReason(null);
    setActiveQuestion(null);
    setResults([]);
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
  }

  function handleSaveResults() {
    const retrySaveContext = {
      isAuthenticated,
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
  }

  return (
    <AppShell narrow className="ui-train-shell">
      <TrainingPageHero
        title="距離モード"
        subtitle="設定から結果表示まで、距離モードの MVP セッションを 1 画面内で進められます。"
        phase={phase}
        phaseLabel={formatPhaseLabel(phase)}
        actions={
          <>
            <ButtonLink href="/" pendingLabel="ホームを開いています...">
              ホームへ戻る
            </ButtonLink>
            {!isAuthenticated ? (
              <ButtonLink
                href="/login"
                pendingLabel="ログイン画面を開いています..."
              >
                ログイン
              </ButtonLink>
            ) : null}
          </>
        }
      >
        <div className="ui-train-status-grid">
          <KeyValueCard label="進行状態" value={formatPhaseLabel(phase)} />
          {startedAt ? (
            <KeyValueCard
              label="開始時刻"
              value={formatDateTimeLabel(startedAt)}
            />
          ) : null}
          {config.endCondition.type === "time_limit" &&
          remainingTimeMs !== null ? (
            <KeyValueCard
              label="残り時間"
              value={formatRemainingTimeLabel(remainingTimeMs)}
            />
          ) : null}
        </div>
        <p className="ui-subtitle">
          {isAuthenticated
            ? "ログイン中は、結果画面に進むとセッション結果を自動保存します。"
            : "ゲストでは結果を画面内にのみ保持し、保存は行いません。"}
        </p>
        {audioError ? <Notice tone="error">{audioError}</Notice> : null}
      </TrainingPageHero>

      {phase === "config" ? (
        <Surface tone="accent">
          <SectionHeader
            title="出題設定"
            description="終了条件、出題レンジ、答え方をこの画面で整えてから始めます。"
          />
          <div className="ui-grid-cards">
            <div className="ui-panel-card ui-stack-md">
              <strong>セッション終了</strong>
              <Field label="終了条件">
                <select
                  className="ui-select"
                  value={config.endCondition.type}
                  onChange={(event) =>
                    setConfig((current) => ({
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
                      setConfig((current) => ({
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
                      setConfig((current) => ({
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
                      setConfig((current) => {
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
                      setConfig((current) => ({
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
                    setConfig((current) => ({
                      ...current,
                      directionMode: event.target
                        .value as DistanceTrainingConfig["directionMode"],
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
                    setConfig((current) => ({
                      ...current,
                      baseNoteMode: event.target
                        .value as DistanceTrainingConfig["baseNoteMode"],
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
                      setConfig((current) => ({
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
                    setConfig((current) => ({
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
                    setConfig((current) => ({
                      ...current,
                      includeOctave: event.target.checked,
                    }))
                  }
                />
                <span>オクターブを含める</span>
              </label>

              <Field label="音程表記の粒度">
                <select
                  className="ui-select"
                  value={config.intervalGranularity}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      intervalGranularity: event.target
                        .value as DistanceTrainingConfig["intervalGranularity"],
                    }))
                  }
                >
                  <option value="simple">シンプル</option>
                  <option value="aug_dim">増減あり</option>
                </select>
              </Field>

              <KeyValueCard
                label="回答候補"
                value={answerChoiceValues
                  .map((choice) => formatIntervalName(choice))
                  .join(", ")}
              />
            </div>
          </div>

          {isAuthenticated && hasStoredConfig ? (
            <Notice>前回設定を読み込み済みです。</Notice>
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
        <DistanceQuestionPanel
          phase={phase}
          questionIndex={activeQuestion.question.questionIndex}
          direction={activeQuestion.question.direction}
          replayBaseCount={activeQuestion.replayBaseCount}
          replayTargetCount={activeQuestion.replayTargetCount}
          playbackKind={activeQuestion.playbackKind}
          answerChoiceValues={answerChoiceValues}
          intervalNotationStyle={intervalNotationStyle}
          onReplayBase={handleReplayBase}
          onReplayTarget={handleReplayTarget}
          onAnswer={handleAnswer}
        />
      ) : null}

      {phase === "feedback" && feedbackResult ? (
        <DistanceFeedbackPanel
          feedbackResult={feedbackResult}
          lastAnsweredWasFinal={lastAnsweredWasFinal}
          intervalNotationStyle={intervalNotationStyle}
          onReplayCorrectTarget={handleReplayCorrectTarget}
          onContinue={handleContinue}
        />
      ) : null}

      {phase === "result" ? (
        <DistanceResultPanel
          summary={summary}
          recentResults={recentResults}
          intervalNotationStyle={intervalNotationStyle}
          finishReason={finishReason}
          isAuthenticated={isAuthenticated}
          canSaveResult={canSaveResult}
          cannotSaveBecauseNoAnswers={cannotSaveBecauseNoAnswers}
          isSavePending={isSavePending}
          saveResult={saveResult}
          onRetrySave={handleSaveResults}
          onReset={handleReset}
        />
      ) : null}
    </AppShell>
  );
}

function createActiveQuestion(
  config: DistanceTrainingConfig,
  questionIndex: number,
  playbackIdRef: React.MutableRefObject<number>,
  questionGeneratorStateRef: React.MutableRefObject<QuestionGeneratorState | null>,
): ActiveQuestionState {
  if (!questionGeneratorStateRef.current) {
    throw new Error(
      "Question generator state must be initialized before play.",
    );
  }

  const nextQuestion = takeNextQuestion(
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

function nextPlaybackNonce(
  playbackIdRef: React.MutableRefObject<number>,
): number {
  playbackIdRef.current += 1;

  return playbackIdRef.current;
}

async function playQuestionAudio(
  question: Question,
  playbackKind: PlaybackKind,
  audioContextRef: React.MutableRefObject<AudioContext | null>,
  masterVolume: number,
  playbackLockRef: React.MutableRefObject<boolean>,
): Promise<boolean> {
  return runGuardedPlayback(playbackLockRef, async () => {
    const audioContext = await getAudioContext(audioContextRef);

    if (playbackKind === "base") {
      await playNote(audioContext, question.baseMidi, masterVolume);
      return;
    }

    if (playbackKind === "target") {
      await playNote(audioContext, question.targetMidi, masterVolume);
      return;
    }

    await playNote(audioContext, question.baseMidi, masterVolume);
    await wait(140);
    await playNote(audioContext, question.targetMidi, masterVolume);
  });
}

function playTone(
  audioContext: AudioContext,
  frequency: number,
  durationSeconds: number,
  masterVolume: number,
): Promise<void> {
  return new Promise((resolve) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const now = audioContext.currentTime;
    const peakGain = Math.max(
      0.0001,
      (Math.min(100, Math.max(0, masterVolume)) / 100) * 0.15,
    );

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(peakGain, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + durationSeconds);
    oscillator.onended = () => resolve();
  });
}

async function playFeedbackEffect(
  audioContextRef: React.MutableRefObject<AudioContext | null>,
  masterVolume: number,
  soundEffectsEnabled: boolean,
  isCorrect: boolean,
  playbackLockRef: React.MutableRefObject<boolean>,
): Promise<void> {
  if (!soundEffectsEnabled || typeof window === "undefined") {
    return;
  }

  await runGuardedPlayback(playbackLockRef, async () => {
    const audioContext = await getAudioContext(audioContextRef);

    await playTone(
      audioContext,
      isCorrect ? 880 : 220,
      0.08,
      Math.max(12, Math.round(masterVolume * 0.5)),
    );
  });
}

async function getAudioContext(
  audioContextRef: React.MutableRefObject<AudioContext | null>,
): Promise<AudioContext> {
  if (typeof window === "undefined") {
    throw new Error("AudioContext is not available.");
  }

  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error("AudioContext is not available.");
  }

  const audioContext = audioContextRef.current ?? new AudioContextClass();
  audioContextRef.current = audioContext;

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  return audioContext;
}

async function playNote(
  audioContext: AudioContext,
  midi: number,
  masterVolume: number,
): Promise<void> {
  await playTone(audioContext, getNoteFrequency(midi), 0.35, masterVolume);
}

async function runGuardedPlayback(
  playbackLockRef: React.MutableRefObject<boolean>,
  playback: () => Promise<void>,
): Promise<boolean> {
  if (playbackLockRef.current) {
    return false;
  }

  playbackLockRef.current = true;

  try {
    await playback();
    return true;
  } finally {
    playbackLockRef.current = false;
  }
}

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function formatPhaseLabel(phase: DistanceTrainPhase): string {
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
