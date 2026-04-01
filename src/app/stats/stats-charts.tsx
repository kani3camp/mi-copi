import type { CSSProperties } from "react";

import { ScreenReaderText } from "../ui/primitives";

export type ChartPoint = {
  key: string | number;
  label: string;
  assistiveLabel: string;
  value: number;
};

type ChartTone = "brand" | "teal" | "coral" | "blue";

type ChartLabel = {
  key: string | number;
  label: string;
  left: number;
  align: "start" | "center" | "end";
  visible: boolean;
};

export function MetricLineChart(props: {
  title: string;
  tone: ChartTone;
  valueFormatter: (value: number) => string;
  points: ChartPoint[];
  denseLabels?: boolean;
}) {
  const values = props.points.map((point) => point.value);
  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);
  const range = Math.max(maxValue - minValue, 1);
  const positions = props.points.map((point, index) => {
    const { x, y } = getLineChartCoordinates(
      index,
      props.points.length,
      point.value,
      minValue,
      range,
    );

    return {
      ...point,
      left: x,
      x,
      y,
      visible: shouldShowChartLabel(
        index,
        props.points.length,
        props.denseLabels,
      ),
      align: getChartLabelAlignment(index, props.points.length),
    };
  });
  const polylinePoints = positions
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <div className="ui-chart-card" data-tone={props.tone}>
      <strong>{props.title}</strong>
      <div className="ui-line-chart">
        <div className="ui-line-chart__axis">
          <span>{props.valueFormatter(maxValue)}</span>
          <span>{props.valueFormatter(minValue)}</span>
        </div>
        <div className="ui-line-chart__plot" aria-hidden="true">
          <svg
            viewBox="0 0 100 72"
            preserveAspectRatio="none"
            className="ui-line-chart__svg"
            aria-hidden="true"
          >
            <line
              x1="0"
              y1="16"
              x2="100"
              y2="16"
              className="ui-line-chart__grid"
            />
            <line
              x1="0"
              y1="40"
              x2="100"
              y2="40"
              className="ui-line-chart__grid"
            />
            <line
              x1="0"
              y1="64"
              x2="100"
              y2="64"
              className="ui-line-chart__grid"
            />
            <polyline
              points={polylinePoints}
              className="ui-line-chart__polyline"
            />
          </svg>
          <div className="ui-line-chart__dots">
            {positions.map((point) => (
              <span
                key={point.key}
                className="ui-line-chart__dot"
                style={
                  {
                    left: `${point.x}%`,
                    top: `${(point.y / 72) * 100}%`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        </div>
      </div>
      <ChartLabelRow labels={positions} />
      <ScreenReaderText as="p">
        {props.points.map((point) => point.assistiveLabel).join("、")}
      </ScreenReaderText>
    </div>
  );
}

export function MetricBarChart(props: {
  title: string;
  tone: ChartTone;
  valueFormatter: (value: number) => string;
  points: ChartPoint[];
  denseLabels?: boolean;
}) {
  const maxValue = Math.max(...props.points.map((point) => point.value), 1);
  const positions = props.points.map((point, index) => ({
    ...point,
    left: getBarChartCenter(index, props.points.length),
    visible: shouldShowChartLabel(
      index,
      props.points.length,
      props.denseLabels,
    ),
    align: getChartLabelAlignment(index, props.points.length),
  }));

  return (
    <div className="ui-chart-card" data-tone={props.tone}>
      <strong>{props.title}</strong>
      <div className="ui-bar-chart">
        <div className="ui-bar-chart__axis">
          <span>{props.valueFormatter(maxValue)}</span>
          <span>{props.valueFormatter(0)}</span>
        </div>
        <div className="ui-bar-chart__plot" aria-hidden="true">
          <div className="ui-bar-chart__grid">
            <span />
            <span />
            <span />
          </div>
          <div
            className="ui-bar-chart__bars"
            style={createChartColumnsStyle(props.points.length)}
          >
            {props.points.map((point) => {
              const height = Math.max(
                12,
                Math.round((point.value / maxValue) * 104),
              );

              return (
                <div key={point.key} className="ui-bar-chart__bar">
                  <div
                    className="ui-bar-chart__column"
                    style={
                      {
                        "--bar-height": `${height}px`,
                      } as CSSProperties
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <ChartLabelRow labels={positions} />
      <ScreenReaderText as="p">
        {props.points.map((point) => point.assistiveLabel).join("、")}
      </ScreenReaderText>
    </div>
  );
}

function ChartLabelRow(props: { labels: ChartLabel[] }) {
  return (
    <div className="ui-chart-label-row" aria-hidden="true">
      <div className="ui-chart-label-row__axis-spacer" />
      <div className="ui-chart-label-track">
        {props.labels.map((label) => (
          <span
            key={label.key}
            className="ui-chart-label-track__item"
            data-align={label.align}
            data-visible={label.visible}
            style={
              {
                left: `${label.left}%`,
              } as CSSProperties
            }
          >
            {label.visible ? label.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function shouldShowChartLabel(
  index: number,
  total: number,
  denseLabels: boolean | undefined,
): boolean {
  return !denseLabels || shouldShowDenseChartLabel(index, total);
}

function shouldShowDenseChartLabel(index: number, total: number): boolean {
  if (total <= 6) {
    return true;
  }

  const step = Math.ceil(total / 4);

  return index === 0 || index === total - 1 || index % step === 0;
}

function createChartColumnsStyle(
  columnCount: number,
): CSSProperties | undefined {
  if (columnCount <= 0) {
    return undefined;
  }

  return {
    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
  };
}

function getLineChartCoordinates(
  index: number,
  total: number,
  value: number,
  minValue: number,
  range: number,
): { x: number; y: number } {
  const horizontalPadding = 4;
  const left = horizontalPadding;
  const right = 100 - horizontalPadding;
  const bottom = 64;
  const top = 16;
  const usableWidth = right - left;
  const usableHeight = bottom - top;

  const x = total <= 1 ? 50 : left + (index / (total - 1)) * usableWidth;
  const y = bottom - ((value - minValue) / range) * usableHeight;

  return { x, y };
}

function getBarChartCenter(index: number, total: number): number {
  if (total <= 0) {
    return 50;
  }

  return ((index + 0.5) / total) * 100;
}

function getChartLabelAlignment(
  index: number,
  total: number,
): "start" | "center" | "end" {
  if (total <= 1) {
    return "center";
  }

  if (index === 0) {
    return "start";
  }

  if (index === total - 1) {
    return "end";
  }

  return "center";
}
