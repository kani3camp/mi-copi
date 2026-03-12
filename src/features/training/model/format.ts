import type { TrainingMode } from "./types";

export function formatDateTimeLabel(value: string): string {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

export function formatDateLabel(value: string): string {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsedDate);
}

export function formatScoreLabel(value: number | string): string {
  return Math.round(Number(value)).toString();
}

export function formatAccuracyLabel(value: number | string): string {
  return `${Math.round(Number(value) * 100)}%`;
}

export function formatAvgErrorLabel(value: number | string): string {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return String(value);
  }

  const rounded = Math.round(parsed * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
}

export function formatResponseTimeMsLabel(value: number | string): string {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return `${value} ms`;
  }

  return `${Math.round(parsed)} ms`;
}

export function formatDurationSecondsLabel(value: number | string): string {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return `${value} 秒`;
  }

  const totalSeconds = Math.max(0, Math.round(parsed));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds} 秒`;
  }

  if (seconds === 0) {
    return `${minutes} 分`;
  }

  return `${minutes} 分 ${seconds} 秒`;
}

export function formatTrainingModeLabel(value: TrainingMode): string {
  if (value === "distance") {
    return "Distance";
  }

  return "Keyboard";
}
