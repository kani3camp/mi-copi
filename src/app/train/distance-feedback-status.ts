import { getTrainingAnswerFeedbackKind } from "../../features/training/model/feedback.ts";

export interface DistanceFeedbackStatus {
  label: "完全一致" | "惜しい" | "ずれあり";
  tone: "brand" | "amber" | "coral";
}

export function getDistanceFeedbackStatus(
  errorSemitones: number,
): DistanceFeedbackStatus {
  switch (getTrainingAnswerFeedbackKind(errorSemitones)) {
    case "correct":
      return {
        label: "完全一致",
        tone: "brand",
      };
    case "close":
      return {
        label: "惜しい",
        tone: "amber",
      };
    default:
      return {
        label: "ずれあり",
        tone: "coral",
      };
  }
}
