import type { CSSProperties } from "react";

import { getGlobalUserSettingsForCurrentUser } from "../../features/settings/server/global-user-settings";
import {
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatDateLabel,
  formatDateTimeLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
} from "../../features/training/model/format";
import { getIntervalLabel } from "../../features/training/model/interval-notation";
import { getTrainingStatsForCurrentUser } from "../../features/training/server/getTrainingStats";
import { getCurrentUserOrNullCached } from "../../lib/auth/server";
import { ListLinkCard } from "../ui/navigation-link";
import {
  AppShell,
  GraphCard,
  Notice,
  PageHeader,
  ScreenReaderText,
  SectionHeader,
  SummaryBlock,
  SummaryStat,
  Surface,
} from "../ui/primitives";

export default async function StatsPage() {
  const currentUser = await getCurrentUserOrNullCached();
  const [stats, globalSettings] = await Promise.all([
    getTrainingStatsForCurrentUser({ currentUser }),
    getGlobalUserSettingsForCurrentUser({ currentUser }),
  ]);
  const intervalNotationStyle = globalSettings.settings.intervalNotationStyle;

  return (
    <AppShell>
      <PageHeader
        title="統計"
        eyebrow="Progress View"
        subtitle="保存済みセッションから、成長の流れと苦手傾向をまとめて確認できます。"
      />

      {stats.isAuthenticated ? (
        <>
          <Surface tone="accent">
            <SectionHeader title="全体概要" />
            <SummaryBlock>
              <SummaryStat
                label="累計スコア"
                value={formatScoreLabel(stats.overview.cumulativeScore)}
                emphasis="primary"
              />
              <SummaryStat
                label="正答率"
                value={formatAccuracyLabel(stats.overview.correctRate)}
              />
              <SummaryStat
                label="平均誤差"
                value={formatAvgErrorLabel(stats.overview.averageError)}
              />
              <SummaryStat
                label="平均回答時間"
                value={formatResponseTimeMsLabel(
                  stats.overview.averageResponseTimeMs,
                )}
              />
            </SummaryBlock>
          </Surface>

          <GraphCard
            title="日次スコア推移"
            subtitle={`累計 ${stats.totalSessions} セッション / 保存済み回答 ${stats.totalSavedQuestionResults} 件`}
          >
            <MetricLineChart
              title="日次スコア"
              valueFormatter={formatScoreLabel}
              points={stats.dailyTrends.map((trend) => ({
                key: trend.date,
                label: formatCompactDateLabel(trend.date),
                assistiveLabel: `${formatDateLabel(trend.date)} 平均スコア ${formatScoreLabel(trend.averageScore)} / ${trend.questionCount} 問`,
                value: trend.averageScore,
              }))}
              denseLabels
            />
          </GraphCard>

          <div className="ui-grid-chart-panels">
            <GraphCard title="正答率">
              <MetricLineChart
                title="正答率"
                valueFormatter={formatAccuracyLabel}
                points={stats.dailyTrends.map((trend) => ({
                  key: `${trend.date}-accuracy`,
                  label: formatCompactDateLabel(trend.date),
                  assistiveLabel: `${formatDateLabel(trend.date)} 正答率 ${formatAccuracyLabel(trend.correctRate)} / ${trend.questionCount} 問`,
                  value: trend.correctRate,
                }))}
                denseLabels
              />
            </GraphCard>
            <GraphCard title="平均誤差">
              <MetricLineChart
                title="平均誤差"
                valueFormatter={formatAvgErrorLabel}
                points={stats.dailyTrends.map((trend) => ({
                  key: `${trend.date}-error`,
                  label: formatCompactDateLabel(trend.date),
                  assistiveLabel: `${formatDateLabel(trend.date)} 平均誤差 ${formatAvgErrorLabel(trend.averageError)} / ${trend.questionCount} 問`,
                  value: trend.averageError,
                }))}
                denseLabels
              />
            </GraphCard>
            <GraphCard title="平均回答時間">
              <MetricLineChart
                title="平均回答時間"
                valueFormatter={formatResponseTimeMsLabel}
                points={stats.dailyTrends.map((trend) => ({
                  key: `${trend.date}-response`,
                  label: formatCompactDateLabel(trend.date),
                  assistiveLabel: `${formatDateLabel(trend.date)} 平均回答時間 ${formatResponseTimeMsLabel(trend.averageResponseTimeMs)} / ${trend.questionCount} 問`,
                  value: trend.averageResponseTimeMs,
                }))}
                denseLabels
              />
            </GraphCard>
          </div>

          <Surface>
            <SectionHeader title="モード別と直近の傾向" />
            <div className="ui-grid-cards">
              <SummaryCard
                title="距離モード"
                stats={[
                  {
                    label: "累計スコア",
                    value: formatScoreLabel(
                      stats.byMode.distance.cumulativeScore,
                    ),
                  },
                  {
                    label: "正答率",
                    value: formatAccuracyLabel(
                      stats.byMode.distance.correctRate,
                    ),
                  },
                  {
                    label: "平均誤差",
                    value: formatAvgErrorLabel(
                      stats.byMode.distance.averageError,
                    ),
                  },
                  {
                    label: "平均回答時間",
                    value: formatResponseTimeMsLabel(
                      stats.byMode.distance.averageResponseTimeMs,
                    ),
                  },
                ]}
              />
              <SummaryCard
                title="鍵盤モード"
                stats={[
                  {
                    label: "累計スコア",
                    value: formatScoreLabel(
                      stats.byMode.keyboard.cumulativeScore,
                    ),
                  },
                  {
                    label: "正答率",
                    value: formatAccuracyLabel(
                      stats.byMode.keyboard.correctRate,
                    ),
                  },
                  {
                    label: "平均誤差",
                    value: formatAvgErrorLabel(
                      stats.byMode.keyboard.averageError,
                    ),
                  },
                  {
                    label: "平均回答時間",
                    value: formatResponseTimeMsLabel(
                      stats.byMode.keyboard.averageResponseTimeMs,
                    ),
                  },
                ]}
              />
            </div>
            <div className="ui-grid-cards">
              <SummaryCard
                title="直近 10 問"
                stats={[
                  {
                    label: "平均スコア",
                    value: formatScoreLabel(
                      stats.recentQuestionSummaries.recent10.averageScore,
                    ),
                  },
                  {
                    label: "正答率",
                    value: formatAccuracyLabel(
                      stats.recentQuestionSummaries.recent10.correctRate,
                    ),
                  },
                  {
                    label: "平均誤差",
                    value: formatAvgErrorLabel(
                      stats.recentQuestionSummaries.recent10.averageError,
                    ),
                  },
                ]}
              />
              <SummaryCard
                title="直近 30 問"
                stats={[
                  {
                    label: "平均スコア",
                    value: formatScoreLabel(
                      stats.recentQuestionSummaries.recent30.averageScore,
                    ),
                  },
                  {
                    label: "正答率",
                    value: formatAccuracyLabel(
                      stats.recentQuestionSummaries.recent30.correctRate,
                    ),
                  },
                  {
                    label: "平均誤差",
                    value: formatAvgErrorLabel(
                      stats.recentQuestionSummaries.recent30.averageError,
                    ),
                  },
                ]}
              />
            </div>
          </Surface>

          <GraphCard title="苦手分析" subtitle="音程別の平均誤差を確認します。">
            <MetricBarChart
              title="音程別の平均誤差"
              valueFormatter={formatAvgErrorLabel}
              points={stats.intervalPerformance.map((interval) => ({
                key: `${interval.intervalSemitones}-error`,
                label: getCompactIntervalChartLabel(interval.intervalSemitones),
                assistiveLabel: `${getIntervalLabel(interval.intervalSemitones, intervalNotationStyle)} 平均誤差 ${formatAvgErrorLabel(interval.averageError)} / ${interval.questionCount} 問`,
                value: interval.averageError,
              }))}
            />
          </GraphCard>

          <Surface>
            <SectionHeader title="最近のセッション" />
            {stats.recentSessions.length > 0 ? (
              <div className="ui-list">
                {stats.recentSessions.map((session) => (
                  <ListLinkCard
                    key={session.id}
                    href={`/sessions/${session.id}`}
                    pendingLabel="セッション詳細を開いています..."
                    className="ui-list-link--compact"
                  >
                    <strong>{formatSecondaryModeLabel(session.mode)}</strong>
                    <span className="ui-muted">
                      スコア {formatScoreLabel(session.sessionScore)} / 問題数{" "}
                      {session.answeredQuestionCount} / 正答率{" "}
                      {formatAccuracyLabel(session.accuracyRate)}
                    </span>
                    <span className="ui-muted">
                      完了日時 {formatDateTimeLabel(session.endedAt)}
                    </span>
                  </ListLinkCard>
                ))}
              </div>
            ) : (
              <p className="ui-subtitle">
                保存済みセッションはまだありません。
              </p>
            )}
          </Surface>
        </>
      ) : (
        <Notice>
          保存済みの学習統計を見るにはログインしてください。ゲストのセッションは保存されません。
        </Notice>
      )}
    </AppShell>
  );
}

