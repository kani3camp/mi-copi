import type { MutableRefObject } from "react";

import { MAX_MASTER_VOLUME } from "../../features/settings/model/global-user-settings.ts";
import type { TrainingAnswerFeedbackKind } from "../../features/training/model/feedback.ts";
import { getFrequencyFromMidi } from "../../features/training/model/pitch.ts";
import type { Question } from "../../features/training/model/types.ts";

export type PlaybackKind = "question" | "base" | "target";

export const AUDIO_TRANSPOSE_SEMITONES = 12;
export const AUDIO_TRANSPOSE_MULTIPLIER = 2 ** (AUDIO_TRANSPOSE_SEMITONES / 12);
export const AUDIO_MASTER_VOLUME_BOOST = 1.5;

const NOTE_DURATION_SECONDS = 0.35;
const FEEDBACK_EFFECT_DURATION_SECONDS = 0.08;
/** 正解時ピンポン効果: 1音目の長さ（秒） */
const CORRECT_EFFECT_FIRST_DURATION_SECONDS = 0.06;
/** 正解時ピンポン効果: 1音目と2音目の間隔（ミリ秒） */
const CORRECT_EFFECT_GAP_MS = 40;
/** 正解時ピンポン効果: 2音目の長さ（秒） */
const CORRECT_EFFECT_SECOND_DURATION_SECONDS = 0.07;
/** 正解時2音目の周波数（1音目1760Hzの完全5度上 = 2640Hz） */
const CORRECT_EFFECT_SECOND_FREQUENCY = 2640;
/** 惜しい時: 1音目の長さ（秒） */
const CLOSE_EFFECT_FIRST_DURATION_SECONDS = 0.05;
/** 惜しい時: 1音目と2音目の間隔（ミリ秒） */
const CLOSE_EFFECT_GAP_MS = 30;
/** 惜しい時: 2音目の長さ（秒） */
const CLOSE_EFFECT_SECOND_DURATION_SECONDS = 0.06;
/** 惜しい時: 1音目の周波数（中高域） */
const CLOSE_EFFECT_FIRST_FREQUENCY = 1320;
/** 惜しい時: 2音目の周波数（1音目の半音下） */
const CLOSE_EFFECT_SECOND_FREQUENCY = 1244.5079348883237;
const QUESTION_NOTE_GAP_MS = 140;

interface FeedbackEffectStep {
  durationSeconds: number;
  frequency: number;
  gapAfterMs?: number;
}

const FEEDBACK_EFFECT_PATTERNS: Record<
  TrainingAnswerFeedbackKind,
  readonly FeedbackEffectStep[]
> = {
  correct: [
    {
      durationSeconds: CORRECT_EFFECT_FIRST_DURATION_SECONDS,
      frequency: 1760,
      gapAfterMs: CORRECT_EFFECT_GAP_MS,
    },
    {
      durationSeconds: CORRECT_EFFECT_SECOND_DURATION_SECONDS,
      frequency: CORRECT_EFFECT_SECOND_FREQUENCY,
    },
  ],
  close: [
    {
      durationSeconds: CLOSE_EFFECT_FIRST_DURATION_SECONDS,
      frequency: CLOSE_EFFECT_FIRST_FREQUENCY,
      gapAfterMs: CLOSE_EFFECT_GAP_MS,
    },
    {
      durationSeconds: CLOSE_EFFECT_SECOND_DURATION_SECONDS,
      frequency: CLOSE_EFFECT_SECOND_FREQUENCY,
    },
  ],
  incorrect: [
    {
      durationSeconds: FEEDBACK_EFFECT_DURATION_SECONDS,
      frequency: 440,
    },
  ],
};

export function getQuestionPlaybackDurationMs(
  playbackKind: PlaybackKind,
): number {
  const noteDurationMs = NOTE_DURATION_SECONDS * 1000;

  if (playbackKind === "question") {
    return noteDurationMs * 2 + QUESTION_NOTE_GAP_MS;
  }

  return noteDurationMs;
}

export async function playQuestionAudio(
  question: Question,
  playbackKind: PlaybackKind,
  audioContextRef: MutableRefObject<AudioContext | null>,
  masterVolume: number,
  playbackLockRef: MutableRefObject<boolean>,
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
    await wait(QUESTION_NOTE_GAP_MS);
    await playNote(audioContext, question.targetMidi, masterVolume);
  });
}

export async function playFeedbackEffect(
  audioContextRef: MutableRefObject<AudioContext | null>,
  masterVolume: number,
  soundEffectsEnabled: boolean,
  feedbackKind: TrainingAnswerFeedbackKind,
  playbackLockRef: MutableRefObject<boolean>,
): Promise<void> {
  if (!soundEffectsEnabled || typeof window === "undefined") {
    return;
  }

  await runGuardedPlayback(playbackLockRef, async () => {
    const audioContext = await getAudioContext(audioContextRef);
    const effectVolume = Math.max(
      12,
      Math.round(getBoostedPlaybackMasterVolume(masterVolume) * 0.5),
    );

    for (const step of getFeedbackEffectPattern(feedbackKind)) {
      await playTone(
        audioContext,
        step.frequency,
        step.durationSeconds,
        effectVolume,
      );

      if (step.gapAfterMs) {
        await wait(step.gapAfterMs);
      }
    }
  });
}

export function getPlaybackFrequencyFromMidi(midi: number): number {
  return transposeFrequency(getFrequencyFromMidi(midi));
}

export function getFeedbackEffectPattern(
  feedbackKind: TrainingAnswerFeedbackKind,
): readonly FeedbackEffectStep[] {
  return FEEDBACK_EFFECT_PATTERNS[feedbackKind];
}

export function clampPlaybackMasterVolume(masterVolume: number): number {
  return Math.min(MAX_MASTER_VOLUME, Math.max(0, masterVolume));
}

export function getBoostedPlaybackMasterVolume(masterVolume: number): number {
  return clampPlaybackMasterVolume(masterVolume) * AUDIO_MASTER_VOLUME_BOOST;
}

export function transposeFrequency(
  frequency: number,
  semitones: number = AUDIO_TRANSPOSE_SEMITONES,
): number {
  return frequency * 2 ** (semitones / 12);
}

async function getAudioContext(
  audioContextRef: MutableRefObject<AudioContext | null>,
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
  await playTone(
    audioContext,
    getPlaybackFrequencyFromMidi(midi),
    NOTE_DURATION_SECONDS,
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
      (getBoostedPlaybackMasterVolume(masterVolume) / 100) * 0.15,
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

async function runGuardedPlayback(
  playbackLockRef: MutableRefObject<boolean>,
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
