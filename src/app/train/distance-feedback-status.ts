export interface DistanceFeedbackStatus {
  label: "完全一致" | "惜しい" | "ずれあり";
  tone: "brand" | "amber" | "coral";
}

export function getDistanceFeedbackStatus(params: {
  isCorrect: boolean;
  errorSemitones: number;
}): DistanceFeedbackStatus {
  if (params.isCorrect) {
    return {
      label: "完全一致",
      tone: "brand",
    };
  }

  if (Math.abs(params.errorSemitones) === 1) {
    return {
      label: "惜しい",
      tone: "amber",
    };
  }

  return {
    label: "ずれあり",
    tone: "coral",
  };
}
