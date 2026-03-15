import assert from "node:assert/strict";
import test from "node:test";

const {
  AUDIO_MASTER_VOLUME_BOOST,
  AUDIO_TRANSPOSE_MULTIPLIER,
  AUDIO_TRANSPOSE_SEMITONES,
  clampPlaybackMasterVolume,
  getBoostedPlaybackMasterVolume,
  getFeedbackEffectFrequency,
  getQuestionPlaybackDurationMs,
  getPlaybackFrequencyFromMidi,
  transposeFrequency,
} = await import(new URL("./audio-playback.ts", import.meta.url).href);
const { getFrequencyFromMidi } = await import(
  new URL("../../features/training/model/pitch.ts", import.meta.url).href
);

test("playback note frequencies are transposed by one octave", () => {
  const original = getFrequencyFromMidi(60);
  const transposed = getPlaybackFrequencyFromMidi(60);

  assert.equal(AUDIO_TRANSPOSE_SEMITONES, 12);
  assert.equal(AUDIO_TRANSPOSE_MULTIPLIER, 2);
  assert.equal(Number((transposed / original).toFixed(6)), 2);
});

test("feedback effect frequencies are also transposed by one octave", () => {
  assert.equal(getFeedbackEffectFrequency(true), 1760);
  assert.equal(getFeedbackEffectFrequency(false), 440);
});

test("question playback durations match the intended note sequence timing", () => {
  assert.equal(getQuestionPlaybackDurationMs("base"), 350);
  assert.equal(getQuestionPlaybackDurationMs("target"), 350);
  assert.equal(getQuestionPlaybackDurationMs("question"), 840);
});

test("transposeFrequency only changes playback values, not midi semantics", () => {
  assert.equal(transposeFrequency(330), 660);
  assert.equal(transposeFrequency(330, 0), 330);
});

test("playback master volume clamp keeps the UI scale at 0-100", () => {
  assert.equal(clampPlaybackMasterVolume(-10), 0);
  assert.equal(clampPlaybackMasterVolume(80), 80);
  assert.equal(clampPlaybackMasterVolume(180), 100);
});

test("playback uses an internal boost while keeping the UI capped at 100", () => {
  assert.equal(AUDIO_MASTER_VOLUME_BOOST, 1.5);
  assert.equal(getBoostedPlaybackMasterVolume(100), 150);
  assert.equal(getBoostedPlaybackMasterVolume(50), 75);
});
