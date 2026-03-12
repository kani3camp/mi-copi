"use client";

import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

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
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatDateTimeLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
} from "../../../features/training/model/format";
import {
  formatDirectionModeLabel,
  formatQuestionDirectionLabel,
  formatSignedSemitoneLabel,
} from "../../../features/training/model/interval-notation";
import {
  type buildKeyboardGuestSaveInput,
  buildKeyboardGuestSummary,
  evaluateKeyboardAnswer,
  getKeyboardAnswerChoices,
  getKeyboardQuestionCount,
  getNoteFrequency,
  type KeyboardGuestResult,
  validateKeyboardTrainingConfig,
} from "../../../features/training/model/keyboard-guest";
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
  KeyboardTrainingConfig,
  NoteClass,
  Question,
  SessionFinishReason,
} from "../../../features/training/model/types";
import type { SaveTrainingSessionResult } from "../../../features/training/server/saveTrainingSession";
import {
  AppShell,
  Button,
  ButtonLink,
  Field,
  FieldGrid,
  KeyValueCard,
  KeyValueGrid,
  Notice,
  SectionHeader,
  Surface,
} from "../../ui/primitives";
import { TrainingPageHero } from "../training-page-shell";

type KeyboardTrainPhase =
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

const WHITE_KEY_NOTES: NoteClass[] = ["C", "D", "E", "F", "G", "A", "B"];

const BLACK_KEY_LAYOUT: Array<{
  note: NoteClass;
  left: string;
}> = [
  { note: "C#", left: "calc(14.2857% - 5.4%)" },
  { note: "D#", left: "calc(28.5714% - 5.4%)" },
  { note: "F#", left: "calc(57.1428% - 5.4%)" },
  { note: "G#", left: "calc(71.4285% - 5.4%)" },
  { note: "A#", left: "calc(85.7142% - 5.4%)" },
];

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

