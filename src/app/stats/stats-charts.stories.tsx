import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { expect, userEvent, within } from "storybook/test";

import { AppShell, GraphCard } from "../ui/primitives";
import { MetricBarChart, MetricLineChart } from "./stats-charts";
import { StatsTrendSwitch } from "./stats-trend-switch";
import { createScoreTrendOptions } from "./stats-view-model";

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
    key: "M2",
    label: "長2",
    assistiveLabel: "長2度 平均誤差 1.0 半音",
    value: 1.0,
  },
  {
    key: "m3",
    label: "短3",
    assistiveLabel: "短3度 平均誤差 0.5 半音",
    value: 0.5,
  },
  {
    key: "M3",
    label: "長3",
    assistiveLabel: "長3度 平均誤差 0.6 半音",
    value: 0.6,
  },
  {
    key: "p4",
    label: "完4",
    assistiveLabel: "完全4度 平均誤差 0.8 半音",
    value: 0.8,
  },
  {
    key: "tritone",
    label: "増4",
    assistiveLabel: "増4度 / 減5度 平均誤差 1.1 半音",
    value: 1.1,
  },
  {
    key: "p5",
    label: "完5",
    assistiveLabel: "完全5度 平均誤差 0.4 半音",
    value: 0.4,
  },
  {
    key: "m6",
    label: "短6",
    assistiveLabel: "短6度 平均誤差 0.75 半音",
    value: 0.75,
  },
  {
    key: "M6",
    label: "長6",
    assistiveLabel: "長6度 平均誤差 0.95 半音",
    value: 0.95,
  },
  {
    key: "m7",
    label: "短7",
    assistiveLabel: "短7度 平均誤差 1.35 半音",
    value: 1.35,
  },
  {
    key: "M7",
    label: "長7",
    assistiveLabel: "長7度 平均誤差 1.6 半音",
    value: 1.6,
  },
  {
    key: "p8",
    label: "完8",
    assistiveLabel: "完全8度 平均誤差 1.8 半音",
    value: 1.8,
  },
];

const scoreTrendOptions = createScoreTrendOptions({
  overall: [
    { date: "2026-03-01", averageScore: 70, questionCount: 12 },
    { date: "2026-03-02", averageScore: 76, questionCount: 16 },
    { date: "2026-03-03", averageScore: 84, questionCount: 20 },
  ],
  distance: [
    { date: "2026-03-01", averageScore: 72, questionCount: 8 },
    { date: "2026-03-02", averageScore: 80, questionCount: 10 },
    { date: "2026-03-03", averageScore: 86, questionCount: 12 },
  ],
  keyboard: [
    { date: "2026-03-01", averageScore: 66, questionCount: 4 },
    { date: "2026-03-02", averageScore: 71, questionCount: 6 },
    { date: "2026-03-03", averageScore: 78, questionCount: 8 },
  ],
});

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
    >
      <MetricLineChart
        title="日次スコア"
        titleVisibility="sr-only"
        tone="brand"
        valueFormatter={(value) => `${value.toFixed(1)} pt`}
        points={denseLinePoints}
        denseLabels
      />
    </GraphCard>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const graphCard = requireElement<HTMLElement>(
      canvasElement,
      ".ui-graph-card",
    );
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
    await expect(getComputedStyle(graphCard).backgroundColor).toBe(
      "rgba(0, 0, 0, 0)",
    );
    await expect(getComputedStyle(graphCard).paddingTop).toBe("16px");
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
        titleVisibility="sr-only"
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

