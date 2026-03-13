export interface DistanceFeedbackDiagramAnnotation {
  distance: number;
  label: "正解" | "回答音" | "基準音";
  tone: "success" | "teal" | "neutral";
}

const ANNOTATION_ORDER: Record<
  DistanceFeedbackDiagramAnnotation["label"],
  number
> = {
  基準音: 0,
  正解: 1,
  回答音: 2,
};

export function buildDistanceFeedbackDiagramAnnotations(params: {
  correctSemitones: number;
  answeredSemitones: number;
}): DistanceFeedbackDiagramAnnotation[] {
  const annotations: DistanceFeedbackDiagramAnnotation[] = [
    { distance: 0, label: "基準音", tone: "neutral" },
    {
      distance: Math.abs(params.correctSemitones),
      label: "正解",
      tone: "success",
    },
    {
      distance: Math.abs(params.answeredSemitones),
      label: "回答音",
      tone: "teal",
    },
  ];

  return annotations.sort((left, right) => {
    if (left.distance !== right.distance) {
      return left.distance - right.distance;
    }
    return ANNOTATION_ORDER[left.label] - ANNOTATION_ORDER[right.label];
  });
}
