export interface DistanceFeedbackDiagramAnnotation {
  distance: number;
  label: "正解" | "解答";
  tone: "success" | "teal";
}

export function buildDistanceFeedbackDiagramAnnotations(params: {
  correctSemitones: number;
  answeredSemitones: number;
}): DistanceFeedbackDiagramAnnotation[] {
  const annotations: DistanceFeedbackDiagramAnnotation[] = [
    {
      distance: Math.abs(params.correctSemitones),
      label: "正解",
      tone: "success",
    },
    {
      distance: Math.abs(params.answeredSemitones),
      label: "解答",
      tone: "teal",
    },
  ];

  return annotations.sort((left, right) => {
    if (left.distance !== right.distance) {
      return left.distance - right.distance;
    }

    return left.label === "正解" ? -1 : 1;
  });
}