interface KeyboardTrainClientProps {
  isAuthenticated: boolean;
  initialConfig: KeyboardTrainingConfig;
  hasStoredConfig: boolean;
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
  persistLastUsedConfigAction,
  saveResultsAction,
}: KeyboardTrainClientProps) {
  const { settings } = useGlobalUserSettings();
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
  const [feedbackResult, setFeedbackResult] =
    useState<KeyboardGuestResult | null>(null);
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
  const plannedQuestionCount = getKeyboardQuestionCount(config);
  const questionCountOptions =
    getQuestionCountSelectOptions(plannedQuestionCount);
  const timeLimitOptions =
    config.endCondition.type === "time_limit"
      ? getTimeLimitSecondsSelectOptions(config.endCondition.timeLimitSeconds)
      : getTimeLimitSecondsSelectOptions(
          createDefaultTimeLimitEndCondition().timeLimitSeconds,
        );
  const [remainingTimeMs, setRemainingTimeMs] = useState<number | null>(null);
  const answerChoices = useMemo(() => getKeyboardAnswerChoices(), []);
  const summary = useMemo(() => buildKeyboardGuestSummary(results), [results]);
  const cannotSaveBecauseNoAnswers = phase === "result" && results.length === 0;
  const saveFailureMessage =
    saveResult && !saveResult.ok ? getSaveFailureMessage(saveResult) : null;
  const saveContext = {
    isAuthenticated,
    startedAt,
    endedAt,
    finishReason,
    resultsCount: results.length,
  };
  const canSaveResult = hasTrainingResultSavePayload(saveContext);

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
    const validationError = validateKeyboardTrainingConfig(config);

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

  function handleAnswer(answeredNote: NoteClass) {
    if (!activeQuestion?.answeringStartedAt) {
      return;
    }

    const answeredAt = new Date().toISOString();
    const responseTimeMs = Math.max(
      0,
      Date.parse(answeredAt) - Date.parse(activeQuestion.answeringStartedAt),
    );
    const result = evaluateKeyboardAnswer({
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
        title="鍵盤モード"
        subtitle="設定から結果表示まで、鍵盤モードの MVP セッションを 1 画面内で進められます。"
        phase={phase}
        phaseLabel={formatPhaseLabel(phase)}
        actions={
          <>
            <ButtonLink href="/">ホームへ戻る</ButtonLink>
            <ButtonLink href="/train/distance">距離モードへ</ButtonLink>
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
                    setConfig((current) => ({
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
        <Surface tone="accent">
          <SectionHeader
            title={`問題 ${activeQuestion.question.questionIndex + 1}`}
            description="基準音と問題音を聞いて、鍵盤上の音名で回答してください。"
          />
          <div className="ui-train-status-grid">
            <KeyValueCard
              label="方向"
              value={formatQuestionDirectionLabel(
                activeQuestion.question.direction,
              )}
            />
            <KeyValueCard
              label="基準音の再生回数"
              value={activeQuestion.replayBaseCount}
            />
            <KeyValueCard
              label="問題音の再生回数"
              value={activeQuestion.replayTargetCount}
            />
          </div>

          {phase === "playing" ? (
            <Notice>
              {getPlaybackStatusLabel(activeQuestion.playbackKind)}
            </Notice>
          ) : null}

          {phase === "answering" ? (
            <div className="ui-stack-md">
              <div className="ui-sticky-actions">
                <div className="ui-replay-panel">
                  <div className="ui-stack-sm">
                    <strong>もう一度聞く</strong>
                    <span className="ui-muted">
                      再生中の追加タップは無効です。
                    </span>
                  </div>
                  <div className="ui-replay-panel__row">
                    <Button
                      type="button"
                      onClick={handleReplayBase}
                      className="ui-icon-button"
                      aria-label="基準音をもう一度聞く"
                    >
                      <PlaybackIcon />
                      <span className="ui-icon-button__label">基準音</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={handleReplayTarget}
                      className="ui-icon-button"
                      aria-label="問題音をもう一度聞く"
                    >
                      <PlaybackIcon />
                      <span className="ui-icon-button__label">問題音</span>
                    </Button>
                  </div>
                </div>
              </div>
              <KeyboardAnswerPad
                answerChoices={answerChoices}
                referenceNote={activeQuestion.question.baseNote}
                onAnswer={handleAnswer}
                showLabels={settings.keyboardNoteLabelsVisible}
              />
            </div>
          ) : null}
        </Surface>
      ) : null}

      {phase === "feedback" && feedbackResult ? (
        <Surface>
          <SectionHeader title="フィードバック" />
          <Notice tone={feedbackResult.isCorrect ? "success" : "error"}>
            {feedbackResult.isCorrect ? "正解" : "不正解"}
          </Notice>
          <KeyValueGrid>
            <KeyValueCard
              label="正解の音"
              value={formatKeyboardNoteLabel(
                feedbackResult.question.targetNote,
              )}
            />
            <KeyValueCard
              label="あなたの回答"
              value={formatKeyboardNoteLabel(feedbackResult.answeredNote)}
            />
            <KeyValueCard
              label="誤差"
              value={formatSignedSemitoneLabel(feedbackResult.errorSemitones)}
            />
            <KeyValueCard
              label="回答時間"
              value={formatResponseTimeMsLabel(feedbackResult.responseTimeMs)}
            />
            <KeyValueCard
              label="スコア"
              value={formatScoreLabel(feedbackResult.score)}
            />
          </KeyValueGrid>
          <FeedbackKeyboardView
            answeredNote={feedbackResult.answeredNote}
            correctNote={feedbackResult.question.targetNote}
            isCorrect={feedbackResult.isCorrect}
            showLabels={settings.keyboardNoteLabelsVisible}
          />
          <div className="ui-sticky-actions">
            <Button type="button" onClick={handleReplayCorrectTarget} block>
              正解の音をもう一度聞く
            </Button>
            <Button
              type="button"
              onClick={handleContinue}
              variant="primary"
              block
            >
              {lastAnsweredWasFinal ? "結果を見る" : "次の問題へ"}
            </Button>
          </div>
        </Surface>
      ) : null}

      {phase === "result" ? (
        <Surface>
          <SectionHeader
            title="結果"
            description="今回のセッションの精度と反応速度をまとめています。"
          />
          <KeyValueGrid>
            <KeyValueCard label="回答数" value={summary.questionCount} />
            <KeyValueCard
              label="終了理由"
              value={formatFinishReasonLabel(finishReason)}
            />
            <KeyValueCard label="正解数" value={summary.correctCount} />
            <KeyValueCard
              label="正答率"
              value={formatAccuracyLabel(summary.accuracyRate)}
            />
            <KeyValueCard
              label="平均誤差"
              value={formatAvgErrorLabel(summary.avgErrorAbs)}
            />
            <KeyValueCard
              label="平均回答時間"
              value={formatResponseTimeMsLabel(summary.avgResponseTimeMs)}
            />
            <KeyValueCard
              label="セッションスコア"
              value={formatScoreLabel(summary.sessionScore)}
            />
          </KeyValueGrid>

          {finishReason === "time_up" ? (
            <Notice>
              制限時間に達したため終了しました。進行中で未回答の問題は集計から除外されています。
            </Notice>
          ) : null}

          {cannotSaveBecauseNoAnswers ? (
            <Notice>
              回答済みの問題がないため、このセッションは保存できません。時間に余裕を持ってもう一度お試しください。
            </Notice>
          ) : null}

          {isAuthenticated ? (
            !cannotSaveBecauseNoAnswers ? (
              <>
                <Notice
                  tone={
                    saveResult?.ok
                      ? "success"
                      : saveResult
                        ? "error"
                        : canSaveResult
                          ? "info"
                          : "error"
                  }
                >
                  {saveResult?.ok ? (
                    <div className="ui-stack-md">
                      <div>
                        結果を自動保存しました。セッション ID:{" "}
                        <code>{saveResult.sessionId}</code>
                      </div>
                      <div className="ui-nav-row">
                        <ButtonLink href={`/sessions/${saveResult.sessionId}`}>
                          セッション詳細を見る
                        </ButtonLink>
                        <ButtonLink href="/stats">統計を見る</ButtonLink>
                      </div>
                    </div>
                  ) : saveResult ? (
                    <div className="ui-stack-sm">
                      <div>{saveFailureMessage}</div>
                      <div className="ui-muted">
                        詳細: {saveResult.code} / {saveResult.message}
                      </div>
                    </div>
                  ) : canSaveResult ? (
                    <div>
                      {isSavePending
                        ? "結果を自動保存しています..."
                        : "保存の準備をしています..."}
                    </div>
                  ) : (
                    <div>セッション情報が不足しているため保存できません。</div>
                  )}
                </Notice>

                {saveResult && !saveResult.ok && canSaveResult ? (
                  <div className="ui-action-row">
                    <Button
                      type="button"
                      disabled={isSavePending}
                      onClick={handleSaveResults}
                      variant="primary"
                    >
                      {isSavePending ? "再試行中..." : "保存を再試行"}
                    </Button>
                  </div>
                ) : null}
              </>
            ) : null
          ) : (
            <div className="ui-stack-md">
              <Notice>ゲスト利用のため、この結果は保存されません。</Notice>
              <p className="ui-subtitle">
                ログインすると、次回以降のセッションから結果保存と統計を使えます。この結果は後から保存されません。
              </p>
              <div className="ui-nav-row">
                <ButtonLink href="/login">今後の保存用にログイン</ButtonLink>
              </div>
            </div>
          )}

          <div className="ui-sticky-actions">
            <div className="ui-stack-sm">
              <strong>次に進む</strong>
              <span className="ui-muted">
                結果を確認したら新しいセッションを始められます。
              </span>
            </div>
            <Button type="button" onClick={handleReset} block>
              {cannotSaveBecauseNoAnswers
                ? "新しいセッションを始める"
                : "最初からやり直す"}
            </Button>
          </div>
        </Surface>
      ) : null}
    </AppShell>
  );
}

function createActiveQuestion(
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

function getPlaybackStatusLabel(playbackKind: PlaybackKind): string {
  switch (playbackKind) {
    case "base":
      return "基準音を再生しています...";
    case "target":
      return "問題音を再生しています...";
    default:
      return "基準音のあとに問題音を再生しています...";
  }
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

function KeyboardAnswerPad(props: {
  answerChoices: NoteClass[];
  referenceNote: NoteClass;
  onAnswer: (note: NoteClass) => void;
  showLabels: boolean;
}) {
  const enabledNotes = new Set(props.answerChoices);

  return (
    <div style={pianoSectionStyle}>
      <div style={pianoShellStyle}>
        <div style={whiteKeyRowStyle}>
          {WHITE_KEY_NOTES.map((note) => (
            <button
              key={note}
              type="button"
              aria-label={formatKeyboardNoteLabel(note)}
              disabled={!enabledNotes.has(note)}
              onClick={() => props.onAnswer(note)}
              style={getKeyboardKeyStyle(note, {
                disabled: !enabledNotes.has(note),
                highlight: note === props.referenceNote ? "reference" : "idle",
                interactive: true,
              })}
            >
              {props.showLabels ? <KeyLabel note={note} /> : null}
            </button>
          ))}
        </div>
        {BLACK_KEY_LAYOUT.map(({ left, note }) => (
          <button
            key={note}
            type="button"
            aria-label={formatKeyboardNoteLabel(note)}
            disabled={!enabledNotes.has(note)}
            onClick={() => props.onAnswer(note)}
            style={getKeyboardKeyStyle(note, {
              disabled: !enabledNotes.has(note),
              highlight: note === props.referenceNote ? "reference" : "idle",
              interactive: true,
              left,
              position: "absolute",
            })}
          >
            {props.showLabels ? <KeyLabel note={note} compact /> : null}
          </button>
        ))}
      </div>
      <div style={feedbackLegendStyle}>
        <span style={legendItemStyle("var(--color-primary)", "#e7f1ea")}>
          基準音の位置
        </span>
      </div>
    </div>
  );
}

function FeedbackKeyboardView(props: {
  answeredNote: NoteClass;
  correctNote: NoteClass;
  isCorrect: boolean;
  showLabels: boolean;
}) {
  return (
    <div style={pianoSectionStyle}>
      <div style={pianoShellStyle}>
        <div style={whiteKeyRowStyle}>
          {WHITE_KEY_NOTES.map((note) => (
            <div
              key={note}
              aria-hidden="true"
              style={getKeyboardKeyStyle(note, {
                interactive: false,
                highlight: getKeyboardHighlightTone(
                  note,
                  props.correctNote,
                  props.answeredNote,
                ),
              })}
            >
              {props.showLabels ? <KeyLabel note={note} /> : null}
            </div>
          ))}
        </div>
        {BLACK_KEY_LAYOUT.map(({ left, note }) => (
          <div
            key={note}
            aria-hidden="true"
            style={getKeyboardKeyStyle(note, {
              interactive: false,
              left,
              position: "absolute",
              highlight: getKeyboardHighlightTone(
                note,
                props.correctNote,
                props.answeredNote,
              ),
            })}
          >
            {props.showLabels ? <KeyLabel note={note} compact /> : null}
          </div>
        ))}
      </div>
      <div style={feedbackLegendStyle}>
        <span style={legendItemStyle("#166534", "#dcfce7")}>正解の鍵盤</span>
        {props.isCorrect ? null : (
          <span style={legendItemStyle("#9a3412", "#ffedd5")}>
            あなたの回答
          </span>
        )}
      </div>
    </div>
  );
}

function getKeyboardKeyStyle(
  note: NoteClass,
  options: {
    disabled?: boolean;
    highlight?: "idle" | "reference" | "correct" | "answered" | "both";
    interactive: boolean;
    left?: string;
    position?: "relative" | "absolute";
  },
): CSSProperties {
  const blackKey = isBlackKey(note);
  const highlight = options.highlight ?? "idle";
  const isReference = highlight === "reference";
  const isCorrect = highlight === "correct" || highlight === "both";
  const isAnswered = highlight === "answered";
  const background = blackKey
    ? isReference
      ? "linear-gradient(180deg, #6aa57a 0%, #2f5f3f 100%)"
      : isCorrect
        ? "linear-gradient(180deg, #34d399 0%, #065f46 100%)"
        : isAnswered
          ? "linear-gradient(180deg, #fb923c 0%, #9a3412 100%)"
          : "linear-gradient(180deg, #374151 0%, #111827 100%)"
    : isReference
      ? "linear-gradient(180deg, #ffffff 0%, #e7f1ea 100%)"
      : isCorrect
        ? "linear-gradient(180deg, #ffffff 0%, #dcfce7 100%)"
        : isAnswered
          ? "linear-gradient(180deg, #ffffff 0%, #ffedd5 100%)"
          : "linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%)";
  const border = blackKey
    ? isReference
      ? "2px solid #7db08b"
      : isCorrect
        ? "2px solid #34d399"
        : isAnswered
          ? "2px solid #fdba74"
          : "1px solid #111827"
    : isReference
      ? "2px solid var(--color-primary)"
      : isCorrect
        ? "2px solid #16a34a"
        : isAnswered
          ? "2px solid #f97316"
          : "1px solid #d1d5db";

  return {
    position: options.position ?? "relative",
    left: options.left,
    top: options.position === "absolute" ? 0 : undefined,
    width: blackKey ? "10.8%" : undefined,
    minHeight: blackKey
      ? "clamp(110px, 24vw, 148px)"
      : "clamp(176px, 42vw, 240px)",
    padding: blackKey ? "14px 4px 10px" : "18px 6px 14px",
    borderRadius: blackKey ? "0 0 14px 14px" : "0 0 18px 18px",
    border,
    background,
    color: blackKey ? "#f9fafb" : "#111827",
    fontWeight: 700,
    fontSize: blackKey ? "11px" : "13px",
    lineHeight: 1.1,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    textAlign: "center",
    cursor: options.interactive && !options.disabled ? "pointer" : "default",
    opacity: options.disabled ? 0.5 : 1,
    boxShadow: blackKey
      ? isReference
        ? "0 12px 24px rgba(78, 143, 99, 0.26)"
        : isCorrect
          ? "0 12px 24px rgba(5, 150, 105, 0.34)"
          : isAnswered
            ? "0 12px 24px rgba(234, 88, 12, 0.3)"
            : "0 10px 20px rgba(17, 24, 39, 0.28)"
      : isReference
        ? "0 10px 24px rgba(78, 143, 99, 0.16)"
        : isCorrect
          ? "0 10px 24px rgba(34, 197, 94, 0.18)"
          : isAnswered
            ? "0 10px 24px rgba(249, 115, 22, 0.18)"
            : "0 8px 18px rgba(15, 23, 42, 0.08)",
    transform:
      options.interactive && !options.disabled ? "translateY(0)" : undefined,
    touchAction: "manipulation",
    zIndex: blackKey ? 2 : 1,
  };
}

function KeyLabel(props: { note: NoteClass; compact?: boolean }) {
  if (isBlackKey(props.note)) {
    const [sharp, flat] = formatKeyboardNoteLabel(props.note).split(" / ");

    return (
      <span
        style={{
          display: "grid",
          gap: "2px",
          justifyItems: "center",
          fontSize: props.compact ? "10px" : "11px",
        }}
      >
        <span>{sharp}</span>
        <span style={{ opacity: 0.82 }}>{flat}</span>
      </span>
    );
  }

  return <span>{props.note}</span>;
}

function formatKeyboardNoteLabel(note: NoteClass): string {
  switch (note) {
    case "C#":
      return "C# / Db";
    case "D#":
      return "D# / Eb";
    case "F#":
      return "F# / Gb";
    case "G#":
      return "G# / Ab";
    case "A#":
      return "A# / Bb";
    default:
      return note;
  }
}

function getKeyboardHighlightTone(
  note: NoteClass,
  correctNote: NoteClass,
  answeredNote: NoteClass,
): "idle" | "correct" | "answered" | "both" {
  if (note === correctNote && note === answeredNote) {
    return "both";
  }

  if (note === correctNote) {
    return "correct";
  }

  if (note === answeredNote) {
    return "answered";
  }

  return "idle";
}

function isBlackKey(note: NoteClass): boolean {
  return (
    note === "C#" ||
    note === "D#" ||
    note === "F#" ||
    note === "G#" ||
    note === "A#"
  );
}

const pianoSectionStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

const pianoShellStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  padding: "12px 10px 16px",
  borderRadius: "22px",
  border: "1px solid #d6ccbb",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(245,241,232,0.96) 100%)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.9), 0 16px 32px rgba(15, 23, 42, 0.08)",
};

const whiteKeyRowStyle: CSSProperties = {
  display: "grid",
  gap: "0",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
};

const feedbackLegendStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

function legendItemStyle(color: string, background: string): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    borderRadius: "999px",
    background,
    color,
    fontSize: "12px",
    fontWeight: 700,
  };
}

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function formatRemainingTimeLabel(valueMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(valueMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getSaveFailureMessage(
  result: Extract<SaveTrainingSessionResult, { ok: false }>,
): string {
  if (result.code === "UNAUTHORIZED") {
    return "ログイン状態を確認できませんでした。再度ログインしてからお試しください。";
  }

  if (result.code === "INVALID_INPUT") {
    return "セッション情報が不足しているため、この結果は保存できませんでした。";
  }

  return "結果を保存できませんでした。もう一度お試しください。";
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

function formatFinishReasonLabel(
  finishReason: SessionFinishReason | null,
): string {
  switch (finishReason) {
    case "target_reached":
      return "目標数に到達";
    case "time_up":
      return "時間切れ";
    case "manual_end":
      return "手動終了";
    default:
      return "不明";
  }
}

function PlaybackIcon() {
  return (
    <span className="ui-icon-button__icon" aria-hidden="true">
      <svg viewBox="0 0 20 20" width="20" height="20" fill="none">
        <title>再生</title>
        <path
          d="M4 7.5a1 1 0 0 1 1.6-.8l7 5a1 1 0 0 1 0 1.6l-7 5A1 1 0 0 1 4 17.5v-10Z"
          fill="currentColor"
        />
        <path
          d="M14.5 5.5a5.5 5.5 0 0 1 0 9"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
