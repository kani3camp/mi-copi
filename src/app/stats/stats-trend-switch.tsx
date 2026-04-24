"use client";

import { useState } from "react";

import { SegmentedControl } from "../ui/primitives";
import { MetricLineChart } from "./stats-charts";
import type { StatsTrendMode, StatsTrendOption } from "./stats-view-model";

export function StatsTrendSwitch(props: {
  options: StatsTrendOption[];
  valueFormatter: (value: number) => string;
}) {
  const [activeMode, setActiveMode] = useState<StatsTrendMode>("overall");
  const activeOption =
    props.options.find((option) => option.id === activeMode) ??
    props.options[0];

  if (!activeOption) {
    return <p className="ui-subtitle">スコア推移はまだありません。</p>;
  }

  return (
    <div className="ui-stats-trend-switch">
      <SegmentedControl
        ariaLabel="スコア推移の表示モード"
        value={activeOption.id}
        onChange={setActiveMode}
        stretch
        items={props.options.map((option) => ({
          value: option.id,
          label: option.label,
        }))}
      />
      <MetricLineChart
        title={`${activeOption.label}のスコア推移`}
        titleVisibility="sr-only"
        tone={activeOption.tone}
        valueFormatter={props.valueFormatter}
        points={activeOption.points}
        denseLabels
      />
    </div>
  );
}
