import type { IntervalNotationStyle } from "../../settings/model/global-user-settings";
import type { DirectionMode, QuestionDirection } from "./types";

const INTERVAL_LABELS: Record<
  number,
  {
    ja: string;
    abbr: string;
  }
> = {
  0: { ja: "完全1度", abbr: "P1" },
  1: { ja: "短2度", abbr: "m2" },
  2: { ja: "長2度", abbr: "M2" },
  3: { ja: "短3度", abbr: "m3" },
  4: { ja: "長3度", abbr: "M3" },
  5: { ja: "完全4度", abbr: "P4" },
  6: { ja: "増4度 / 減5度", abbr: "A4 / d5" },
  7: { ja: "完全5度", abbr: "P5" },
  8: { ja: "短6度", abbr: "m6" },
  9: { ja: "長6度", abbr: "M6" },
  10: { ja: "短7度", abbr: "m7" },
  11: { ja: "長7度", abbr: "M7" },
  12: { ja: "完全8度", abbr: "P8" },
};

export function getIntervalLabel(
  semitones: number,
  style: IntervalNotationStyle,
): string {
  const entry = INTERVAL_LABELS[semitones];

  if (!entry) {
    return `${semitones}半音`;
  }

  if (style === "ja") {
    return entry.ja;
  }

  if (style === "abbr") {
    return entry.abbr;
  }

  return `${entry.ja} (${entry.abbr})`;
}

export function formatSignedSemitoneLabel(value: number): string {
  if (value === 0) {
    return "0半音（ぴったり）";
  }

  const absolute = Math.abs(value);
  const magnitude = Number.isInteger(absolute)
    ? absolute.toString()
    : absolute.toFixed(1);
  const direction = value > 0 ? "高い" : "低い";

  return `${value > 0 ? "+" : "-"}${magnitude}半音（${direction}）`;
}

export function formatPitchComparisonSemitoneLabel(params: {
  targetMidi: number;
  answerMidi: number;
}): string {
  const difference = params.answerMidi - params.targetMidi;

  if (difference === 0) {
    return "0半音（ぴったり）";
  }

  const absolute = Math.abs(difference);
  const magnitude = Number.isInteger(absolute)
    ? absolute.toString()
    : absolute.toFixed(1);
  const relation = difference > 0 ? "高い" : "低い";

  return `${difference > 0 ? "+" : "-"}${magnitude}半音（${relation}）`;
}

export function formatQuestionDirectionLabel(
  direction: QuestionDirection,
): string {
  return direction === "up" ? "上方向" : "下方向";
}

export function formatDirectionModeLabel(mode: DirectionMode): string {
  return mode === "up_only" ? "上方向のみ" : "上下";
}
