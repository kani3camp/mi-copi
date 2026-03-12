"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useGlobalUserSettings } from "../../../features/settings/client/global-user-settings-provider";
import {
  type buildDistanceGuestSaveInput,
  buildDistanceGuestSummary,
  type DistanceGuestResult,
  evaluateDistanceAnswer,
  generateDistanceQuestion,
  getDistanceAnswerChoices,
  getDistanceQuestionCount,
  getNoteFrequency,
  validateDistanceTrainingConfig,
} from "../../../features/training/model/distance-guest";
import {
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatDateTimeLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
} from "../../../features/training/model/format";
import {
  formatSignedSemitoneLabel,
  getIntervalLabel,
} from "../../../features/training/model/interval-notation";
import {
  hasTrainingResultSavePayload,
  shouldAutoSaveTrainingResult,
} from "../../../features/training/model/result-save";
import type {
  DistanceTrainingConfig,
  NoteClass,
  Question,
  SessionFinishReason,
} from "../../../features/training/model/types";
import type { SaveTrainingSessionResult } from "../../../features/training/server/saveTrainingSession";
import {
  actionRowStyle,
  buttonStyle,
  cardStyle,
  checkboxFieldStyle,
  compactFieldGridStyle,
  controlStyle,
  formFieldStyle,
  keyValueCardStyle,
  keyValueGridStyle,
  navLinkStyle,
  navRowStyle,
  noticeStyle,
  pageHeroStyle,
  pageShellStyle,
  phaseBadgeStyle,
  sectionTitleStyle,
  subtleTextStyle,
} from "../../ui/polish";

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
  const sessionDeadlineAtRef = useRef<number | null>(null);
  const timeoutHandledRef = useRef(false);
  const plannedQuestionCount = getDistanceQuestionCount(config);
  const [remainingTimeMs, setRemainingTimeMs] = useState<number | null>(null);
  const answerChoiceValues = useMemo(
    () => getDistanceAnswerChoices(config),
    [config],
  );
  const summary = useMemo(() => buildDistanceGuestSummary(results), [results]);
  const recentResults = useMemo(() => results.slice(-3).reverse(), [results]);
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
      !isAuthenticated ||
      phase !== "result" ||
      !startedAt ||
      persistedConfigSessionRef.current === startedAt
    ) {
      return;
    }

    persistedConfigSessionRef.current = startedAt;
    void persistLastUsedConfigAction(config);
  }, [config, isAuthenticated, persistLastUsedConfigAction, phase, startedAt]);

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
        setActiveQuestion(null);
        setFeedbackResult(null);
        setLastAnsweredWasFinal(true);
        setFinishReason("time_up");
        setEndedAt(new Date().toISOString());
        setPhase("result");
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
          config.endCondition.timeLimitMinutes * 60 * 1000
        : null;
    setRemainingTimeMs(
      config.endCondition.type === "time_limit"
        ? config.endCondition.timeLimitMinutes * 60 * 1000
        : null,
    );
    setActiveQuestion(createActiveQuestion(config, 0, playbackIdRef));
    setPhase("preparing");
  }

  function handleReplayBase() {
    if (!activeQuestion) {
      return;
    }

    setActiveQuestion({
      ...activeQuestion,
      replayBaseCount: activeQuestion.replayBaseCount + 1,
      playbackKind: "base",
      playNonce: nextPlaybackNonce(playbackIdRef),
    });
    setPhase("preparing");
  }

  function handleReplayTarget() {
    if (!activeQuestion) {
      return;
    }

    setActiveQuestion({
      ...activeQuestion,
      replayTargetCount: activeQuestion.replayTargetCount + 1,
      playbackKind: "target",
      playNonce: nextPlaybackNonce(playbackIdRef),
    });
    setPhase("playing");
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

    const nextQuestionIndex = activeQuestion.question.questionIndex + 1;
    const reachedTarget =
      config.endCondition.type === "question_count" &&
      nextQuestionIndex >= config.endCondition.questionCount;

    if (lastAnsweredWasFinal || reachedTarget) {
      setActiveQuestion(null);
      setFinishReason("target_reached");
      setEndedAt(feedbackResult.answeredAt);
      setPhase("result");
      return;
    }

    setFeedbackResult(null);
    setActiveQuestion(
      createActiveQuestion(
        config,
        activeQuestion.question.questionIndex + 1,
        playbackIdRef,
      ),
    );
    setPhase("playing");
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
    };

    if (!hasTrainingResultSavePayload(retrySaveContext) || saveResult?.ok) {
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
    <main style={pageShellStyle}>
      <header style={pageHeroStyle}>
        <div
          style={{
            display: "grid",
            gap: "10px",
          }}
        >
          <h1 style={{ ...sectionTitleStyle, fontSize: "34px" }}>距離モード</h1>
          <span style={phaseBadgeStyle(phase)}>{formatPhaseLabel(phase)}</span>
        </div>
        <p style={subtleTextStyle}>
          設定から結果表示まで、距離モードの MVP セッションを 1
          画面内で進められます。
        </p>
        <div style={navRowStyle}>
          <Link href="/" style={navLinkStyle}>
            ホームへ戻る
          </Link>
          {!isAuthenticated ? (
            <Link href="/login" style={navLinkStyle}>
              ログイン
            </Link>
          ) : null}
        </div>
      </header>

      <section style={cardStyle}>
        <div style={keyValueGridStyle}>
          <div style={keyValueCardStyle}>
            <strong>進行状態</strong>
            <span>{formatPhaseLabel(phase)}</span>
          </div>
          {startedAt ? (
            <div style={keyValueCardStyle}>
              <strong>開始時刻</strong>
              <span>{formatDateTimeLabel(startedAt)}</span>
            </div>
          ) : null}
          {config.endCondition.type === "time_limit" &&
          remainingTimeMs !== null ? (
            <div style={keyValueCardStyle}>
              <strong>残り時間</strong>
              <span>{formatRemainingTimeLabel(remainingTimeMs)}</span>
            </div>
          ) : null}
        </div>
        <p style={subtleTextStyle}>
          {isAuthenticated
            ? "ログイン中は、結果画面に進むとセッション結果を自動保存します。"
            : "ゲストでは結果を画面内にのみ保持し、保存は行いません。"}
        </p>
        {audioError ? (
          <div style={noticeStyle("error")}>{audioError}</div>
        ) : null}
      </section>

      {phase === "config" ? (
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>出題設定</h2>
          <label style={formFieldStyle}>
            <span>終了条件</span>
            <select
              style={controlStyle}
              value={config.endCondition.type}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  endCondition:
                    event.target.value === "time_limit"
                      ? { type: "time_limit", timeLimitMinutes: 3 }
                      : { type: "question_count", questionCount: 10 },
                }))
              }
            >
              <option value="question_count">問題数</option>
              <option value="time_limit">制限時間</option>
            </select>
          </label>

          {config.endCondition.type === "question_count" ? (
            <label style={formFieldStyle}>
              <span>問題数</span>
              <input
                style={controlStyle}
                type="number"
                min={1}
                max={20}
                value={plannedQuestionCount}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    endCondition: {
                      type: "question_count",
                      questionCount: clampNumber(event.target.value, 1, 20),
                    },
                  }))
                }
              />
            </label>
          ) : (
            <label style={formFieldStyle}>
              <span>制限時間（分）</span>
              <input
                style={controlStyle}
                type="number"
                min={1}
                max={30}
                value={config.endCondition.timeLimitMinutes}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    endCondition: {
                      type: "time_limit",
                      timeLimitMinutes: clampNumber(event.target.value, 1, 30),
                    },
                  }))
                }
              />
            </label>
          )}

          <div style={compactFieldGridStyle}>
            <label style={formFieldStyle}>
              <span>最小半音数</span>
              <input
                style={controlStyle}
                type="number"
                min={0}
                max={12}
                value={config.intervalRange.minSemitones}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    intervalRange: {
                      ...current.intervalRange,
                      minSemitones: clampNumber(event.target.value, 0, 12),
                    },
                  }))
                }
              />
            </label>

            <label style={formFieldStyle}>
              <span>最大半音数</span>
              <input
                style={controlStyle}
                type="number"
                min={1}
                max={12}
                value={config.intervalRange.maxSemitones}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    intervalRange: {
                      ...current.intervalRange,
                      maxSemitones: clampNumber(event.target.value, 1, 12),
                    },
                  }))
                }
              />
            </label>
          </div>

          <label style={formFieldStyle}>
            <span>出題方向</span>
            <select
              style={controlStyle}
              value={config.directionMode}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  directionMode: event.target
                    .value as DistanceTrainingConfig["directionMode"],
                }))
              }
            >
              <option value="mixed">上下混在</option>
              <option value="up_only">上行のみ</option>
            </select>
          </label>

          <label style={formFieldStyle}>
            <span>基準音モード</span>
            <select
              style={controlStyle}
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
          </label>

          {config.baseNoteMode === "fixed" ? (
            <label style={formFieldStyle}>
              <span>固定する基準音</span>
              <select
                style={controlStyle}
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
            </label>
          ) : null}

          <label style={checkboxFieldStyle}>
            <input
              style={{
                width: "20px",
                height: "20px",
                margin: 0,
                flexShrink: 0,
              }}
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

          <label style={checkboxFieldStyle}>
            <input
              style={{
                width: "20px",
                height: "20px",
                margin: 0,
                flexShrink: 0,
              }}
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

          <label style={formFieldStyle}>
            <span>音程表記の粒度</span>
            <select
              style={controlStyle}
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
          </label>

          <div style={keyValueCardStyle}>
            <strong>回答候補:</strong>{" "}
            {answerChoiceValues
              .map((choice) => formatIntervalName(choice))
              .join(", ")}
          </div>

          {isAuthenticated && hasStoredConfig ? (
            <div style={noticeStyle("info")}>前回設定を読み込み済みです。</div>
          ) : null}

          {configError ? (
            <div style={noticeStyle("error")}>{configError}</div>
          ) : null}

          <div style={actionRowStyle}>
            <button
              type="button"
              onClick={handleStart}
              style={{
                ...buttonStyle("primary"),
                width: "100%",
                maxWidth: "240px",
              }}
            >
              開始
            </button>
          </div>
        </section>
      ) : null}

      {phase === "preparing" && activeQuestion ? (
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>準備中</h2>
          <p style={subtleTextStyle}>
            次の問題を準備して、基準音と問題音の再生に入ります。
          </p>
          <div style={noticeStyle("info")}>
            問題 {activeQuestion.question.questionIndex + 1} を準備しています...
          </div>
        </section>
      ) : null}

      {(phase === "playing" || phase === "answering") && activeQuestion ? (
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>
            問題 {activeQuestion.question.questionIndex + 1}
          </h2>
          <p style={subtleTextStyle}>
            基準音と問題音を聞いて、音程名で回答してください。
          </p>
          <div style={keyValueGridStyle}>
            <div style={keyValueCardStyle}>
              <strong>方向:</strong>{" "}
              {formatQuestionDirectionLabel(activeQuestion.question.direction)}
            </div>
            <div style={keyValueCardStyle}>
              <strong>基準音の再生回数:</strong>{" "}
              {activeQuestion.replayBaseCount}
            </div>
            <div style={keyValueCardStyle}>
              <strong>問題音の再生回数:</strong>{" "}
              {activeQuestion.replayTargetCount}
            </div>
          </div>

          {phase === "playing" ? (
            <div style={noticeStyle("info")}>
              {getPlaybackStatusLabel(activeQuestion.playbackKind)}
            </div>
          ) : null}

          {phase === "answering" ? (
            <>
              <div style={actionRowStyle}>
                <button
                  type="button"
                  onClick={handleReplayBase}
                  style={{ ...buttonStyle(), flex: "1 1 180px" }}
                >
                  基準音をもう一度聞く
                </button>
                <button
                  type="button"
                  onClick={handleReplayTarget}
                  style={{ ...buttonStyle(), flex: "1 1 180px" }}
                >
                  問題音をもう一度聞く
                </button>
              </div>
              <div style={answerButtonGridStyle}>
                {answerChoiceValues.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => handleAnswer(choice)}
                    style={{
                      ...buttonStyle("secondary"),
                      width: "100%",
                      textAlign: "left",
                    }}
                  >
                    {formatIntervalName(choice)}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {phase === "feedback" && feedbackResult ? (
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>フィードバック</h2>
          <div
            style={feedbackStatusBannerStyle(
              feedbackResult.isCorrect ? "success" : "error",
            )}
          >
            <strong>{feedbackResult.isCorrect ? "正解" : "不正解"}</strong>
            <span>
              {feedbackResult.question.direction === "up" ? "上行" : "下行"}
            </span>
          </div>
          <div style={feedbackIntervalGridStyle}>
            <div style={feedbackIntervalCardStyle}>
              <span style={feedbackCardLabelStyle}>正解</span>
              <strong style={feedbackCardValueStyle}>
                {formatIntervalName(feedbackResult.question.distanceSemitones)}
              </strong>
            </div>
            <div style={feedbackIntervalCardStyle}>
              <span style={feedbackCardLabelStyle}>あなたの回答</span>
              <strong style={feedbackCardValueStyle}>
                {formatIntervalName(feedbackResult.answeredDistanceSemitones)}
              </strong>
            </div>
          </div>
          <div style={keyValueGridStyle}>
            <div style={keyValueCardStyle}>
              <strong>誤差</strong>
              <span>
                {formatSignedSemitoneLabel(feedbackResult.errorSemitones)}
              </span>
            </div>
            <div style={keyValueCardStyle}>
              <strong>回答時間</strong>
              <span>
                {formatResponseTimeMsLabel(feedbackResult.responseTimeMs)}
              </span>
            </div>
            <div style={keyValueCardStyle}>
              <strong>スコア</strong>
              <span>{formatScoreLabel(feedbackResult.score)}</span>
            </div>
          </div>
          <div style={actionRowStyle}>
            <button
              type="button"
              onClick={handleReplayCorrectTarget}
              style={{ ...buttonStyle(), flex: "1 1 180px" }}
            >
              正解の音をもう一度聞く
            </button>
            <button
              type="button"
              onClick={handleContinue}
              style={{ ...buttonStyle("primary"), flex: "1 1 180px" }}
            >
              {lastAnsweredWasFinal ? "結果を見る" : "次の問題へ"}
            </button>
          </div>
        </section>
      ) : null}

      {phase === "result" ? (
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>結果</h2>
          <div style={keyValueGridStyle}>
            <div style={keyValueCardStyle}>
              <strong>回答数</strong>
              <span>{summary.questionCount}</span>
            </div>
            <div style={keyValueCardStyle}>
              <strong>終了理由</strong>
              <span>{formatFinishReasonLabel(finishReason)}</span>
            </div>
            <div style={keyValueCardStyle}>
              <strong>正解数</strong>
              <span>{summary.correctCount}</span>
            </div>
            <div style={keyValueCardStyle}>
              <strong>正答率</strong>
              <span>{formatAccuracyLabel(summary.accuracyRate)}</span>
            </div>
            <div style={keyValueCardStyle}>
              <strong>平均誤差</strong>
              <span>{formatAvgErrorLabel(summary.avgErrorAbs)}</span>
            </div>
            <div style={keyValueCardStyle}>
              <strong>平均回答時間</strong>
              <span>
                {formatResponseTimeMsLabel(summary.avgResponseTimeMs)}
              </span>
            </div>
            <div style={keyValueCardStyle}>
              <strong>セッションスコア</strong>
              <span>{formatScoreLabel(summary.sessionScore)}</span>
            </div>
          </div>

          {recentResults.length > 0 ? (
            <div style={{ display: "grid", gap: "10px" }}>
              <h3 style={{ ...sectionTitleStyle, fontSize: "18px" }}>
                直近の回答
              </h3>
              <div style={{ display: "grid", gap: "10px" }}>
                {recentResults.map((result) => (
                  <div key={result.answeredAt} style={keyValueCardStyle}>
                    <strong>問題 {result.question.questionIndex + 1}</strong>
                    <span>
                      正解:{" "}
                      {formatIntervalName(result.question.distanceSemitones)}
                    </span>
                    <span>
                      回答:{" "}
                      {formatIntervalName(result.answeredDistanceSemitones)}
                    </span>
                    <span>
                      {formatSignedSemitoneLabel(result.errorSemitones)} /{" "}
                      {formatResponseTimeMsLabel(result.responseTimeMs)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {isAuthenticated ? (
            !cannotSaveBecauseNoAnswers ? (
              <>
                <div
                  style={
                    saveResult?.ok
                      ? noticeStyle("success")
                      : saveResult
                        ? noticeStyle("error")
                        : canSaveResult
                          ? noticeStyle("info")
                          : noticeStyle("error")
                  }
                >
                  {saveResult?.ok ? (
                    <div style={{ display: "grid", gap: "10px" }}>
                      <div>
                        結果を自動保存しました。セッション ID:{" "}
                        <code>{saveResult.sessionId}</code>
                      </div>
                      <div style={navRowStyle}>
                        <Link
                          href={`/sessions/${saveResult.sessionId}`}
                          style={navLinkStyle}
                        >
                          セッション詳細を見る
                        </Link>
                        <Link href="/stats" style={navLinkStyle}>
                          統計を見る
                        </Link>
                      </div>
                    </div>
                  ) : saveResult ? (
                    <div style={{ display: "grid", gap: "6px" }}>
                      <div>{saveFailureMessage}</div>
                      <div style={subtleTextStyle}>
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
                </div>

                {saveResult && !saveResult.ok && canSaveResult ? (
                  <div style={actionRowStyle}>
                    <button
                      type="button"
                      disabled={isSavePending}
                      onClick={handleSaveResults}
                      style={{
                        ...buttonStyle("primary", isSavePending),
                        flex: "1 1 180px",
                      }}
                    >
                      {isSavePending ? "再試行中..." : "保存を再試行"}
                    </button>
                  </div>
                ) : null}
              </>
            ) : null
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              <div style={noticeStyle("info")}>
                ゲスト利用のため、この結果は保存されません。
              </div>
              <p style={subtleTextStyle}>
                ログインすると、次回以降のセッションから結果保存と統計
                を使えます。この結果は後から保存されません。
              </p>
              <div style={navRowStyle}>
                <Link href="/login" style={navLinkStyle}>
                  今後の保存用にログイン
                </Link>
              </div>
            </div>
          )}

          {finishReason === "time_up" ? (
            <div style={noticeStyle("info")}>
              制限時間に達したため終了しました。進行中で未回答の問題は集計から除外されています。
            </div>
          ) : null}

          {cannotSaveBecauseNoAnswers ? (
            <div style={noticeStyle("info")}>
              回答済みの問題がないため、このセッションは保存できません。時間に余裕を持ってもう一度お試しください。
            </div>
          ) : null}

          <div style={actionRowStyle}>
            <button
              type="button"
              onClick={handleReset}
              style={{ ...buttonStyle(), flex: "1 1 180px" }}
            >
              {cannotSaveBecauseNoAnswers
                ? "新しいセッションを始める"
                : "最初からやり直す"}
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function createActiveQuestion(
  config: DistanceTrainingConfig,
  questionIndex: number,
  playbackIdRef: React.MutableRefObject<number>,
): ActiveQuestionState {
  return {
    question: generateDistanceQuestion(config, questionIndex),
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
): Promise<void> {
  await runGuardedPlayback(playbackLockRef, async () => {
    const audioContext = await getAudioContext(audioContextRef);

    if (playbackKind === "base") {
      await playNote(audioContext, question.baseNote, masterVolume);
      return;
    }

    if (playbackKind === "target") {
      await playNote(audioContext, question.targetNote, masterVolume);
      return;
    }

    await playNote(audioContext, question.baseNote, masterVolume);
    await wait(140);
    await playNote(audioContext, question.targetNote, masterVolume);
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
  note: Question["baseNote"],
  masterVolume: number,
): Promise<void> {
  await playTone(audioContext, getNoteFrequency(note), 0.35, masterVolume);
}

async function runGuardedPlayback(
  playbackLockRef: React.MutableRefObject<boolean>,
  playback: () => Promise<void>,
): Promise<void> {
  if (playbackLockRef.current) {
    return;
  }

  playbackLockRef.current = true;

  try {
    await playback();
  } finally {
    playbackLockRef.current = false;
  }
}

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function clampNumber(rawValue: string, min: number, max: number): number {
  const parsedValue = Number.parseInt(rawValue, 10);

  if (Number.isNaN(parsedValue)) {
    return min;
  }

  return Math.min(Math.max(parsedValue, min), max);
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

function formatQuestionDirectionLabel(
  direction: Question["direction"],
): string {
  return direction === "up" ? "上行" : "下行";
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

const answerButtonGridStyle = {
  display: "grid",
  gap: "8px",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
};

const feedbackIntervalGridStyle = {
  display: "grid",
  gap: "10px",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
};

const feedbackIntervalCardStyle = {
  ...keyValueCardStyle,
  gap: "8px",
  padding: "16px",
};

const feedbackCardLabelStyle = {
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
};

const feedbackCardValueStyle = {
  fontSize: "24px",
  lineHeight: 1.25,
};

function feedbackStatusBannerStyle(kind: "success" | "error") {
  return {
    ...noticeStyle(kind),
    display: "grid",
    gap: "4px",
  };
}
