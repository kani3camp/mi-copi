import type { QuestionDirection } from "../../features/training/model/types";

const WIDTH = 720;
const HEIGHT = 220;
const PADDING_X = 44;
const AXIS_Y = 110;
const CORRECT_LANE_Y = 70;
const ANSWER_LANE_Y = 150;
const TICK_HALF_HEIGHT = 7;
const MARKER_RADIUS = 8;

function toSignedDistance(
  direction: QuestionDirection,
  semitones: number,
): number {
  if (semitones === 0 || direction === "unison") {
    return 0;
  }

  return direction === "down" ? -Math.abs(semitones) : Math.abs(semitones);
}

function formatSignedTick(value: number): string {
  if (value === 0) {
    return "0";
  }

  return value > 0 ? `+${value}` : String(value);
}

function formatDirectionLabel(direction: QuestionDirection): string {
  switch (direction) {
    case "down":
      return "下方向";
    case "unison":
      return "同音";
    default:
      return "上方向";
  }
}

function buildScale(params: {
  correct: number;
  answer: number;
}): { min: number; max: number; ticks: number[] } {
  const min = Math.min(0, params.correct, params.answer) - 1;
  const max = Math.max(0, params.correct, params.answer) + 1;
  const ticks = Array.from({ length: max - min + 1 }, (_, index) => min + index);

  return { min, max, ticks };
}

function getX(value: number, min: number, max: number): number {
  if (max === min) {
    return WIDTH / 2;
  }

  const availableWidth = WIDTH - PADDING_X * 2;
  return PADDING_X + ((value - min) / (max - min)) * availableWidth;
}

function TriangleMarker(props: { x: number; y: number }) {
  const points = `${props.x},${props.y - 9} ${props.x - 9},${props.y + 8} ${props.x + 9},${props.y + 8}`;

  return (
    <polygon className="ui-distance-ruler__answer-marker" points={points} />
  );
}

function DiamondMarker(props: { x: number; y: number }) {
  const size = 8;
  const points = [
    `${props.x},${props.y - size}`,
    `${props.x + size},${props.y}`,
    `${props.x},${props.y + size}`,
    `${props.x - size},${props.y}`,
  ].join(" ");

  return (
    <polygon className="ui-distance-ruler__reference-marker" points={points} />
  );
}

export function DistanceFeedbackDiagram(props: {
  direction: QuestionDirection;
  correctSemitones: number;
  answeredSemitones: number;
  answeredDirection?: QuestionDirection;
}) {
  const correct = toSignedDistance(props.direction, props.correctSemitones);
  const answer = toSignedDistance(
    props.answeredDirection ?? props.direction,
    props.answeredSemitones,
  );
  const scale = buildScale({ correct, answer });
  const referenceX = getX(0, scale.min, scale.max);
  const correctX = getX(correct, scale.min, scale.max);
  const answerX = getX(answer, scale.min, scale.max);
  const isExactMatch = correct === answer;
  const directionLabel = formatDirectionLabel(props.direction);

  return (
    <div
      className="ui-distance-diagram"
      data-direction={props.direction}
      data-answer-direction={props.answeredDirection ?? props.direction}
      data-exact-match={isExactMatch ? "true" : "false"}
      role="img"
      aria-label={`距離フィードバック: 0 が基準音、${directionLabel}`}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="ui-distance-diagram__svg"
        aria-hidden="true"
      >
        <line
          x1={PADDING_X}
          y1={AXIS_Y}
          x2={WIDTH - PADDING_X}
          y2={AXIS_Y}
          className="ui-distance-ruler__axis"
        />

        {scale.ticks.map((tick) => {
          const x = getX(tick, scale.min, scale.max);
          const isReference = tick === 0;

          return (
            <g key={tick}>
              <line
                x1={x}
                y1={AXIS_Y - TICK_HALF_HEIGHT}
                x2={x}
                y2={AXIS_Y + TICK_HALF_HEIGHT}
                className="ui-distance-ruler__tick"
              />
              <text
                x={x}
                y={AXIS_Y + 29}
                textAnchor="middle"
                className="ui-distance-ruler__tick-label"
              >
                {formatSignedTick(tick)}
              </text>
              {isReference ? <DiamondMarker x={x} y={AXIS_Y} /> : null}
            </g>
          );
        })}

        <line
          x1={referenceX}
          y1={CORRECT_LANE_Y}
          x2={correctX}
          y2={CORRECT_LANE_Y}
          className="ui-distance-ruler__correct-line"
        />
        <line
          x1={referenceX}
          y1={ANSWER_LANE_Y}
          x2={answerX}
          y2={ANSWER_LANE_Y}
          className="ui-distance-ruler__answer-line"
        />

        <line
          x1={referenceX}
          y1={CORRECT_LANE_Y}
          x2={referenceX}
          y2={ANSWER_LANE_Y}
          className="ui-distance-ruler__connector"
          stroke="var(--mc-gold)"
        />
        <line
          x1={correctX}
          y1={CORRECT_LANE_Y}
          x2={correctX}
          y2={AXIS_Y - TICK_HALF_HEIGHT}
          className="ui-distance-ruler__connector"
          stroke="var(--mc-sage)"
        />
        <line
          x1={answerX}
          y1={ANSWER_LANE_Y}
          x2={answerX}
          y2={AXIS_Y + TICK_HALF_HEIGHT}
          className="ui-distance-ruler__connector"
          stroke="var(--mc-violet)"
        />

        <circle
          cx={correctX}
          cy={CORRECT_LANE_Y}
          r={MARKER_RADIUS}
          className="ui-distance-ruler__correct-marker"
        />
        <TriangleMarker x={answerX} y={ANSWER_LANE_Y} />

        <text
          x={Math.min(WIDTH - 58, Math.max(58, referenceX))}
          y={25}
          textAnchor="middle"
          className="ui-distance-ruler__role-label"
          fill="var(--mc-gold-text)"
        >
          基準音
        </text>
        <text
          x={Math.min(WIDTH - 58, Math.max(58, correctX))}
          y={51}
          textAnchor="middle"
          className="ui-distance-ruler__role-label"
          fill="var(--mc-sage-text)"
        >
          正解
        </text>
        <text
          x={Math.min(WIDTH - 58, Math.max(58, answerX))}
          y={185}
          textAnchor="middle"
          className="ui-distance-ruler__role-label"
          fill="var(--mc-violet-text)"
        >
          回答
        </text>

        <text
          x={correctX}
          y={88}
          textAnchor="middle"
          className="ui-distance-ruler__value"
          fill="var(--mc-sage-text)"
        >
          {formatSignedTick(correct)}
        </text>
        <text
          x={answerX}
          y={174}
          textAnchor="middle"
          className="ui-distance-ruler__value"
          fill="var(--mc-violet-text)"
        >
          {formatSignedTick(answer)}
        </text>
      </svg>
    </div>
  );
}
