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
import { ButtonLink, ListLinkCard } from "../ui/navigation-link";
import {
  AppShell,
  Chip,
  GraphCard,
  Notice,
  PageHeader,
  ScreenReaderText,
  SectionHeader,
  SummaryBlock,
  SummaryStat,
  Surface,
  TrainingModeChip,
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
        eyebrow="学習の記録"
        subtitle="保存済みセッションから、成長の流れと苦手傾向をまとめて確認できます。"
      />

      <Surface>
        <div className="ui-page-aux-actions">
          <ButtonLink
            href="/"
            variant="ghost"
            size="compact"
            pendingLabel="ホームを開いています..."
          >
            ホーム
          </ButtonLink>
        </div>
      </Surface>

      {stats.isAuthenticated ? (
        <>
          <Surface tone="accent">
            <SectionHeader
              title="全体概要"
              description={`累計 ${stats.totalSessions} セッション / 保存済み回答 ${stats.totalSavedQuestionResults} 件の流れです。`}
            />
            <SummaryBlock className="ui-summary-block--insight">
              <SummaryStat
                label="累計スコア"
                value={formatScoreLabel(stats.overview.cumulativeScore)}
                emphasis="primary"
                className="ui-summary-stat--brand"
              />
              <SummaryStat
                label="正答率"
                value={formatAccuracyLabel(stats.overview.correctRate)}
                detail="回答の安定度"
                className="ui-summary-stat--teal"
              />
              <SummaryStat
                label="平均誤差"
                value={formatAvgErrorLabel(stats.overview.averageError)}
                detail="ズレの大きさ"
                className="ui-summary-stat--coral"
              />
              <SummaryStat
                label="平均回答時間"
                value={formatResponseTimeMsLabel(
                  stats.overview.averageResponseTimeMs,
                )}
                detail="反応速度"
                className="ui-summary-stat--blue"
              />
            </SummaryBlock>
          </Surface>

          <GraphCard
            title="日次スコア推移"
            subtitle="主指標として、日ごとの平均スコアを確認します。"
            className="ui-graph-card--feature"
            actions={<Chip tone="brand">主グラフ</Chip>}
          >
            <MetricLineChart
              title="日次スコア"
              tone="brand"
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
            <GraphCard
              title="正答率"
              subtitle="回答の安定度"
              actions={<Chip tone="teal">比較</Chip>}
            >
              <MetricLineChart
                title="正答率"
                tone="teal"
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
            <GraphCard
              title="平均誤差"
              subtitle="ズレの大きさ"
              actions={<Chip tone="coral">注意</Chip>}
            >
              <MetricLineChart
                title="平均誤差"
                tone="coral"
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
            <GraphCard
              title="平均回答時間"
              subtitle="反応速度"
              actions={<Chip tone="blue">情報</Chip>}
            >
              <MetricLineChart
                title="平均回答時間"
                tone="blue"
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
            <SectionHeader
              title="モード別と直近の傾向"
              description="モード差と直近の手応えを、同じ読み方で並べて確認できます。"
            />
            <div className="ui-flat-panel-list">
              <ComparisonPanel
                title="距離モード"
                tone="teal"
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
              <ComparisonPanel
                title="鍵盤モード"
                tone="blue"
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
              <ComparisonPanel
                title="直近 10 問"
                tone="amber"
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
              <ComparisonPanel
                title="直近 30 問"
                tone="brand"
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

          <GraphCard
            title="苦手分析"
            subtitle="平均誤差が大きい音程を、強いズレの順に見ます。"
            actions={<Chip tone="coral">誤差分析</Chip>}
          >
            <MetricBarChart
              title="音程別の平均誤差"
              tone="coral"
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
            <SectionHeader
              title="最近のセッション"
              description="ホームと同じ圧縮リストで、直近の保存結果を振り返れます。"
            />
            {stats.recentSessions.length > 0 ? (
              <div className="ui-list">
                {stats.recentSessions.map((session) => (
                  <ListLinkCard
                    key={session.id}
                    href={`/sessions/${session.id}`}
                    pendingLabel="セッション詳細を開いています..."
                    className="ui-list-link--compact ui-list-link--session"
                  >
                    <div className="ui-list-link__split">
                      <strong>{formatSecondaryModeLabel(session.mode)}</strong>
                      <TrainingModeChip
                        mode={session.mode}
                        label={
                          session.mode === "distance" ? "回答比較" : "鍵盤回答"
                        }
                      />
                    </div>
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
        <Notice tone="warning">
          保存済みの学習統計を見るにはログインしてください。ゲストのセッションは保存されません。
        </Notice>
      )}
    </AppShell>
  );
}

function ComparisonPanel(props: {
  title: string;
  tone: "brand" | "teal" | "amber" | "blue";
  stats: Array<{ label: string; value: string }>;
}) {
  return (
    <section className="ui-flat-panel" data-tone={props.tone}>
      <div className="ui-flat-panel__header">
        <strong>{props.title}</strong>
        <Chip tone={props.tone}>{getComparisonChipLabel(props.tone)}</Chip>
      </div>
      <dl className="ui-flat-panel__list">
        {props.stats.map((stat) => (
          <div
            key={`${props.title}-${stat.label}`}
            className="ui-flat-panel__row"
          >
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function formatSecondaryModeLabel(value: "distance" | "keyboard"): string {
  return value === "distance" ? "距離モード" : "鍵盤モード";
}

function getComparisonChipLabel(
  tone: "brand" | "teal" | "amber" | "blue",
): string {
  switch (tone) {
    case "teal":
      return "モード比較";
    case "amber":
      return "短期";
    case "blue":
      return "入力差";
    default:
      return "基準";
  }
}

type ChartPoint = {
  key: string | number;
  label: string;
  assistiveLabel: string;
  value: number;
};

function MetricLineChart(props: {
  title: string;
  tone: "brand" | "teal" | "coral" | "blue";
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
    <div className="ui-chart-card" data-tone={props.tone}>
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
  tone: "brand" | "teal" | "coral" | "blue";
  valueFormatter: (value: number) => string;
  points: ChartPoint[];
  denseLabels?: boolean;
}) {
  const maxValue = Math.max(...props.points.map((point) => point.value), 1);

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
