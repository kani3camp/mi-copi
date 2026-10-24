import assert from "node:assert/strict";
import { type TestContext, test } from "node:test";

const {
  getPlaybackFrequencyFromMidi,
  playFeedbackEffect,
  playFeedbackNote,
  playQuestionAudio,
} = await import(new URL("./audio-playback.ts", import.meta.url).href);

const question = {
  questionIndex: 0,
  direction: "up" as const,
  baseNote: "C" as const,
  baseMidi: 60,
  targetNote: "G" as const,
  targetMidi: 67,
  distanceSemitones: 7,
  notationStyle: "sharp" as const,
};

function mockAudio(t: TestContext) {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const oscillators: Array<{
    type: string;
    frequency: { value: number };
    onended: () => void;
    start: (at: number) => void;
    stop: (at?: number) => void;
    stopCount: number;
    connect: () => void;
    disconnect: () => void;
  }> = [];
  const peaks: number[] = [];
  let resumes = 0;
  const context = {
    state: "suspended" as AudioContextState,
    currentTime: 0,
    destination: {},
    resume: async () => {
      resumes++;
      context.state = "running";
    },
    createOscillator: () => {
      const oscillator = {
        type: "",
        frequency: { value: 0 },
        onended: () => {},
        start: t.mock.fn(),
        stopCount: 0,
        stop: () => {
          oscillator.stopCount++;
        },
        connect: t.mock.fn(),
        disconnect: t.mock.fn(),
      };
      oscillators.push(oscillator);
      return oscillator;
    },
    createGain: () => ({
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: (value: number) => peaks.push(value),
      },
      connect: () => {},
      disconnect: () => {},
    }),
  };
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      AudioContext: class {
        get state() {
          return context.state;
        }
        currentTime = context.currentTime;
        destination = context.destination;
        resume = () => context.resume();
        createOscillator = context.createOscillator;
        createGain = context.createGain;
      },
    },
  });
  t.after(() => {
    if (previousWindow)
      Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  });
  return {
    context,
    oscillators,
    peaks,
    get resumes() {
      return resumes;
    },
    contextRef: { current: null as AudioContext | null },
    lock: { current: false },
  };
}

async function flushAudio() {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}

test("feedback note resumes mobile audio synchronously and reuses pitch, timbre and volume", async (t) => {
  const audio = mockAudio(t);
  const playback = playFeedbackNote(
    61,
    audio.contextRef,
    40,
    audio.lock,
    new AbortController().signal,
  );
  assert.equal(audio.resumes, 1);
  assert.equal(audio.lock.current, true);
  await flushAudio();
  const oscillator = audio.oscillators[0];
  assert.equal(oscillator.frequency.value, getPlaybackFrequencyFromMidi(61));
  assert.equal(oscillator.type, "sine");
  assert.equal(audio.peaks[0], 0.09);
  oscillator.onended();
  assert.equal(await playback, true);
  assert.equal(audio.lock.current, false);
});

test("audition, replay buttons and feedback effects share one lock with no queued taps", async (t) => {
  const audio = mockAudio(t);
  const controller = new AbortController();
  const playback = playFeedbackNote(
    63,
    audio.contextRef,
    40,
    audio.lock,
    controller.signal,
  );
  assert.equal(
    await playFeedbackNote(
      66,
      audio.contextRef,
      40,
      audio.lock,
      controller.signal,
    ),
    false,
  );
  for (const kind of ["base", "target"] as const) {
    assert.equal(
      await playQuestionAudio(question, kind, audio.contextRef, 40, audio.lock),
      false,
    );
  }
  await playFeedbackEffect(audio.contextRef, 40, true, "incorrect", audio.lock);
  await flushAudio();
  assert.equal(audio.oscillators.length, 1);
  controller.abort();
  await playback;
  const replay = playQuestionAudio(
    question,
    "base",
    audio.contextRef,
    40,
    audio.lock,
  );
  assert.equal(
    await playFeedbackNote(
      66,
      audio.contextRef,
      40,
      audio.lock,
      new AbortController().signal,
    ),
    false,
  );
  await flushAudio();
  assert.equal(audio.oscillators.length, 2);
  audio.oscillators[1].onended();
  await replay;
});

test("cancelling an audition stops its oscillator and cannot unlock next-question playback", async (t) => {
  const audio = mockAudio(t);
  const controller = new AbortController();
  const playback = playFeedbackNote(
    61,
    audio.contextRef,
    40,
    audio.lock,
    controller.signal,
  );
  await flushAudio();
  controller.abort();
  assert.equal(audio.lock.current, false);
  assert.equal(audio.oscillators[0].stopCount, 2);
  const next = playQuestionAudio(
    question,
    "target",
    audio.contextRef,
    40,
    audio.lock,
  );
  await playback;
  audio.oscillators[0].onended();
  assert.equal(audio.lock.current, true);
  await flushAudio();
  audio.oscillators[1].onended();
  await next;
  assert.equal(audio.lock.current, false);
});

test("cancelling a pending mobile resume releases the lock and never plays the stale note", async (t) => {
  const audio = mockAudio(t);
  let finishResume = () => {};
  audio.context.resume = () =>
    new Promise<void>((resolve) => {
      finishResume = resolve;
    });
  const controller = new AbortController();
  const playback = playFeedbackNote(
    61,
    audio.contextRef,
    40,
    audio.lock,
    controller.signal,
  );
  controller.abort();
  assert.equal(audio.lock.current, false);
  audio.context.state = "running";
  const next = playQuestionAudio(
    question,
    "target",
    audio.contextRef,
    40,
    audio.lock,
  );
  finishResume();
  await playback;
  assert.equal(audio.oscillators.length, 1);
  assert.equal(
    audio.oscillators[0].frequency.value,
    getPlaybackFrequencyFromMidi(67),
  );
  assert.equal(audio.lock.current, true);
  audio.oscillators[0].onended();
  await next;
});

test("failed audio resume releases the lock so a later audition can recover", async (t) => {
  const audio = mockAudio(t);
  audio.context.resume = async () => {
    throw new Error("blocked");
  };
  await assert.rejects(
    playFeedbackNote(
      61,
      audio.contextRef,
      40,
      audio.lock,
      new AbortController().signal,
    ),
    /blocked/,
  );
  assert.equal(audio.lock.current, false);
  audio.context.state = "running";
  const playback = playFeedbackNote(
    66,
    audio.contextRef,
    40,
    audio.lock,
    new AbortController().signal,
  );
  await flushAudio();
  audio.oscillators[0].onended();
  await playback;
  assert.equal(audio.lock.current, false);
});
