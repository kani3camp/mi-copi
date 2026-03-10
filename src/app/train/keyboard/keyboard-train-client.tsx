"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  buildKeyboardGuestSummary,
  createDefaultKeyboardTrainingConfig,
  evaluateKeyboardAnswer,
  generateKeyboardQuestion,
  getKeyboardAnswerChoices,
  buildKeyboardGuestSaveInput,
  getKeyboardQuestionCount,
  getNoteFrequency,
  type KeyboardGuestResult,
  validateKeyboardTrainingConfig,
} from "../../../features/training/model/keyboard-guest";
import type {
  KeyboardTrainingConfig,
  NoteClass,
  Question,
} from "../../../features/training/model/types";
import type { SaveTrainingSessionResult } from "../../../features/training/server/saveTrainingSession";

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
  saveResultsAction: (
    input: Parameters<typeof buildKeyboardGuestSaveInput>[0],
  ) => Promise<SaveTrainingSessionResult>;
}

export function KeyboardTrainClient({
  isAuthenticated,
  saveResultsAction,
}: KeyboardTrainClientProps) {
  const [config, setConfig] = useState<KeyboardTrainingConfig>(
    createDefaultKeyboardTrainingConfig(),
  );
  const [phase, setPhase] = useState<KeyboardTrainPhase>("config");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<ActiveQuestionState | null>(null);
  const [results, setResults] = useState<KeyboardGuestResult[]>([]);
  const [feedbackResult, setFeedbackResult] = useState<KeyboardGuestResult | null>(null);
  const [lastAnsweredWasFinal, setLastAnsweredWasFinal] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<SaveTrainingSessionResult | null>(null);
  const [isSavePending, startSaveTransition] = useTransition();
  const playbackIdRef = useRef(0);
  const playedNonceRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const plannedQuestionCount = getKeyboardQuestionCount(config);
  const answerChoices = useMemo(() => getKeyboardAnswerChoices(), []);
  const summary = useMemo(() => buildKeyboardGuestSummary(results), [results]);

  useEffect(() => {
    if (phase !== "playing" || !activeQuestion) {
      return;
    }

    if (playedNonceRef.current === activeQuestion.playNonce) {
      return;
    }

    playedNonceRef.current = activeQuestion.playNonce;
    let cancelled = false;

    void playQuestionAudio(activeQuestion.question, audioContextRef)
      .catch(() => {
        if (!cancelled) {
          setAudioError("Audio playback failed. You can still answer and continue.");
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
  }, [activeQuestion, phase]);

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
    setStartedAt(nextStartedAt);
    setResults([]);
    setFeedbackResult(null);
    setLastAnsweredWasFinal(false);
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
    setLastAnsweredWasFinal(updatedCount >= plannedQuestionCount);
    setPhase("feedback");
  }

  function handleContinue() {
    if (!feedbackResult || !activeQuestion) {
      return;
    }

    if (lastAnsweredWasFinal) {
      setActiveQuestion(null);
      setPhase("result");
      return;
    }

    setFeedbackResult(null);
    setActiveQuestion(
      createActiveQuestion(config, activeQuestion.question.questionIndex + 1, playbackIdRef),
    );
    setPhase("playing");
  }

  function handleReset() {
    setPhase("config");
    setStartedAt(null);
    setActiveQuestion(null);
    setResults([]);
    setFeedbackResult(null);
    setLastAnsweredWasFinal(false);
    setConfigError(null);
    setAudioError(null);
    setSaveResult(null);
  }

  function handleSaveResults() {
    if (!startedAt || results.length === 0 || saveResult?.ok) {
      return;
    }

    startSaveTransition(async () => {
      const result = await saveResultsAction({
        config,
        startedAt,
        results,
      });
      setSaveResult(result);
    });
  }

  return (
    <main
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "40px 20px",
        display: "grid",
        gap: "24px",
      }}
    >
      <header style={{ display: "grid", gap: "8px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <h1 style={{ margin: 0 }}>Keyboard Train</h1>
          <span>guest vertical slice</span>
        </div>
        <p style={{ margin: 0 }}>
          設定 → 出題 → 回答 → フィードバック → 結果までを keyboard モードで通せる最小実装です。
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/">Back home</Link>
          <Link href="/train/distance">Distance mode</Link>
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gap: "12px",
          padding: "16px",
          border: "1px solid #d4d4d8",
          borderRadius: "12px",
        }}
      >
        <div>
          <strong>Phase:</strong> {phase}
        </div>
        {startedAt ? (
          <div>
            <strong>Started at:</strong> {startedAt}
          </div>
        ) : null}
        <div>
          <strong>Persistence:</strong>{" "}
          {isAuthenticated
            ? "You can save from the result screen."
            : "Guest mode keeps results only in client state and does not save."}
        </div>
        {audioError ? <div>{audioError}</div> : null}
      </section>

      {phase === "config" ? (
        <section
          style={{
            display: "grid",
            gap: "16px",
            padding: "16px",
            border: "1px solid #d4d4d8",
            borderRadius: "12px",
          }}
        >
          <h2 style={{ margin: 0 }}>Config</h2>
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

          <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "1fr 1fr" }}>
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
                  directionMode: event.target.value as KeyboardTrainingConfig["directionMode"],
                }))
              }
            >
              <option value="mixed">mixed</option>
              <option value="up_only">up_only</option>
            </select>
          </label>

          <div>
            <strong>Answer choices:</strong> {answerChoices.join(", ")}
          </div>

          {configError ? <div>{configError}</div> : null}

          <div>
            <button type="button" onClick={handleStart}>
              Start
            </button>
          </div>
        </section>
      ) : null}

      {(phase === "playing" || phase === "answering") && activeQuestion ? (
        <section
          style={{
            display: "grid",
            gap: "16px",
            padding: "16px",
            border: "1px solid #d4d4d8",
            borderRadius: "12px",
          }}
        >
          <h2 style={{ margin: 0 }}>Question {activeQuestion.question.questionIndex + 1}</h2>
          <div>
            Hear the base tone and target tone, then answer the target note name.
          </div>
          <div>
            <strong>Direction:</strong> {activeQuestion.question.direction}
          </div>
          <div>
            <strong>Replay count:</strong> {activeQuestion.replayCount}
          </div>

          {phase === "playing" ? <div>Playing question audio...</div> : null}

          {phase === "answering" ? (
            <>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button type="button" onClick={handleReplay}>
                  Replay
                </button>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {answerChoices.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => handleAnswer(choice)}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {phase === "feedback" && feedbackResult ? (
        <section
          style={{
            display: "grid",
            gap: "12px",
            padding: "16px",
            border: "1px solid #d4d4d8",
            borderRadius: "12px",
          }}
        >
          <h2 style={{ margin: 0 }}>Feedback</h2>
          <div>
            <strong>Result:</strong> {feedbackResult.isCorrect ? "Correct" : "Incorrect"}
          </div>
          <div>
            <strong>Correct note:</strong> {feedbackResult.question.targetNote}
          </div>
          <div>
            <strong>Your answer:</strong> {feedbackResult.answeredNote}
          </div>
          <div>
            <strong>Error:</strong> {Math.abs(feedbackResult.errorSemitones)}
          </div>
          <div>
            <strong>Response time:</strong> {feedbackResult.responseTimeMs} ms
          </div>
          <div>
            <strong>Score:</strong> {feedbackResult.score}
          </div>
          <button type="button" onClick={handleContinue}>
            {lastAnsweredWasFinal ? "Show result" : "Next question"}
          </button>
        </section>
      ) : null}

      {phase === "result" ? (
        <section
          style={{
            display: "grid",
            gap: "12px",
            padding: "16px",
            border: "1px solid #d4d4d8",
            borderRadius: "12px",
          }}
        >
          <h2 style={{ margin: 0 }}>Result</h2>
          <div>
            <strong>Questions:</strong> {summary.questionCount}
          </div>
          <div>
            <strong>Correct:</strong> {summary.correctCount}
          </div>
          <div>
            <strong>Accuracy:</strong> {Math.round(summary.accuracyRate * 100)}%
          </div>
          <div>
            <strong>Average error:</strong> {summary.avgErrorAbs}
          </div>
          <div>
            <strong>Average response time:</strong> {summary.avgResponseTimeMs} ms
          </div>
          <div>
            <strong>Session score:</strong> {summary.sessionScore}
          </div>

          {isAuthenticated ? (
            <>
              <button
                type="button"
                disabled={isSavePending || Boolean(saveResult?.ok) || !startedAt || results.length === 0}
                onClick={handleSaveResults}
              >
                {saveResult?.ok
                  ? "Saved"
                  : isSavePending
                    ? "Saving..."
                    : "Save results"}
              </button>
              <pre
                style={{
                  margin: 0,
                  padding: "12px",
                  border: "1px solid #d4d4d8",
                  borderRadius: "8px",
                  overflowX: "auto",
                  background: "#fafafa",
                  fontSize: "12px",
                }}
              >
                {JSON.stringify(
                  saveResult ?? {
                    ok: null,
                    hint: "You are signed in. Save is manual in this slice.",
                  },
                  null,
                  2,
                )}
              </pre>
            </>
          ) : (
            <div>Guest session only. This result is not saved.</div>
          )}

          <button type="button" onClick={handleReset}>
            Start over
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

function nextPlaybackNonce(playbackIdRef: React.MutableRefObject<number>): number {
  playbackIdRef.current += 1;

  return playbackIdRef.current;
}

async function playQuestionAudio(
  question: Question,
  audioContextRef: React.MutableRefObject<AudioContext | null>,
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

  const audioContext =
    audioContextRef.current ?? new AudioContextClass();

  audioContextRef.current = audioContext;

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  await playTone(audioContext, getNoteFrequency(question.baseNote), 0.35);
  await wait(140);
  await playTone(audioContext, getNoteFrequency(question.targetNote), 0.35);
}

function playTone(
  audioContext: AudioContext,
  frequency: number,
  durationSeconds: number,
): Promise<void> {
  return new Promise((resolve) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      now + durationSeconds,
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + durationSeconds);
    oscillator.onended = () => resolve();
  });
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
