import type { QuestionDirection } from "../../features/training/model/types";
import { buildDistanceFeedbackDiagramAnnotations } from "./distance-feedback-annotations";
import { buildDistanceFeedbackDiagramArrows } from "./distance-feedback-arrows";
import {
  buildDistanceFeedbackDiagramSteps,
  DISTANCE_FEEDBACK_SCALE_MAX_SEMITONES,
} from "./distance-feedback-diagram";

/** Logical coordinate system for SVG viewBox. X: 0..13 (columns), Y: 0..4 (rows). */
export const LAYOUT_VIEWBOX_WIDTH = 13;
export const LAYOUT_VIEWBOX_HEIGHT = 4;

/** Extra top margin so 基準音 label is not clipped (viewBox expansion in renderer). */
export const LAYOUT_VIEWBOX_TOP_PADDING = 0.5;
export const LAYOUT_VIEWBOX_BOTTOM_PADDING = 0.5;
export const LAYOUT_LABEL_SIDE_PADDING = 0.7;

export const LAYOUT_LABEL_ABOVE_Y = 0.55;
export const LAYOUT_ARROW_UPPER_Y = 1.9;
export const LAYOUT_ARROW_LOWER_Y = 2.3;
export const LAYOUT_BASE_MARKER_UPPER_Y = LAYOUT_ARROW_UPPER_Y;
export const LAYOUT_BASE_MARKER_LOWER_Y = LAYOUT_ARROW_LOWER_Y;
export const LAYOUT_LABEL_BELOW_Y = 3.78;

export interface DistanceFeedbackAnnotationPlacement {
  columnIndex: number;
  x: number;
  y: number;
  label: string;
  tone: "success" | "teal" | "neutral";
  stackIndex: number;
}

export interface DistanceFeedbackArrowPlacement {
  x1: number;
  x2: number;
  yLane: number;
  tone: "success" | "teal";
  direction: "forward" | "backward";
}

export interface DistanceFeedbackLayoutResult {
  viewBox: { width: number; height: number };
  columns: number;
  direction: QuestionDirection;
  annotations: DistanceFeedbackAnnotationPlacement[];
  arrows: DistanceFeedbackArrowPlacement[];
  baseMarkerColumnIndex: number;
  baseMarkerYUpper: number;
  baseMarkerYLower: number;
  isExactMatch: boolean;
}

/**
 * Pure layout: given direction and semitones, returns SVG-ready geometry.
 * Uses existing build* helpers; no DOM or CSS.
 */
export function buildDistanceFeedbackLayout(params: {
  direction: QuestionDirection;
  correctSemitones: number;
  answeredSemitones: number;
}): DistanceFeedbackLayoutResult {
  const steps = buildDistanceFeedbackDiagramSteps({
    direction: params.direction,
    correctSemitones: params.correctSemitones,
    answeredSemitones: params.answeredSemitones,
  });
  const annotations = buildDistanceFeedbackDiagramAnnotations({
    correctSemitones: params.correctSemitones,
    answeredSemitones: params.answeredSemitones,
  });
  const clampedCorrect = Math.min(
    DISTANCE_FEEDBACK_SCALE_MAX_SEMITONES,
    Math.abs(params.correctSemitones),
  );
  const clampedAnswered = Math.min(
    DISTANCE_FEEDBACK_SCALE_MAX_SEMITONES,
    Math.abs(params.answeredSemitones),
  );
  const baseIndex = steps.findIndex((s) => s.distance === 0);
  const correctIndex = steps.findIndex((s) => s.distance === clampedCorrect);
  const answeredIndex = steps.findIndex((s) => s.distance === clampedAnswered);
  const arrows = buildDistanceFeedbackDiagramArrows({
    stepCount: steps.length,
    correctIndex,
    answeredIndex,
    baseIndex,
  });

  const isExactMatch = clampedCorrect === clampedAnswered;

  const annotationsAbove: DistanceFeedbackAnnotationPlacement[] = [];
  const annotationsBelow: DistanceFeedbackAnnotationPlacement[] = [];
  const minLabelX = LAYOUT_LABEL_SIDE_PADDING;
  const maxLabelX = LAYOUT_VIEWBOX_WIDTH - LAYOUT_LABEL_SIDE_PADDING;

  for (const a of annotations) {
    const columnIndex = steps.findIndex((s) => s.distance === a.distance);
    if (columnIndex < 0) continue;
    const x = Math.min(Math.max(columnIndex + 0.5, minLabelX), maxLabelX);
    const placement: Omit<DistanceFeedbackAnnotationPlacement, "stackIndex"> = {
      columnIndex,
      x,
      y: a.label === "回答" ? LAYOUT_LABEL_BELOW_Y : LAYOUT_LABEL_ABOVE_Y,
      label: a.label,
      tone: a.tone,
    };
    if (a.label === "回答") {
      annotationsBelow.push({ ...placement, stackIndex: 0 });
    } else {
      const aboveAtColumn = annotationsAbove.filter(
        (x) => x.columnIndex === columnIndex,
      ).length;
      annotationsAbove.push({ ...placement, stackIndex: aboveAtColumn });
    }
  }

  const arrowPlacements: DistanceFeedbackArrowPlacement[] = arrows.map(
    (arr) => ({
      x1: arr.columnStart - 0.5,
      x2: arr.columnEnd - 1.5,
      yLane: arr.lane === "upper" ? LAYOUT_ARROW_UPPER_Y : LAYOUT_ARROW_LOWER_Y,
      tone: arr.tone,
      direction: arr.direction,
    }),
  );

  return {
    viewBox: {
      width: LAYOUT_VIEWBOX_WIDTH,
      height: LAYOUT_VIEWBOX_HEIGHT,
    },
    columns: steps.length,
    direction: params.direction,
    annotations: [...annotationsAbove, ...annotationsBelow],
    arrows: arrowPlacements,
    baseMarkerColumnIndex: baseIndex,
    baseMarkerYUpper: LAYOUT_BASE_MARKER_UPPER_Y,
    baseMarkerYLower: LAYOUT_BASE_MARKER_LOWER_Y,
    isExactMatch,
  };
}
