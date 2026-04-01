import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { expect, within } from "storybook/test";

import { AppShell, GraphCard } from "../ui/primitives";
import { MetricBarChart, MetricLineChart } from "./stats-charts";

const denseLinePoints = Array.from({ length: 10 }, (_, index) => {
  const day = `${index + 1}`.padStart(2, "0");

  return {
    key: `2026-03-${day}`,
    label: `3/${day}`,
    assistiveLabel: `2026-03-${day} 平均スコア ${72 + index}`,
    value: 72 + index * 2 + (index % 3),
  };
});

const intervalPoints = [
  {
    key: "p1",
    label: "完1",
    assistiveLabel: "完全1度 平均誤差 0.2 半音",
    value: 0.2,
  },
  {
    key: "m2",
    label: "短2",
    assistiveLabel: "短2度 平均誤差 0.7 半音",
    value: 0.7,
  },
  {
    key: "m3",
    label: "短3",
    assistiveLabel: "短3度 平均誤差 0.5 半音",
    value: 0.5,
  },
  {
    key: "p4",
    label: "完4",
    assistiveLabel: "完全4度 平均誤差 0.8 半音",
    value: 0.8,
  },
  {
    key: "tritone",
    label: "増4/減5",
    assistiveLabel: "増4度減5度 平均誤差 1.1 半音",
    value: 1.1,
  },
  {
    key: "p5",
    label: "完5",
    assistiveLabel: "完全5度 平均誤差 0.4 半音",
    value: 0.4,
  },
];

const meta = {
  title: "Stats/Charts",
  decorators: [
    (Story) => (
      <AppShell narrow>
        <div style={{ width: 320, margin: "0 auto" }}>
          <Story />
        </div>
      </AppShell>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const LineChartMobileDense: Story = {
  render: () => (
    <GraphCard
      title="日次スコア推移"
      subtitle="主指標として、日ごとの平均スコアを確認します。"
      className="ui-graph-card--feature"
    >
      <MetricLineChart
        title="日次スコア"
        tone="brand"
        valueFormatter={(value) => `${value.toFixed(1)} pt`}
        points={denseLinePoints}
        denseLabels
      />
    </GraphCard>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const plot = requireElement<HTMLElement>(
      canvasElement,
      ".ui-line-chart__plot",
    );
    const labelTrack = requireElement<HTMLElement>(
      canvasElement,
      ".ui-chart-label-track",
    );
    const visibleLabels = getVisibleLabels(canvasElement);

    await expect(canvas.getByText("日次スコア推移")).toBeVisible();
    await expect(canvasElement.querySelector(".ui-chip")).toBeNull();
    expectTrackToMatchPlot(plot, labelTrack);
    expectLabelsToStayWithinPlot(visibleLabels, plot);
    await expect(
      visibleLabels.map((label) => label.textContent?.trim()),
    ).toEqual(["3/01", "3/04", "3/07", "3/10"]);
  },
};

export const LineChartSinglePoint: Story = {
  render: () => (
    <GraphCard title="単一点の確認" subtitle="1件だけでも中央に揃います。">
      <MetricLineChart
        title="日次スコア"
        tone="teal"
        valueFormatter={(value) => `${value.toFixed(1)} pt`}
        points={[
          {
            key: "2026-03-01",
            label: "3/01",
            assistiveLabel: "2026-03-01 平均スコア 80.0",
            value: 80,
          },
        ]}
      />
    </GraphCard>
  ),
  play: async ({ canvasElement }) => {
    const plot = requireElement<HTMLElement>(
      canvasElement,
      ".ui-line-chart__plot",
    );
    const label = requireElement<HTMLElement>(
      canvasElement,
      '.ui-chart-label-track__item[data-visible="true"]',
    );
    const plotRect = plot.getBoundingClientRect();
    const labelRect = label.getBoundingClientRect();
    const plotCenter = plotRect.left + plotRect.width / 2;
    const labelCenter = labelRect.left + labelRect.width / 2;

    await expect(Math.abs(plotCenter - labelCenter)).toBeLessThanOrEqual(1);
  },
};

export const BarChartIntervals: Story = {
  render: () => (
    <GraphCard
      title="苦手分析"
      subtitle="平均誤差が大きい音程を、強いズレの順に見ます。"
    >
      <MetricBarChart
        title="音程別の平均誤差"
        tone="coral"
        valueFormatter={(value) => `${value.toFixed(1)} 半音`}
        points={intervalPoints}
      />
    </GraphCard>
  ),
  play: async ({ canvasElement }) => {
    const plot = requireElement<HTMLElement>(
      canvasElement,
      ".ui-bar-chart__plot",
    );
    const labelTrack = requireElement<HTMLElement>(
      canvasElement,
      ".ui-chart-label-track",
    );
    const visibleLabels = getVisibleLabels(canvasElement);

    expectTrackToMatchPlot(plot, labelTrack);
    expectLabelsToStayWithinPlot(visibleLabels, plot);
    await expect(canvasElement.querySelector(".ui-chip")).toBeNull();
  },
};

function requireElement<ElementType extends Element>(
  root: ParentNode,
  selector: string,
): ElementType {
  const element = root.querySelector(selector);

  if (!element) {
    throw new Error(`Missing element for selector: ${selector}`);
  }

  return element as ElementType;
}

function getVisibleLabels(root: ParentNode): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      '.ui-chart-label-track__item[data-visible="true"]',
    ),
  );
}

function expectTrackToMatchPlot(plot: HTMLElement, labelTrack: HTMLElement) {
  const plotRect = plot.getBoundingClientRect();
  const labelRect = labelTrack.getBoundingClientRect();

  expect(Math.abs(plotRect.left - labelRect.left)).toBeLessThanOrEqual(1);
  expect(Math.abs(plotRect.right - labelRect.right)).toBeLessThanOrEqual(1);
}

function expectLabelsToStayWithinPlot(
  labels: HTMLElement[],
  plot: HTMLElement,
) {
  const plotRect = plot.getBoundingClientRect();

  for (const label of labels) {
    const labelRect = label.getBoundingClientRect();

    expect(labelRect.left).toBeGreaterThanOrEqual(plotRect.left - 1);
    expect(labelRect.right).toBeLessThanOrEqual(plotRect.right + 1);
  }
}