export const ScoreTrendModeSwitch: Story = {
  render: () => (
    <GraphCard title="スコア推移" subtitle="全体、距離、鍵盤を切り替えます。">
      <StatsTrendSwitch
        options={scoreTrendOptions}
        valueFormatter={(value) => `${value.toFixed(1)} pt`}
      />
    </GraphCard>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const keyboardOption = canvas.getByLabelText("鍵盤");

    await expect(canvas.getByLabelText("全体")).toBeChecked();
    await userEvent.click(keyboardOption);
    await expect(keyboardOption).toBeChecked();
    await expect(canvas.getByText(/鍵盤モード 平均スコア/)).toBeInTheDocument();
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
        titleVisibility="sr-only"
        tone="coral"
        valueFormatter={(value) => `${value.toFixed(1)} 半音`}
        points={intervalPoints}
        labelOrientation="vertical"
      />
    </GraphCard>
  ),
  play: async ({ canvasElement }) => {
    const plot = requireElement<HTMLElement>(
      canvasElement,
      ".ui-bar-chart__plot",
    );
    const labelGrid = requireElement<HTMLElement>(
      canvasElement,
      ".ui-chart-label-grid",
    );
    const firstVisibleLabel = requireElement<HTMLElement>(
      canvasElement,
      '.ui-chart-label-grid__item[data-visible="true"]',
    );
    const bars = Array.from(
      canvasElement.querySelectorAll<HTMLElement>(".ui-bar-chart__bar"),
    );
    const visibleLabels = Array.from(
      canvasElement.querySelectorAll<HTMLElement>(
        '.ui-chart-label-grid__item[data-visible="true"]',
      ),
    );

    expectTrackToMatchPlot(plot, labelGrid);
    expectLabelsToStayWithinPlot(visibleLabels, plot);
    expectBarLabelsNotToOverlap(visibleLabels);
    expectBarLabelCentersToMatch(bars, visibleLabels);
    await expect(getComputedStyle(firstVisibleLabel).writingMode).toBe(
      "vertical-rl",
    );
    await expect(getComputedStyle(firstVisibleLabel).textOrientation).toBe(
      "upright",
    );
    await expect(canvasElement.querySelector(".ui-chip")).toBeNull();
  },
};

export const LineChartCardHeaderOwnsTitle: Story = {
  render: () => (
    <GraphCard title="正答率" subtitle="回答の安定度">
      <MetricLineChart
        title="正答率"
        titleVisibility="sr-only"
        tone="teal"
        valueFormatter={(value) => `${value.toFixed(0)}%`}
        points={[
          {
            key: "2026-03-01",
            label: "3/01",
            assistiveLabel: "2026-03-01 正答率 40%",
            value: 40,
          },
          {
            key: "2026-03-02",
            label: "3/02",
            assistiveLabel: "2026-03-02 正答率 52%",
            value: 52,
          },
        ]}
      />
    </GraphCard>
  ),
  play: async ({ canvasElement }) => {
    const headerTitle = requireElement<HTMLElement>(
      canvasElement,
      ".ui-graph-card__title",
    );
    const chartVisibleTitle = canvasElement.querySelector(
      ".ui-chart-card > strong",
    );
    const chartHiddenTitle = requireElement<HTMLElement>(
      canvasElement,
      ".ui-chart-card .sr-only",
    );

    await expect(headerTitle).toBeVisible();
    await expect(headerTitle.textContent).toBe("正答率");
    await expect(chartVisibleTitle).toBeNull();
    await expect(chartHiddenTitle.textContent).toContain("正答率");
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

function expectBarLabelCentersToMatch(
  bars: HTMLElement[],
  labels: HTMLElement[],
) {
  expect(bars).toHaveLength(labels.length);

  for (const [index, bar] of bars.entries()) {
    const barRect = bar.getBoundingClientRect();
    const labelRect = labels[index]?.getBoundingClientRect();

    if (!labelRect) {
      throw new Error(`Missing label for bar index ${index}`);
    }

    const barCenter = barRect.left + barRect.width / 2;
    const labelCenter = labelRect.left + labelRect.width / 2;

    expect(Math.abs(barCenter - labelCenter)).toBeLessThanOrEqual(1);
  }
}

function expectBarLabelsNotToOverlap(labels: HTMLElement[]) {
  for (const [index, label] of labels.entries()) {
    const nextLabel = labels[index + 1];

    if (!nextLabel) {
      continue;
    }

    const currentRect = label.getBoundingClientRect();
    const nextRect = nextLabel.getBoundingClientRect();

    expect(currentRect.right).toBeLessThanOrEqual(nextRect.left + 1);
  }
}
