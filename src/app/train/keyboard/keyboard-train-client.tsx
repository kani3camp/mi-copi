"use client";

import Link from "next/link";
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
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatDateTimeLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
} from "../../../features/training/model/format";
import {
  type buildKeyboardGuestSaveInput,
  buildKeyboardGuestSummary,
  evaluateKeyboardAnswer,
  generateKeyboardQuestion,
  getKeyboardAnswerChoices,
  getKeyboardQuestionCount,
  getNoteFrequency,
  type KeyboardGuestResult,
  validateKeyboardTrainingConfig,
} from "../../../features/training/model/keyboard-guest";
import type {
  KeyboardTrainingConfig,
  NoteClass,
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

type KeyboardTrainPhase =
  | "config"
  | "playing"
  | "answering"
  | "feedback"
  | "result";

interface ActiveQuestionState {
  question: Question;
  presentedAt: string;
  answeringStartedAt: string | null;
  replayCount: number;
  playNonce: number;
}

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
  const playbackIdRef = useRef(0);
  const playedNonceRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionDeadlineAtRef = useRef<number | null>(null);
  const timeoutHandledRef = useRef(false);
  const plannedQuestionCount = getKeyboardQuestionCount(config);
  const [remainingTimeMs, setRemainingTimeMs] = useState<number | null>(null);
  const answerChoices = useMemo(() => getKeyboardAnswerChoices(), []);
  const summary = useMemo(() => buildKeyboardGuestSummary(results), [results]);
  const cannotSaveBecauseNoAnswers = phase === "result" && results.length === 0;
  const saveFailureMessage =
    saveResult && !saveResult.ok ? getSaveFailureMessage(saveResult) : null;

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
      audioContextRef,
      settings.masterVolume,
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

  function handleReplay() {
    if (!activeQuestion) {
      return;
    }

    setActiveQuestion({
      ...activeQuestion,
      replayCount: activeQuestion.replayCount + 1,
      playNonce: nextPlaybackNonce(playbackIdRef),
    });
    setPhase("playing");
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
      replayCount: activeQuestion.replayCount,
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
    );
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
    sessionDeadlineAtRef.current = null;
    timeoutHandledRef.current = false;
    setRemainingTimeMs(null);
  }

  function handleSaveResults() {
    if (
      !startedAt ||
      !endedAt ||
      !finishReason ||
      results.length === 0 ||
      saveResult?.ok
    ) {
      return;
    }

    startSaveTransition(async () => {
      const result = await saveResultsAction({
        config,
        startedAt,
        endedAt,
        finishReason,
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
            Keyboard Train
          </h1>
          <span style={phaseBadgeStyle(phase)}>{phase}</span>
        </div>
        <p style={subtleTextStyle}>
          設定 → 出題 → 回答 → フィードバック → 結果までを keyboard
          モードで通せる最小実装です。
        </p>
        <div style={navRowStyle}>
          <Link href="/" style={navLinkStyle}>
            Back home
          </Link>
          <Link href="/train/distance" style={navLinkStyle}>
            Distance mode
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
            ? "You can save from the result screen."
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
                    .value as KeyboardTrainingConfig["directionMode"],
                }))
              }
            >
              <option value="mixed">mixed</option>
              <option value="up_only">up_only</option>
            </select>
          </label>

          <div>
            <strong>Answer choices:</strong>{" "}
            {settings.keyboardNoteLabelsVisible
              ? answerChoices
                  .map((choice) => formatKeyboardNoteLabel(choice))
                  .join(", ")
              : "Labels are hidden on the keyboard UI."}
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
            Hear the base tone and target tone, then answer the target note
            name.
          </p>
          <div style={keyValueGridStyle}>
            <div style={keyValueCardStyle}>
              <strong>Direction:</strong> {activeQuestion.question.direction}
            </div>
            <div style={keyValueCardStyle}>
              <strong>Replay count:</strong> {activeQuestion.replayCount}
            </div>
          </div>

          {phase === "playing" ? (
            <div style={noticeStyle("info")}>Playing question audio...</div>
          ) : null}

          {phase === "answering" ? (
            <>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleReplay}
                  style={buttonStyle()}
                >
                  Replay
                </button>
              </div>
              <KeyboardAnswerPad
                answerChoices={answerChoices}
                onAnswer={handleAnswer}
                showLabels={settings.keyboardNoteLabelsVisible}
              />
            </>
          ) : null}
        </section>
      ) : null}

      {phase === "feedback" && feedbackResult ? (
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Feedback</h2>
          <div style={keyValueGridStyle}>
            <div style={keyValueCardStyle}>
              <strong>Result:</strong>{" "}
              {feedbackResult.isCorrect ? "Correct" : "Incorrect"}
            </div>
            <div style={keyValueCardStyle}>
              <strong>Correct note:</strong>{" "}
              {feedbackResult.question.targetNote}
            </div>
            <div style={keyValueCardStyle}>
              <strong>Your answer:</strong> {feedbackResult.answeredNote}
            </div>
            <div style={keyValueCardStyle}>
              <strong>Error:</strong> {Math.abs(feedbackResult.errorSemitones)}
            </div>
            <div style={keyValueCardStyle}>
              <strong>Response time:</strong>{" "}
              {formatResponseTimeMsLabel(feedbackResult.responseTimeMs)}
            </div>
            <div style={keyValueCardStyle}>
              <strong>Score:</strong> {formatScoreLabel(feedbackResult.score)}
            </div>
          </div>
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

          {isAuthenticated ? (
            <>
              <button
                type="button"
                disabled={
                  isSavePending ||
                  Boolean(saveResult?.ok) ||
                  !startedAt ||
                  !endedAt ||
                  !finishReason ||
                  results.length === 0
                }
                onClick={handleSaveResults}
                style={buttonStyle(
                  "primary",
                  isSavePending ||
                    Boolean(saveResult?.ok) ||
                    !startedAt ||
                    !endedAt ||
                    !finishReason ||
                    results.length === 0,
                )}
              >
                {saveResult?.ok
                  ? "Saved"
                  : isSavePending
                    ? "Saving..."
                    : "Save results"}
              </button>
              <div
                style={
                  saveResult?.ok
                    ? noticeStyle("success")
                    : saveResult
                      ? noticeStyle("error")
                      : noticeStyle("info")
                }
              >
                {saveResult?.ok ? (
                  <div style={{ display: "grid", gap: "10px" }}>
                    <div>
                      Results saved successfully. Session ID:{" "}
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
                ) : (
                  <div>You are signed in. Save is manual in this slice.</div>
                )}
              </div>
            </>
          ) : (
            <div style={noticeStyle("info")}>
              Guest session only. This result is not saved.
            </div>
          )}

          <button type="button" onClick={handleReset} style={buttonStyle()}>
            {cannotSaveBecauseNoAnswers ? "Start a new session" : "Start over"}
          </button>
        </section>
      ) : null}
    </main>
  );
}

