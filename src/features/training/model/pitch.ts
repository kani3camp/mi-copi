import type { NoteClass, QuestionDirection } from "./types.ts";

export const NOTE_CLASSES: NoteClass[] = [
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

const DEFAULT_BASE_MIDI = 60;
const A4_MIDI = 69;
const A4_FREQUENCY = 440;

export function getBaseMidiForNoteClass(noteClass: NoteClass): number {
  return DEFAULT_BASE_MIDI + NOTE_CLASSES.indexOf(noteClass);
}

export function getNoteClassFromMidi(midi: number): NoteClass {
  const normalizedIndex =
    ((midi % NOTE_CLASSES.length) + NOTE_CLASSES.length) % NOTE_CLASSES.length;

  return NOTE_CLASSES[normalizedIndex];
}

export function getFrequencyFromMidi(midi: number): number {
  return A4_FREQUENCY * 2 ** ((midi - A4_MIDI) / 12);
}

export function getTargetMidi(
  baseMidi: number,
  direction: QuestionDirection,
  distanceSemitones: number,
): number {
  return baseMidi + distanceSemitones * (direction === "up" ? 1 : -1);
}

export function getDirectedDistanceSemitonesFromMidi(
  baseMidi: number,
  answeredMidi: number,
  direction: QuestionDirection,
): number {
  if (direction === "up") {
    return answeredMidi - baseMidi;
  }

  return baseMidi - answeredMidi;
}
