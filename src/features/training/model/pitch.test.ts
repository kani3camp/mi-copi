import assert from "node:assert/strict";
import test from "node:test";

const {
  getBaseMidiForNoteClass,
  getDirectedDistanceSemitonesFromMidi,
  getFrequencyFromMidi,
  getNoteClassFromMidi,
  getTargetMidi,
} = await import(new URL("./pitch.ts", import.meta.url).href);

test("pitch helpers convert between note classes, midi, and frequency", () => {
  assert.equal(getBaseMidiForNoteClass("C"), 60);
  assert.equal(getBaseMidiForNoteClass("A"), 69);
  assert.equal(getNoteClassFromMidi(59), "B");
  assert.equal(getNoteClassFromMidi(72), "C");
  assert.equal(getTargetMidi(60, "down", 1), 59);
  assert.equal(getTargetMidi(60, "up", 12), 72);
  assert.equal(getDirectedDistanceSemitonesFromMidi(60, 59, "down"), 1);
  assert.equal(getDirectedDistanceSemitonesFromMidi(60, 64, "up"), 4);
  assert.equal(Number(getFrequencyFromMidi(69).toFixed(3)), 440);
});
