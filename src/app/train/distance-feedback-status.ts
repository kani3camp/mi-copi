import { getTrainingAnswerFeedbackKind } from "../../features/training/model/feedback.ts";

export interface DistanceFeedbackStatus {
  label: "正解" | "惜しい" | "不正解";
  tone: "success" | "warning" | "error";
}

export function getDistanceFeedbackStatus(
  errorSemitones: number,
): DistanceFeedbackStatus {
  switch (getTrainingAnswerFeedbackKind(errorSemitones)) {
    case "correct":
      return {
        label: "正解",
        tone: "success",
      };
    case "close":
      return {
        label: "惜しい",
        tone: "warning",
      };
    default:
      return {
        label: "不正解",
        tone: "error",
      };
  }
}
