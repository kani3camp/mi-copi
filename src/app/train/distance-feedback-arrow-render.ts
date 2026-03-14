import type { DistanceFeedbackArrowPlacement } from "./distance-feedback-layout";

const ARROW_HEAD_SIZE = 0.25;
const BASE_MARKER_RADIUS = 0.2;

export interface DistanceFeedbackArrowRenderGeometry {
  headPoints: string;
  lineEndX: number;
  lineStartX: number;
}

export function getDistanceFeedbackArrowRenderGeometry(
  arrow: DistanceFeedbackArrowPlacement,
): DistanceFeedbackArrowRenderGeometry | null {
  if (arrow.x1 === arrow.x2) {
    return null;
  }

  const lineStartX =
    arrow.direction === "forward"
      ? arrow.x1 + BASE_MARKER_RADIUS
      : arrow.x1 + ARROW_HEAD_SIZE;
  const lineEndX =
    arrow.direction === "forward"
      ? arrow.x2 - ARROW_HEAD_SIZE
      : arrow.x2 - BASE_MARKER_RADIUS;
  const headBaseX =
    arrow.direction === "forward"
      ? arrow.x2 - ARROW_HEAD_SIZE
      : arrow.x1 + ARROW_HEAD_SIZE;
  const headPoints =
    arrow.direction === "forward"
      ? `${arrow.x2} ${arrow.yLane} ${headBaseX} ${arrow.yLane - 0.15} ${headBaseX} ${arrow.yLane + 0.15}`
      : `${arrow.x1} ${arrow.yLane} ${headBaseX} ${arrow.yLane - 0.15} ${headBaseX} ${arrow.yLane + 0.15}`;

  return {
    headPoints,
    lineEndX,
    lineStartX,
  };
}
