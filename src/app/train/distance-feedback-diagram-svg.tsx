import type { QuestionDirection } from "../../features/training/model/types";
import { getDistanceFeedbackArrowRenderGeometry } from "./distance-feedback-arrow-render";
import {
  buildDistanceFeedbackLayout,
  LAYOUT_VIEWBOX_BOTTOM_PADDING,
  LAYOUT_VIEWBOX_TOP_PADDING,
} from "./distance-feedback-layout";

const COLORS = {
  success: "#9cdd2b",
  teal: "#2a8f99",
  neutral: "var(--text-secondary)",
} as const;

const BASE_MARKER_RADIUS = 0.2;

function columnCenter(columnIndex: number): number {
  return columnIndex + 0.5;
}

export function DistanceFeedbackDiagram(props: {
  direction: QuestionDirection;
  correctSemitones: number;
  answeredSemitones: number;
}) {
  const layout = buildDistanceFeedbackLayout({
    direction: props.direction,
    correctSemitones: props.correctSemitones,
    answeredSemitones: props.answeredSemitones,
  });

  const { viewBox } = layout;
  const vb = `0 ${-LAYOUT_VIEWBOX_TOP_PADDING} ${viewBox.width} ${
    viewBox.height + LAYOUT_VIEWBOX_TOP_PADDING + LAYOUT_VIEWBOX_BOTTOM_PADDING
  }`;

  return (
    <div
      className="ui-distance-diagram"
      data-direction={props.direction}
      role="img"
      aria-label={`距離フィードバック: 0 が基準音、${
        props.direction === "down" ? "下方向" : "上方向"
      }`}
    >
      <svg
        viewBox={vb}
        preserveAspectRatio="xMidYMid meet"
        className="ui-distance-diagram__svg"
        aria-hidden="true"
      >
        {layout.arrows.map((arrow) => {
          const geometry = getDistanceFeedbackArrowRenderGeometry(arrow);

          if (!geometry) {
            return null;
          }

          return (
            <g
              key={`arrow-${arrow.tone}-${arrow.x1}-${arrow.x2}-${arrow.yLane}`}
            >
              <line
                x1={geometry.lineStartX}
                y1={arrow.yLane}
                x2={geometry.lineEndX}
                y2={arrow.yLane}
                stroke={COLORS[arrow.tone]}
                strokeWidth={0.12}
                strokeLinecap="butt"
              />
              <polygon points={geometry.headPoints} fill={COLORS[arrow.tone]} />
            </g>
          );
        })}
        <circle
          cx={columnCenter(layout.baseMarkerColumnIndex)}
          cy={layout.baseMarkerYUpper}
          r={BASE_MARKER_RADIUS}
          fill="var(--surface-elevated)"
          stroke="var(--border-strong)"
          strokeWidth={0.06}
        />
        <circle
          cx={columnCenter(layout.baseMarkerColumnIndex)}
          cy={layout.baseMarkerYLower}
          r={BASE_MARKER_RADIUS}
          fill="var(--surface-elevated)"
          stroke="var(--border-strong)"
          strokeWidth={0.06}
        />
        {layout.annotations.map((ann) => {
          const yOffset = ann.stackIndex * 0.22;
          const y = ann.y + (ann.y < 1 ? -yOffset : yOffset);
          const fill =
            ann.tone === "success"
              ? "#d8f39a"
              : ann.tone === "teal"
                ? "#cdebf0"
                : "var(--surface-elevated)";
          const stroke =
            ann.tone === "success"
              ? "rgba(110,160,32,0.18)"
              : ann.tone === "teal"
                ? "rgba(42,143,153,0.18)"
                : "var(--border-strong)";
          const textFill =
            ann.tone === "neutral" ? "var(--text-secondary)" : "#193122";
          const chars = [...ann.label];
          const lineHeight = 0.48;
          const textTopY = -((chars.length - 1) * lineHeight) / 2;
          const charItems = chars.map((character, order) => ({
            character,
            y: textTopY + order * lineHeight,
            key: `${ann.label}-${character}-${textTopY + order * lineHeight}`,
          }));
          const pillWidth = 0.78;
          const pillHeight = chars.length * lineHeight + 0.42;
          return (
            <g
              key={`ann-${ann.label}-${ann.columnIndex}-${ann.stackIndex}-${ann.y}`}
              transform={`translate(${ann.x}, ${y})`}
            >
              <rect
                x={-pillWidth / 2}
                y={-pillHeight / 2}
                width={pillWidth}
                height={pillHeight}
                rx={pillWidth / 2}
                ry={pillWidth / 2}
                fill={fill}
                stroke={stroke}
                strokeWidth={0.03}
              />
              <text
                x={0}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="0.5"
                fontWeight="800"
                fill={textFill}
              >
                {charItems.map((item) => (
                  <tspan key={item.key} x={0} y={item.y}>
                    {item.character}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
