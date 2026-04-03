export type TrainingAnswerFeedbackKind = "correct" | "close" | "incorrect";

export function getTrainingAnswerFeedbackKind(
  errorSemitones: number,
): TrainingAnswerFeedbackKind {
  const absError = Math.abs(errorSemitones);

  if (absError === 0) {
    return "correct";
  }

  if (absError === 1) {
    return "close";
  }

  return "incorrect";
}