function SummaryCard(props: {
  title: string;
  stats: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="ui-panel-card">
      <strong>{props.title}</strong>
      <div className="ui-stack-sm">
        {props.stats.map((stat) => (
          <span key={`${props.title}-${stat.label}`} className="ui-muted">
            {stat.label} {stat.value}
          </span>
        ))}
      </div>
    </div>
  );
}

function formatSecondaryModeLabel(value: "distance" | "keyboard"): string {
  return value === "distance" ? "距離モード" : "鍵盤モード";
}

type ChartPoint = {
  key: string | number;
  label: string;
  assistiveLabel: string;
  value: number;
};

function MetricLineChart(props: {
  title: string;
  valueFormatter: (value: number) => string;
  points: ChartPoint[];
  denseLabels?: boolean;
}) {
  const values = props.points.map((point) => point.value);
  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);
  const range = Math.max(maxValue - minValue, 1);
  const polylinePoints = props.points
    .map((point, index) => {
      const { x, y } = getLineChartCoordinates(
        index,
        props.points.length,
        point.value,
        minValue,
        range,
      );

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="ui-chart-card">
      <strong>{props.title}</strong>
      <div className="ui-line-chart">
        <div className="ui-line-chart__axis">
          <span>{props.valueFormatter(maxValue)}</span>
          <span>{props.valueFormatter(minValue)}</span>
        </div>
        <div className="ui-line-chart__plot">
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
          <div className="ui-line-chart__dots" aria-hidden="true">
            {props.points.map((point, index) => {
              const { x, y } = getLineChartCoordinates(
                index,
                props.points.length,
                point.value,
                minValue,
                range,
              );

              return (
                <span
                  key={point.key}
                  className="ui-line-chart__dot"
                  style={
                    {
                      left: `${x}%`,
                      top: `${(y / 72) * 100}%`,
                    } as CSSProperties
                  }
                />
              );
            })}
          </div>
        </div>
      </div>
      <div
        className="ui-chart-label-row"
        style={createChartColumnsStyle(props.points.length)}
        aria-hidden="true"
      >
        {props.points.map((point, index) => {
          const showLabel =
            !props.denseLabels ||
            shouldShowDenseChartLabel(index, props.points.length);

          return (
            <span
              key={point.key}
              className="ui-chart-label-row__item"
              data-visible={showLabel}
            >
              {showLabel ? point.label : ""}
            </span>
          );
        })}
      </div>
      <ScreenReaderText as="p">
        {props.points.map((point) => point.assistiveLabel).join("、")}
      </ScreenReaderText>
    </div>
  );
}

