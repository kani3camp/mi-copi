import type { QuestionDirection } from "../../features/training/model/types";

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
  const maxDistance = Math.max(
    0,
    Math.abs(params.correctSemitones),
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
        : distance === Math.abs(params.correctSemitones)
          ? "success"
          : distance === Math.abs(params.answeredSemitones)
            ? "teal"
            : "idle",
  }));
}
