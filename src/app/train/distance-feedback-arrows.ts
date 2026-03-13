export interface DistanceFeedbackDiagramArrow {
  columnStart: number;
  columnEnd: number;
  direction: "forward" | "backward";
  lane: "upper" | "lower";
  tone: "success" | "teal";
}

export function buildDistanceFeedbackDiagramArrows(params: {
  stepCount: number;
  correctIndex: number;
  answeredIndex: number;
  baseIndex: number;
}): DistanceFeedbackDiagramArrow[] {
  return [
    createArrow({
      targetIndex: params.correctIndex,
      baseIndex: params.baseIndex,
      tone: "success",
      lane: "upper",
    }),
    createArrow({
      targetIndex: params.answeredIndex,
      baseIndex: params.baseIndex,
      tone: "teal",
      lane: "lower",
    }),
  ];
}

function createArrow(params: {
  targetIndex: number;
  baseIndex: number;
  tone: "success" | "teal";
  lane: "upper" | "lower";
}): DistanceFeedbackDiagramArrow {
  return {
    columnStart: Math.min(params.baseIndex, params.targetIndex) + 1,
    columnEnd: Math.max(params.baseIndex, params.targetIndex) + 2,
    direction: params.baseIndex <= params.targetIndex ? "forward" : "backward",
    lane: params.lane,
    tone: params.tone,
  };
}
