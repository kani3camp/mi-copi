import type { QuestionDirection } from "../../features/training/model/types";

export const DISTANCE_FEEDBACK_SCALE_MAX_SEMITONES = 12;

export interface DistanceFeedbackDiagramStep {
  distance: number;
  label: string;
  tone: "idle" | "neutral" | "success" | "teal";
}

export function buildDistanceFeedbackDiagramSteps(params: {
  direction: QuestionDirection;
  correctSemitones: number;
  answeredSemitones: number;
}): DistanceFeedbackDiagramStep[] {
  const maxDistance = DISTANCE_FEEDBACK_SCALE_MAX_SEMITONES;
  const clampedCorrect = Math.min(
    maxDistance,
    Math.abs(params.correctSemitones),
  );
  const clampedAnswered = Math.min(
    maxDistance,
    Math.abs(params.answeredSemitones),
  );
  const distances = Array.from(
    { length: maxDistance + 1 },
    (_, index) => index,
  );
  const orderedDistances =
    params.direction === "down" ? [...distances].reverse() : distances;

  return orderedDistances.map((distance) => ({
    distance,
    label:
      distance === 0
        ? "0"
        : `${params.direction === "down" ? "-" : "+"}${distance}`,
    tone:
      distance === 0
        ? "neutral"
        : distance === clampedCorrect
          ? "success"
          : distance === clampedAnswered
            ? "teal"
            : "idle",
  }));
}
