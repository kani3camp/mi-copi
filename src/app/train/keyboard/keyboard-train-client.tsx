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
              {formatKeyboardNoteLabel(feedbackResult.question.targetNote)}
            </div>
            <div style={keyValueCardStyle}>
              <strong>Your answer:</strong>{" "}
              {formatKeyboardNoteLabel(feedbackResult.answeredNote)}
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
          <FeedbackKeyboardView
            answeredNote={feedbackResult.answeredNote}
            correctNote={feedbackResult.question.targetNote}
            isCorrect={feedbackResult.isCorrect}
            showLabels={settings.keyboardNoteLabelsVisible}
          />
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
              interactive: true,
              left,
              position: "absolute",
            })}
          >
            {props.showLabels ? <KeyLabel note={note} compact /> : null}
          </button>
        ))}
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
        <span style={legendItemStyle("#166534", "#dcfce7")}>
          {props.isCorrect ? "Correct key" : "Correct key"}
        </span>
        {props.isCorrect ? null : (
          <span style={legendItemStyle("#9a3412", "#ffedd5")}>Your answer</span>
        )}
      </div>
    </div>
  );
}

function getKeyboardKeyStyle(
  note: NoteClass,
  options: {
    disabled?: boolean;
    highlight?: "idle" | "correct" | "answered" | "both";
    interactive: boolean;
    left?: string;
    position?: "relative" | "absolute";
  },
): CSSProperties {
  const blackKey = isBlackKey(note);
  const highlight = options.highlight ?? "idle";
  const isCorrect = highlight === "correct" || highlight === "both";
  const isAnswered = highlight === "answered";
  const background = blackKey
    ? isCorrect
      ? "linear-gradient(180deg, #34d399 0%, #065f46 100%)"
      : isAnswered
        ? "linear-gradient(180deg, #fb923c 0%, #9a3412 100%)"
        : "linear-gradient(180deg, #374151 0%, #111827 100%)"
    : isCorrect
      ? "linear-gradient(180deg, #ffffff 0%, #dcfce7 100%)"
      : isAnswered
        ? "linear-gradient(180deg, #ffffff 0%, #ffedd5 100%)"
        : "linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%)";
  const border = blackKey
    ? isCorrect
      ? "2px solid #34d399"
      : isAnswered
        ? "2px solid #fdba74"
        : "1px solid #111827"
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
      ? isCorrect
        ? "0 12px 24px rgba(5, 150, 105, 0.34)"
        : isAnswered
          ? "0 12px 24px rgba(234, 88, 12, 0.3)"
          : "0 10px 20px rgba(17, 24, 39, 0.28)"
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
