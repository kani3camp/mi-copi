"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import type {
  DistanceTrainingConfig,
  Question,
} from "../../../features/training/model/types";
import {
  buildDistanceGuestSummary,
  createDefaultDistanceTrainingConfig,
  evaluateDistanceAnswer,
  generateDistanceQuestion,
  getDistanceAnswerChoices,
  getDistanceQuestionCount,
  getNoteFrequency,
  type DistanceGuestResult,
  validateDistanceTrainingConfig,
} from "../../../features/training/model/distance-guest";

type DistanceTrainPhase =
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

export default function DistanceTrainPage() {
  const [config, setConfig] = useState<DistanceTrainingConfig>(
    createDefaultDistanceTrainingConfig(),
  );
  const [phase, setPhase] = useState<DistanceTrainPhase>("config");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<ActiveQuestionState | null>(null);
  const [results, setResults] = useState<DistanceGuestResult[]>([]);
  const [feedbackResult, setFeedbackResult] = useState<DistanceGuestResult | null>(null);
  const [lastAnsweredWasFinal, setLastAnsweredWasFinal] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const playbackIdRef = useRef(0);
  const playedNonceRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const plannedQuestionCount = getDistanceQuestionCount(config);
  const answerChoices = useMemo(() => getDistanceAnswerChoices(config), [config]);

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

  const summary = useMemo(() => buildDistanceGuestSummary(results), [results]);

  function handleStart() {
    const validationError = validateDistanceTrainingConfig(config);

    if (validationError) {
      setConfigError(validationError);
      return;
    }

    const nextStartedAt = new Date().toISOString();

    setConfigError(null);
    setAudioError(null);
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
          <h1 style={{ margin: 0 }}>Distance Train</h1>
          <span>guest vertical slice</span>
        </div>
        <p style={{ margin: 0 }}>
          設定 → 出題 → 回答 → フィードバック → 結果までを guest で最後まで通せる最小実装です。
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/">Back home</Link>
          <Link href="/auth-test">Auth test</Link>
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
          <strong>Guest mode:</strong> results stay in client state and are not saved.
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
                  directionMode: event.target.value as DistanceTrainingConfig["directionMode"],
                }))
              }
            >
              <option value="mixed">mixed</option>
              <option value="up_only">up_only</option>
            </select>
          </label>

          <div>
            <strong>Candidate answers:</strong> {answerChoices.join(", ")}
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
            Hear the base tone and target tone, then answer the interval distance in semitones.
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
            <strong>Correct distance:</strong> {feedbackResult.question.distanceSemitones}
          </div>
          <div>
            <strong>Your answer:</strong> {feedbackResult.answeredDistanceSemitones}
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
          <div>Guest session only. Nothing is saved.</div>
          <button type="button" onClick={handleReset}>
            Start over
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