function createActiveQuestion(
  config: KeyboardTrainingConfig,
  questionIndex: number,
  playbackIdRef: React.MutableRefObject<number>,
): ActiveQuestionState {
  return {
    question: generateKeyboardQuestion(config, questionIndex),
    presentedAt: new Date().toISOString(),
    answeringStartedAt: null,
    replayCount: 0,
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
  audioContextRef: React.MutableRefObject<AudioContext | null>,
  masterVolume: number,
): Promise<void> {
  if (typeof window === "undefined") {
    return;
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

  await playTone(
    audioContext,
    getNoteFrequency(question.baseNote),
    0.35,
    masterVolume,
  );
  await wait(140);
  await playTone(
    audioContext,
    getNoteFrequency(question.targetNote),
    0.35,
    masterVolume,
  );
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
): Promise<void> {
  if (!soundEffectsEnabled || typeof window === "undefined") {
    return;
  }

  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  const audioContext = audioContextRef.current ?? new AudioContextClass();
  audioContextRef.current = audioContext;

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  await playTone(
    audioContext,
    isCorrect ? 880 : 220,
    0.08,
    Math.max(12, Math.round(masterVolume * 0.5)),
  );
}

function KeyboardAnswerPad(props: {
  answerChoices: NoteClass[];
  onAnswer: (note: NoteClass) => void;
  showLabels: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: "8px",
        gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
      }}
    >
      {props.answerChoices.map((choice) => (
        <button
          key={choice}
          type="button"
          aria-label={formatKeyboardNoteLabel(choice)}
          onClick={() => props.onAnswer(choice)}
          style={getKeyboardKeyStyle(choice)}
        >
          {props.showLabels ? formatKeyboardNoteLabel(choice) : ""}
        </button>
      ))}
    </div>
  );
}

function getKeyboardKeyStyle(note: NoteClass): CSSProperties {
  const blackKey = isBlackKey(note);

  return {
    minHeight: blackKey ? "84px" : "112px",
    padding: "12px 8px",
    borderRadius: "16px",
    border: blackKey ? "1px solid #111827" : "1px solid #d1d5db",
    background: blackKey
      ? "linear-gradient(180deg, #374151 0%, #111827 100%)"
      : "linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%)",
    color: blackKey ? "#f9fafb" : "#111827",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: blackKey
      ? "0 10px 20px rgba(17, 24, 39, 0.28)"
      : "0 8px 18px rgba(15, 23, 42, 0.08)",
  };
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

function isBlackKey(note: NoteClass): boolean {
  return (
    note === "C#" ||
    note === "D#" ||
    note === "F#" ||
    note === "G#" ||
    note === "A#"
  );
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