function MetricBarChart(props: {
  title: string;
  valueFormatter: (value: number) => string;
  points: ChartPoint[];
  denseLabels?: boolean;
}) {
  const maxValue = Math.max(...props.points.map((point) => point.value), 1);

  return (
    <div className="ui-chart-card">
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
      <div
        className="ui-chart-label-row"
        style={createChartColumnsStyle(props.points.length)}
        aria-hidden="true"
      >
        {props.points.map((point, index) => {
          const showLabel =
            !props.denseLabels ||
            shouldShowDenseChartLabel(index, props.points.length);

          return (
            <span
              key={point.key}
              className="ui-chart-label-row__item"
              data-visible={showLabel}
            >
              {showLabel ? point.label : ""}
            </span>
          );
        })}
      </div>
      <ScreenReaderText as="p">
        {props.points.map((point) => point.assistiveLabel).join("、")}
      </ScreenReaderText>
    </div>
  );
}

function formatCompactDateLabel(value: string): string {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${month}/${day}`;
}

function getCompactIntervalChartLabel(semitones: number): string {
  const labels: Record<number, string> = {
    0: "完1",
    1: "短2",
    2: "長2",
    3: "短3",
    4: "長3",
    5: "完4",
    6: "増4/減5",
    7: "完5",
    8: "短6",
    9: "長6",
    10: "短7",
    11: "長7",
    12: "完8",
  };

  return labels[semitones] ?? `${semitones}半`;
}

function shouldShowDenseChartLabel(index: number, total: number): boolean {
  if (total <= 6) {
    return true;
  }

  const step = Math.ceil(total / 4);

  return index === 0 || index === total - 1 || index % step === 0;
}

function createChartColumnsStyle(columnCount: number): CSSProperties {
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

  const x = total === 1 ? 50 : left + (index / (total - 1)) * usableWidth;
  const y = bottom - ((value - minValue) / range) * usableHeight;

  return { x, y };
}
