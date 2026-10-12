"use client";

import { type PointerEvent, type ReactNode, useState } from "react";

import { Button } from "../ui/primitives";

export function LineChartInspector(props: {
  title: string;
  points: Array<{
    key: string | number;
    assistiveLabel: string;
    x: number;
    y: number;
  }>;
  axis: ReactNode;
  plot: ReactNode;
  labels: ReactNode;
}) {
  const [selectedKey, setSelectedKey] = useState<string | number | null>(null);
  const foundIndex = props.points.findIndex(
    (point) => point.key === selectedKey,
  );
  const selectedIndex = foundIndex < 0 ? props.points.length - 1 : foundIndex;
  const selectedPoint = props.points[selectedIndex];

  function selectAtPointer(event: PointerEvent<HTMLInputElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const closest = props.points.reduce((previous, point) =>
      Math.abs(point.x - x) < Math.abs(previous.x - x) ? point : previous,
    );
    setSelectedKey(closest.key);
  }

  return (
    <>
      <div className="ui-line-chart">
        <div className="ui-line-chart__axis">{props.axis}</div>
        <div className="ui-line-chart__plot">
          {props.plot}
          {selectedPoint ? (
            <>
              <span
                className="ui-line-chart__selection"
                aria-hidden="true"
                style={{
                  left: `${selectedPoint.x}%`,
                  top: `${(selectedPoint.y / 72) * 100}%`,
                }}
              />
              <input
                className="ui-line-chart__cursor"
                type="range"
                min={0}
                max={Math.max(props.points.length - 1, 1)}
                value={selectedIndex}
                aria-label={`${props.title}のデータ点`}
                aria-valuetext={selectedPoint.assistiveLabel}
                disabled={props.points.length === 1}
                onChange={(event) => {
                  const point = props.points[Number(event.target.value)];
                  if (point) setSelectedKey(point.key);
                }}
                onPointerDown={selectAtPointer}
                onPointerUp={selectAtPointer}
                onPointerMove={(event) => {
                  if (event.pointerType === "mouse" && event.buttons === 0) {
                    selectAtPointer(event);
                  }
                }}
              />
            </>
          ) : null}
        </div>
      </div>
      {props.labels}
      {selectedPoint ? (
        <div className="ui-chart-point-detail">
          <Button
            type="button"
            size="compact"
            aria-label="前の点"
            disabled={selectedIndex === 0}
            onClick={() => setSelectedKey(props.points[selectedIndex - 1].key)}
          >
            <span aria-hidden="true">←</span>
          </Button>
          <p aria-live="polite" aria-atomic="true">
            {selectedPoint.assistiveLabel}
          </p>
          <Button
            type="button"
            size="compact"
            aria-label="次の点"
            disabled={selectedIndex === props.points.length - 1}
            onClick={() => setSelectedKey(props.points[selectedIndex + 1].key)}
          >
            <span aria-hidden="true">→</span>
          </Button>
        </div>
      ) : (
        <p className="ui-subtitle">表示できるデータはまだありません。</p>
      )}
    </>
  );
}
