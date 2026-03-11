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
  Question,
  SessionFinishReason,
} from "../../../features/training/model/types";
import type { SaveTrainingSessionResult } from "../../../features/training/server/saveTrainingSession";
import {
  buttonStyle,
  cardStyle,
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
            "Audio playback failed. You can still answer and continue.",
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
    setPhase("playing");
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
    setPhase("playing");
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
      setAudioError("Audio playback failed. You can still continue.");
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
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <h1 style={{ ...sectionTitleStyle, fontSize: "40px" }}>
            Distance Train
          </h1>
          <span style={phaseBadgeStyle(phase)}>{phase}</span>
        </div>
        <p style={subtleTextStyle}>
          設定 → 出題 → 回答 → フィードバック → 結果までを guest
          で最後まで通せる最小実装です。
        </p>
        <div style={navRowStyle}>
          <Link href="/" style={navLinkStyle}>
            Back home
          </Link>
          <Link href="/auth-test" style={navLinkStyle}>
            Auth test
          </Link>
        </div>
      </header>

      <section style={cardStyle}>
        <div style={keyValueGridStyle}>
          <div style={keyValueCardStyle}>
            <strong>Phase</strong>
            <span>{phase}</span>
          </div>
          {startedAt ? (
            <div style={keyValueCardStyle}>
              <strong>Started at</strong>
              <span>{formatDateTimeLabel(startedAt)}</span>
            </div>
          ) : null}
          {config.endCondition.type === "time_limit" &&
          remainingTimeMs !== null ? (
            <div style={keyValueCardStyle}>
              <strong>Time remaining</strong>
              <span>{formatRemainingTimeLabel(remainingTimeMs)}</span>
            </div>
          ) : null}
        </div>
        <p style={subtleTextStyle}>
          {isAuthenticated
            ? "Authenticated results save automatically when you reach the result screen."
            : "Guest mode keeps results only in client state and does not save."}
        </p>
        {audioError ? (
          <div style={noticeStyle("error")}>{audioError}</div>
        ) : null}
      </section>

      {phase === "config" ? (
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Config</h2>
          <label style={{ display: "grid", gap: "8px" }}>
            <span>End condition</span>
            <select
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
              <option value="question_count">question_count</option>
              <option value="time_limit">time_limit</option>
            </select>
          </label>

          {config.endCondition.type === "question_count" ? (
            <label style={{ display: "grid", gap: "8px" }}>
              <span>Question count</span>
              <input
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
            <label style={{ display: "grid", gap: "8px" }}>
              <span>Time limit (minutes)</span>
              <input
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

          <div
            style={{
              display: "grid",
              gap: "12px",
              gridTemplateColumns: "1fr 1fr",
            }}
          >
            <label style={{ display: "grid", gap: "8px" }}>
              <span>Min semitones</span>
              <input
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

            <label style={{ display: "grid", gap: "8px" }}>
              <span>Max semitones</span>
              <input
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

          <label style={{ display: "grid", gap: "8px" }}>
            <span>Direction</span>
            <select
              value={config.directionMode}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  directionMode: event.target
                    .value as DistanceTrainingConfig["directionMode"],
                }))
              }
            >
              <option value="mixed">mixed</option>
              <option value="up_only">up_only</option>
            </select>
          </label>

          <div>
            <strong>Candidate answers:</strong>{" "}
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

          <div>
            <button
              type="button"
              onClick={handleStart}
              style={buttonStyle("primary")}
            >
              Start
            </button>
          </div>
        </section>
      ) : null}

      {(phase === "playing" || phase === "answering") && activeQuestion ? (
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>
            Question {activeQuestion.question.questionIndex + 1}
          </h2>
          <p style={subtleTextStyle}>
            Hear the base tone and target tone, then answer the interval name.
          </p>
          <div style={keyValueGridStyle}>
            <div style={keyValueCardStyle}>
              <strong>Direction:</strong> {activeQuestion.question.direction}
            </div>
            <div style={keyValueCardStyle}>
              <strong>Base replay:</strong> {activeQuestion.replayBaseCount}
            </div>
            <div style={keyValueCardStyle}>
              <strong>Target replay:</strong> {activeQuestion.replayTargetCount}
            </div>
          </div>

          {phase === "playing" ? (
            <div style={noticeStyle("info")}>
              {getPlaybackStatusLabel(activeQuestion.playbackKind)}
            </div>
          ) : null}

          {phase === "answering" ? (
            <>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleReplayBase}
                  style={buttonStyle()}
                >
                  Replay base tone
                </button>
                <button
                  type="button"
                  onClick={handleReplayTarget}
                  style={buttonStyle()}
                >
                  Replay target tone
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
          <h2 style={sectionTitleStyle}>Feedback</h2>
          <div
            style={feedbackStatusBannerStyle(
              feedbackResult.isCorrect ? "success" : "error",
            )}
          >
            <strong>
              {feedbackResult.isCorrect ? "Correct" : "Incorrect"}
            </strong>
            <span>
              {feedbackResult.question.direction === "up"
                ? "Upward interval"
                : "Downward interval"}
            </span>
          </div>
          <div style={feedbackIntervalGridStyle}>
            <div style={feedbackIntervalCardStyle}>
              <span style={feedbackCardLabelStyle}>Correct interval</span>
              <strong style={feedbackCardValueStyle}>
                {formatIntervalName(feedbackResult.question.distanceSemitones)}
              </strong>
            </div>
            <div style={feedbackIntervalCardStyle}>
              <span style={feedbackCardLabelStyle}>Your answer</span>
              <strong style={feedbackCardValueStyle}>
                {formatIntervalName(feedbackResult.answeredDistanceSemitones)}
              </strong>
            </div>
          </div>
          <div style={keyValueGridStyle}>
            <div style={keyValueCardStyle}>
              <strong>Signed error</strong>
              <span>
                {formatSignedSemitoneLabel(feedbackResult.errorSemitones)}
              </span>
            </div>
            <div style={keyValueCardStyle}>
              <strong>Response time</strong>
              <span>
                {formatResponseTimeMsLabel(feedbackResult.responseTimeMs)}
              </span>
            </div>
            <div style={keyValueCardStyle}>
              <strong>Score</strong>
              <span>{formatScoreLabel(feedbackResult.score)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReplayCorrectTarget}
            style={buttonStyle()}
          >
            Replay correct target tone
          </button>
          <button
            type="button"
            onClick={handleContinue}
            style={buttonStyle("primary")}
          >
            {lastAnsweredWasFinal ? "Show result" : "Next question"}
          </button>
        </section>
      ) : null}

      {phase === "result" ? (
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Result</h2>
          <div style={keyValueGridStyle}>
            <div style={keyValueCardStyle}>
              <strong>Questions</strong>
              <span>{summary.questionCount}</span>
            </div>
            <div style={keyValueCardStyle}>
              <strong>Finish reason</strong>
              <span>{finishReason ?? "unknown"}</span>
            </div>
            <div style={keyValueCardStyle}>
              <strong>Correct</strong>
              <span>{summary.correctCount}</span>
            </div>
            <div style={keyValueCardStyle}>
              <strong>Accuracy</strong>
              <span>{formatAccuracyLabel(summary.accuracyRate)}</span>
            </div>
            <div style={keyValueCardStyle}>
              <strong>Avg error</strong>
              <span>{formatAvgErrorLabel(summary.avgErrorAbs)}</span>
            </div>
            <div style={keyValueCardStyle}>
              <strong>Avg response time</strong>
              <span>
                {formatResponseTimeMsLabel(summary.avgResponseTimeMs)}
              </span>
            </div>
            <div style={keyValueCardStyle}>
              <strong>Session score</strong>
              <span>{formatScoreLabel(summary.sessionScore)}</span>
            </div>
          </div>

          {recentResults.length > 0 ? (
            <div style={{ display: "grid", gap: "10px" }}>
              <h3 style={{ ...sectionTitleStyle, fontSize: "18px" }}>
                Recent answers
              </h3>
              <div style={{ display: "grid", gap: "10px" }}>
                {recentResults.map((result) => (
                  <div key={result.answeredAt} style={keyValueCardStyle}>
                    <strong>
                      Question {result.question.questionIndex + 1}
                    </strong>
                    <span>
                      Correct:{" "}
                      {formatIntervalName(result.question.distanceSemitones)}
                    </span>
                    <span>
                      Answered:{" "}
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
                        Results saved automatically. Session ID:{" "}
                        <code>{saveResult.sessionId}</code>
                      </div>
                      <div style={navRowStyle}>
                        <Link
                          href={`/sessions/${saveResult.sessionId}`}
                          style={navLinkStyle}
                        >
                          Open session detail
                        </Link>
                        <Link href="/stats" style={navLinkStyle}>
                          Go to stats
                        </Link>
                      </div>
                    </div>
                  ) : saveResult ? (
                    <div style={{ display: "grid", gap: "6px" }}>
                      <div>{saveFailureMessage}</div>
                      <div style={subtleTextStyle}>
                        Details: {saveResult.code} / {saveResult.message}
                      </div>
                    </div>
                  ) : canSaveResult ? (
                    <div>
                      {isSavePending
                        ? "Saving result automatically..."
                        : "Preparing automatic save..."}
                    </div>
                  ) : (
                    <div>
                      This result could not be saved because the session data
                      was incomplete.
                    </div>
                  )}
                </div>

                {saveResult && !saveResult.ok && canSaveResult ? (
                  <button
                    type="button"
                    disabled={isSavePending}
                    onClick={handleSaveResults}
                    style={buttonStyle("primary", isSavePending)}
                  >
                    {isSavePending ? "Retrying..." : "Retry save"}
                  </button>
                ) : null}
              </>
            ) : null
          ) : (
            <div style={noticeStyle("info")}>
              Guest session only. This result is not saved.
            </div>
          )}

          {finishReason === "time_up" ? (
            <div style={noticeStyle("info")}>
              Session ended because time ran out. Any unanswered question in
              progress was discarded.
            </div>
          ) : null}

          {cannotSaveBecauseNoAnswers ? (
            <div style={noticeStyle("info")}>
              No answered questions were recorded, so this session cannot be
              saved. Try starting a new session with more time.
            </div>
          ) : null}

          <button type="button" onClick={handleReset} style={buttonStyle()}>
            {cannotSaveBecauseNoAnswers ? "Start a new session" : "Start over"}
          </button>
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
      return "Playing base tone...";
    case "target":
      return "Playing target tone...";
    default:
      return "Playing base tone then target tone...";
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
    return "Your sign-in session is no longer available. Please sign in again and retry.";
  }

  if (result.code === "INVALID_INPUT") {
    return "This result could not be saved because the session data was incomplete.";
  }

  return "We couldn't save this result. Please try again.";
}

const answerButtonGridStyle = {
  display: "grid",
  gap: "8px",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
};

const feedbackIntervalGridStyle = {
  display: "grid",
  gap: "10px",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
