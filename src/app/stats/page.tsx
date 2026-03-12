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
import {
  AppShell,
  ButtonLink,
  List,
  ListLinkCard,
  MetricCard,
  MetricGrid,
  Notice,
  PageHero,
  ScreenReaderText,
  SectionHeader,
  Surface,
} from "../ui/primitives";

export default async function StatsPage() {
  const [stats, globalSettings] = await Promise.all([
    getTrainingStatsForCurrentUser(),
    getGlobalUserSettingsForCurrentUser(),
  ]);
  const intervalNotationStyle = globalSettings.settings.intervalNotationStyle;

  return (
    <AppShell>
      <PageHero
        title="統計"
        eyebrow="Progress View"
        subtitle="保存済みの回答とセッションを、全体・直近・日次・モード別の切り口で見渡せます。"
        actions={<ButtonLink href="/">ホームへ戻る</ButtonLink>}
      />

      {stats.isAuthenticated ? (
        <>
          <Surface tone="accent">
            <SectionHeader
              title="全体概要"
              description="まずは累計スコア、正答率、誤差、回答時間の全体像を確認できます。"
            />
            <MetricGrid>
              <MetricCard
                label="累計スコア"
                value={formatScoreLabel(stats.overview.cumulativeScore)}
                accent
              />
              <MetricCard
                label="全体正答率"
                value={formatAccuracyLabel(stats.overview.correctRate)}
              />
              <MetricCard
                label="平均誤差"
                value={formatAvgErrorLabel(stats.overview.averageError)}
              />
              <MetricCard
                label="中央値誤差"
                value={formatAvgErrorLabel(stats.overview.medianError)}
              />
              <MetricCard
                label="平均回答時間"
                value={formatResponseTimeMsLabel(
                  stats.overview.averageResponseTimeMs,
                )}
                compactValue
              />
            </MetricGrid>
            <p className="ui-muted ui-stats-summary-meta">
              累計 {stats.totalSessions} セッション / 保存済み回答{" "}
              {stats.totalSavedQuestionResults} 件
            </p>
          </Surface>

          <Surface>
            <SectionHeader
              title="スコア推移"
              description="日次平均スコアを、全体・距離モード・鍵盤モードで並べて比較できます。"
            />
            <div className="ui-grid-trends">
              <ScoreTrendColumn
                label="全体"
                points={stats.scoreTrends.overall.slice(0, 10)}
              />
              <ScoreTrendColumn
                label="距離モード"
                points={stats.scoreTrends.distance.slice(0, 10)}
              />
              <ScoreTrendColumn
                label="鍵盤モード"
                points={stats.scoreTrends.keyboard.slice(0, 10)}
              />
            </div>
          </Surface>

          <Surface>
            <SectionHeader
              title="モード別と直近"
              description="どちらのモードで伸びているか、直近の回答がどの程度安定しているかをまとめて見られます。"
            />
            <div className="ui-stack-lg">
              <div className="ui-stack-sm">
                <span className="ui-hero__eyebrow">モード比較</span>
                <div className="ui-grid-cards">
                  <ModeSummaryCard
                    label="距離モード"
                    sessionCount={stats.byMode.distance.sessionCount}
                    questionCount={stats.byMode.distance.questionCount}
                    cumulativeScore={stats.byMode.distance.cumulativeScore}
                    correctRate={stats.byMode.distance.correctRate}
                    averageError={stats.byMode.distance.averageError}
                    medianError={stats.byMode.distance.medianError}
                    averageResponseTimeMs={
                      stats.byMode.distance.averageResponseTimeMs
                    }
                  />
                  <ModeSummaryCard
                    label="鍵盤モード"
                    sessionCount={stats.byMode.keyboard.sessionCount}
                    questionCount={stats.byMode.keyboard.questionCount}
                    cumulativeScore={stats.byMode.keyboard.cumulativeScore}
                    correctRate={stats.byMode.keyboard.correctRate}
                    averageError={stats.byMode.keyboard.averageError}
                    medianError={stats.byMode.keyboard.medianError}
                    averageResponseTimeMs={
                      stats.byMode.keyboard.averageResponseTimeMs
                    }
                  />
                </div>
              </div>

              <div className="ui-stack-sm">
                <span className="ui-hero__eyebrow">直近の安定度</span>
                <div className="ui-grid-cards">
                  <RecentQuestionCard
                    label="直近 10 問"
                    summary={stats.recentQuestionSummaries.recent10}
                  />
                  <RecentQuestionCard
                    label="直近 30 問"
                    summary={stats.recentQuestionSummaries.recent30}
                  />
                </div>
              </div>
            </div>
          </Surface>

          <Surface>
            <SectionHeader
              title="日次推移"
              description="回答日の単位で平均値をまとめています。日ごとのペースや精度の流れをざっくり追えます。"
            />
            {stats.dailyTrends.length > 0 ? (
              <div className="ui-stack-lg">
                <div className="ui-grid-chart-panels">
                  <MetricLineChart
                    title="平均スコア"
                    valueRangeLabel={formatRangeLabel(
                      stats.dailyTrends.map((trend) => trend.averageScore),
                      formatScoreLabel,
                    )}
                    valueFormatter={formatScoreLabel}
                    points={stats.dailyTrends.map((trend) => ({
                      key: trend.date,
                      label: formatCompactDateLabel(trend.date),
                      assistiveLabel: `${formatDateLabel(trend.date)} 平均スコア ${formatScoreLabel(trend.averageScore)} / ${trend.questionCount} 問`,
                      value: trend.averageScore,
                    }))}
                    denseLabels
                  />
                  <MetricLineChart
                    title="平均誤差"
                    valueRangeLabel={formatRangeLabel(
                      stats.dailyTrends.map((trend) => trend.averageError),
                      formatAvgErrorLabel,
                    )}
                    valueFormatter={formatAvgErrorLabel}
                    points={stats.dailyTrends.map((trend) => ({
                      key: `${trend.date}-error`,
                      label: formatCompactDateLabel(trend.date),
                      assistiveLabel: `${formatDateLabel(trend.date)} 平均誤差 ${formatAvgErrorLabel(trend.averageError)} / ${trend.questionCount} 問`,
                      value: trend.averageError,
                    }))}
                    denseLabels
                  />
                  <MetricLineChart
                    title="平均回答時間"
                    valueRangeLabel={formatRangeLabel(
                      stats.dailyTrends.map(
                        (trend) => trend.averageResponseTimeMs,
                      ),
                      formatResponseTimeMsLabel,
                    )}
                    valueFormatter={formatResponseTimeMsLabel}
                    points={stats.dailyTrends.map((trend) => ({
                      key: `${trend.date}-response`,
                      label: formatCompactDateLabel(trend.date),
                      assistiveLabel: `${formatDateLabel(trend.date)} 平均回答時間 ${formatResponseTimeMsLabel(trend.averageResponseTimeMs)} / ${trend.questionCount} 問`,
                      value: trend.averageResponseTimeMs,
                    }))}
                    denseLabels
                  />
                  <MetricLineChart
                    title="正答率"
                    valueRangeLabel={formatRangeLabel(
                      stats.dailyTrends.map((trend) => trend.correctRate),
                      formatAccuracyLabel,
                    )}
                    valueFormatter={formatAccuracyLabel}
                    points={stats.dailyTrends.map((trend) => ({
                      key: `${trend.date}-accuracy`,
                      label: formatCompactDateLabel(trend.date),
                      assistiveLabel: `${formatDateLabel(trend.date)} 正答率 ${formatAccuracyLabel(trend.correctRate)} / ${trend.questionCount} 問`,
                      value: trend.correctRate,
                    }))}
                    denseLabels
                  />
                </div>
                <ChartCountRow
                  label="日ごとの問題数"
                  items={stats.dailyTrends.map((trend) => ({
                    key: trend.date,
                    label: formatCompactDateLabel(trend.date),
                    assistiveLabel: `${formatDateLabel(trend.date)} ${trend.questionCount} 問`,
                    value: `${trend.questionCount}問`,
                  }))}
                  denseLabels
                />
              </div>
            ) : (
              <p className="ui-subtitle">日次推移データはまだありません。</p>
            )}
          </Surface>

          <Surface>
            <SectionHeader
              title="音程別パフォーマンス"
              description="正解の音程距離ごとに、正答率・誤差・回答時間・平均スコアを比較できます。"
            />
            {stats.intervalPerformance.length > 0 ? (
              <div className="ui-stack-lg">
                <div className="ui-grid-chart-panels">
                  <MetricLineChart
                    title="正答率"
                    valueRangeLabel={formatRangeLabel(
                      stats.intervalPerformance.map(
                        (interval) => interval.correctRate,
                      ),
                      formatAccuracyLabel,
                    )}
                    valueFormatter={formatAccuracyLabel}
                    points={stats.intervalPerformance.map((interval) => ({
                      key: `${interval.intervalSemitones}-accuracy`,
                      label: getIntervalLabel(
                        interval.intervalSemitones,
                        intervalNotationStyle,
                      ),
                      assistiveLabel: `${getIntervalLabel(interval.intervalSemitones, intervalNotationStyle)} 正答率 ${formatAccuracyLabel(interval.correctRate)} / ${interval.questionCount} 問`,
                      value: interval.correctRate,
                    }))}
                  />
                  <MetricLineChart
                    title="平均誤差"
                    valueRangeLabel={formatRangeLabel(
                      stats.intervalPerformance.map(
                        (interval) => interval.averageError,
                      ),
                      formatAvgErrorLabel,
                    )}
                    valueFormatter={formatAvgErrorLabel}
                    points={stats.intervalPerformance.map((interval) => ({
                      key: `${interval.intervalSemitones}-error`,
                      label: getIntervalLabel(
                        interval.intervalSemitones,
                        intervalNotationStyle,
                      ),
                      assistiveLabel: `${getIntervalLabel(interval.intervalSemitones, intervalNotationStyle)} 平均誤差 ${formatAvgErrorLabel(interval.averageError)} / ${interval.questionCount} 問`,
                      value: interval.averageError,
                    }))}
                  />
                  <MetricLineChart
                    title="平均回答時間"
                    valueRangeLabel={formatRangeLabel(
                      stats.intervalPerformance.map(
                        (interval) => interval.averageResponseTimeMs,
                      ),
                      formatResponseTimeMsLabel,
                    )}
                    valueFormatter={formatResponseTimeMsLabel}
                    points={stats.intervalPerformance.map((interval) => ({
                      key: `${interval.intervalSemitones}-response`,
                      label: getIntervalLabel(
                        interval.intervalSemitones,
                        intervalNotationStyle,
                      ),
                      assistiveLabel: `${getIntervalLabel(interval.intervalSemitones, intervalNotationStyle)} 平均回答時間 ${formatResponseTimeMsLabel(interval.averageResponseTimeMs)} / ${interval.questionCount} 問`,
                      value: interval.averageResponseTimeMs,
                    }))}
                  />
                  <MetricLineChart
                    title="平均スコア"
                    valueRangeLabel={formatRangeLabel(
                      stats.intervalPerformance.map(
                        (interval) => interval.averageScore,
                      ),
                      formatScoreLabel,
                    )}
                    valueFormatter={formatScoreLabel}
                    points={stats.intervalPerformance.map((interval) => ({
                      key: `${interval.intervalSemitones}-score`,
                      label: getIntervalLabel(
                        interval.intervalSemitones,
                        intervalNotationStyle,
                      ),
                      assistiveLabel: `${getIntervalLabel(interval.intervalSemitones, intervalNotationStyle)} 平均スコア ${formatScoreLabel(interval.averageScore)} / ${interval.questionCount} 問`,
                      value: interval.averageScore,
                    }))}
                  />
                </div>
                <ChartCountRow
                  label="音程ごとの問題数"
                  items={stats.intervalPerformance.map((interval) => ({
                    key: interval.intervalSemitones,
                    label: getIntervalLabel(
                      interval.intervalSemitones,
                      intervalNotationStyle,
                    ),
                    assistiveLabel: `${getIntervalLabel(interval.intervalSemitones, intervalNotationStyle)} ${interval.questionCount} 問`,
                    value: `${interval.questionCount}問`,
                  }))}
                />
              </div>
            ) : (
              <p className="ui-subtitle">音程別データはまだありません。</p>
            )}
          </Surface>

          <div className="ui-grid-cards">
            <Surface>
              <SectionHeader
                title="上下方向の比較"
                description="上方向と下方向で、正答率や反応速度に偏りがないかを確認できます。"
              />
              <div className="ui-stack-lg">
                <div className="ui-grid-chart-panels">
                  <MetricComparisonChart
                    title="正答率"
                    valueFormatter={formatAccuracyLabel}
                    items={[
                      {
                        key: "up-accuracy",
                        label: "上方向",
                        value: stats.directionPerformance.up.correctRate,
                      },
                      {
                        key: "down-accuracy",
                        label: "下方向",
                        value: stats.directionPerformance.down.correctRate,
                      },
                    ]}
                  />
                  <MetricComparisonChart
                    title="平均誤差"
                    valueFormatter={formatAvgErrorLabel}
                    items={[
                      {
                        key: "up-error",
                        label: "上方向",
                        value: stats.directionPerformance.up.averageError,
                      },
                      {
                        key: "down-error",
                        label: "下方向",
                        value: stats.directionPerformance.down.averageError,
                      },
                    ]}
                  />
                  <MetricComparisonChart
                    title="平均回答時間"
                    valueFormatter={formatResponseTimeMsLabel}
                    items={[
                      {
                        key: "up-response",
                        label: "上方向",
                        value:
                          stats.directionPerformance.up.averageResponseTimeMs,
                      },
                      {
                        key: "down-response",
                        label: "下方向",
                        value:
                          stats.directionPerformance.down.averageResponseTimeMs,
                      },
                    ]}
                  />
                  <MetricComparisonChart
                    title="平均スコア"
                    valueFormatter={formatScoreLabel}
                    items={[
                      {
                        key: "up-score",
                        label: "上方向",
                        value: stats.directionPerformance.up.averageScore,
                      },
                      {
                        key: "down-score",
                        label: "下方向",
                        value: stats.directionPerformance.down.averageScore,
                      },
                    ]}
                  />
                </div>
                <p className="ui-muted">
                  対象問題数: 上方向{" "}
                  {stats.directionPerformance.up.questionCount} 問 / 下方向{" "}
                  {stats.directionPerformance.down.questionCount} 問
                </p>
              </div>
            </Surface>

            <Surface>
              <SectionHeader
                title="回答傾向"
                description="回答が高めか低めか、または一致しやすいかを全体傾向として見られます。"
              />
              <AnswerBiasChart
                higherCount={stats.answerBias.higherCount}
                higherRate={stats.answerBias.higherRate}
                lowerCount={stats.answerBias.lowerCount}
                lowerRate={stats.answerBias.lowerRate}
                onTargetCount={stats.answerBias.onTargetCount}
                onTargetRate={stats.answerBias.onTargetRate}
              />
            </Surface>
          </div>

          <Surface>
            <SectionHeader title="最近のセッション" />
            {stats.recentSessions.length > 0 ? (
              <List>
                {stats.recentSessions.map((session) => (
                  <li key={session.id}>
                    <ListLinkCard href={`/sessions/${session.id}`}>
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
                  </li>
                ))}
              </List>
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

function formatSecondaryModeLabel(value: "distance" | "keyboard"): string {
  return value === "distance" ? "距離モード" : "鍵盤モード";
}

function ModeSummaryCard(props: {
  label: string;
  sessionCount: number;
  questionCount: number;
  cumulativeScore: number;
  correctRate: number;
  averageError: number;
  medianError: number;
  averageResponseTimeMs: number;
}) {
  return (
    <div className="ui-panel-card">
      <span className="ui-hero__eyebrow">{props.label}</span>
      <div className="ui-stack-sm">
        <strong>累計スコア {formatScoreLabel(props.cumulativeScore)}</strong>
        <span className="ui-muted">
          {props.sessionCount} セッション / {props.questionCount} 問
        </span>
        <span className="ui-muted">
          正答率 {formatAccuracyLabel(props.correctRate)}
          {" / "}平均誤差 {formatAvgErrorLabel(props.averageError)}
        </span>
        <span className="ui-muted">
          中央値誤差 {formatAvgErrorLabel(props.medianError)}
          {" / "}平均回答時間{" "}
          {formatResponseTimeMsLabel(props.averageResponseTimeMs)}
        </span>
      </div>
    </div>
  );
}

function RecentQuestionCard(props: {
  label: string;
  summary: {
    questionCount: number;
    averageScore: number;
    correctRate: number;
    averageError: number;
    averageResponseTimeMs: number;
  };
}) {
  return (
    <div className="ui-panel-card">
      <span className="ui-hero__eyebrow">{props.label}</span>
      <strong>平均スコア {formatScoreLabel(props.summary.averageScore)}</strong>
      <span className="ui-muted">
        {props.summary.questionCount} 問 / 正答率{" "}
        {formatAccuracyLabel(props.summary.correctRate)}
      </span>
      <span className="ui-muted">
        平均誤差 {formatAvgErrorLabel(props.summary.averageError)}
        {" / "}平均回答時間{" "}
        {formatResponseTimeMsLabel(props.summary.averageResponseTimeMs)}
      </span>
    </div>
  );
}

function ScoreTrendColumn(props: {
  label: string;
  points: Array<{
    date: string;
    questionCount: number;
    averageScore: number;
  }>;
}) {
  const maxScore = Math.max(
    ...props.points.map((point) => point.averageScore),
    1,
  );

  return (
    <div className="ui-panel-card ui-trend-card">
      <div className="ui-stack-sm">
        <span className="ui-hero__eyebrow">{props.label}</span>
        <strong>直近 {props.points.length} 日</strong>
      </div>
      {props.points.length > 0 ? (
        <>
          <div className="ui-trend-bars" aria-hidden="true">
            {props.points.map((point) => {
              const height = Math.max(
                16,
                Math.round((point.averageScore / maxScore) * 96),
              );

              return (
                <div
                  key={`${props.label}-${point.date}`}
                  className="ui-trend-bar"
                >
                  <div
                    className="ui-trend-bar__value"
                    style={
                      {
                        "--trend-height": `${height}px`,
                      } as CSSProperties
                    }
                  />
                  <span className="ui-trend-bar__label">
                    {formatDateLabel(point.date)}
                  </span>
                </div>
              );
            })}
          </div>
          <ScreenReaderText as="p">
            {props.points
              .map(
                (point) =>
                  `${formatDateLabel(point.date)} 平均スコア ${formatScoreLabel(point.averageScore)} / ${point.questionCount} 問`,
              )
              .join("、")}
          </ScreenReaderText>
        </>
      ) : (
        <span className="ui-subtitle">データはまだありません。</span>
      )}
    </div>
  );
}

type ChartPoint = {
  key: string | number;
  label: string;
  assistiveLabel: string;
  value: number;
};

type CountRowItem = {
  key: string | number;
  label: string;
  assistiveLabel: string;
  value: string;
};

function MetricLineChart(props: {
  title: string;
  valueRangeLabel: string;
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
      const x =
        props.points.length === 1
          ? 50
          : (index / (props.points.length - 1)) * 100;
      const y = 64 - ((point.value - minValue) / range) * 48;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="ui-panel-card ui-chart-card">
      <div className="ui-inline-split">
        <strong>{props.title}</strong>
        <span className="ui-muted">{props.valueRangeLabel}</span>
      </div>
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
            {props.points.map((point, index) => {
              const x =
                props.points.length === 1
                  ? 50
                  : (index / (props.points.length - 1)) * 100;
              const y = 64 - ((point.value - minValue) / range) * 48;

              return (
                <circle
                  key={point.key}
                  cx={x}
                  cy={y}
                  r="2.4"
                  className="ui-line-chart__dot"
                />
              );
            })}
          </svg>
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

function ChartCountRow(props: {
  label: string;
  items: CountRowItem[];
  denseLabels?: boolean;
}) {
  return (
    <div className="ui-panel-card ui-chart-count-card">
      <span className="ui-muted">{props.label}</span>
      <div
        className="ui-chart-count-row"
        style={createChartColumnsStyle(props.items.length)}
        aria-hidden="true"
      >
        {props.items.map((item, index) => {
          const showLabel =
            !props.denseLabels ||
            shouldShowDenseChartLabel(index, props.items.length);

          return (
            <div
              key={item.key}
              className="ui-chart-count-row__item"
              data-visible={showLabel}
            >
              <span>{showLabel ? item.label : ""}</span>
              <strong>{showLabel ? item.value : ""}</strong>
            </div>
          );
        })}
      </div>
      <ScreenReaderText as="p">
        {props.items.map((item) => item.assistiveLabel).join("、")}
      </ScreenReaderText>
    </div>
  );
}

function MetricComparisonChart(props: {
  title: string;
  valueFormatter: (value: number) => string;
  items: Array<{
    key: string;
    label: string;
    value: number;
  }>;
}) {
  const maxValue = Math.max(...props.items.map((item) => item.value), 1);

  return (
    <div className="ui-panel-card ui-chart-card">
      <div className="ui-inline-split">
        <strong>{props.title}</strong>
        <span className="ui-muted">上方向 / 下方向</span>
      </div>
      <div className="ui-comparison-bars" aria-hidden="true">
        {props.items.map((item, index) => {
          const height = Math.max(16, Math.round((item.value / maxValue) * 96));

          return (
            <div key={item.key} className="ui-comparison-bar">
              <span className="ui-comparison-bar__value">
                {props.valueFormatter(item.value)}
              </span>
              <div
                className="ui-comparison-bar__column"
                data-tone={index === 0 ? "primary" : "secondary"}
                style={
                  {
                    "--comparison-height": `${height}px`,
                  } as CSSProperties
                }
              />
              <span className="ui-comparison-bar__label">{item.label}</span>
            </div>
          );
        })}
      </div>
      <ScreenReaderText as="p">
        {props.items
          .map((item) => `${item.label} ${props.valueFormatter(item.value)}`)
          .join("、")}
      </ScreenReaderText>
    </div>
  );
}

function AnswerBiasChart(props: {
  higherCount: number;
  higherRate: number;
  lowerCount: number;
  lowerRate: number;
  onTargetCount: number;
  onTargetRate: number;
}) {
  const segments = [
    {
      key: "higher",
      label: "高め",
      count: props.higherCount,
      rate: props.higherRate,
    },
    {
      key: "lower",
      label: "低め",
      count: props.lowerCount,
      rate: props.lowerRate,
    },
    {
      key: "on-target",
      label: "一致",
      count: props.onTargetCount,
      rate: props.onTargetRate,
    },
  ];

  return (
    <div className="ui-stack-md">
      <div
        className="ui-bias-bar"
        role="img"
        aria-label={segments
          .map(
            (segment) =>
              `${segment.label} ${formatAccuracyLabel(segment.rate)} ${segment.count} 問`,
          )
          .join("、")}
      >
        {segments.map((segment) => (
          <div
            key={segment.key}
            className="ui-bias-bar__segment"
            data-tone={segment.key}
            style={{
              flexBasis: `${segment.rate * 100}%`,
              flexGrow: segment.rate,
              minWidth: segment.rate > 0 ? "10px" : "0",
            }}
          />
        ))}
      </div>
      <div className="ui-bias-legend" aria-hidden="true">
        {segments.map((segment) => (
          <div key={segment.key} className="ui-bias-legend__item">
            <span className="ui-bias-legend__label">
              <span
                className="ui-bias-legend__swatch"
                data-tone={segment.key}
              />
              {segment.label}
            </span>
            <strong>{formatAccuracyLabel(segment.rate)}</strong>
            <span className="ui-muted">{segment.count} 問</span>
          </div>
        ))}
      </div>
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

function shouldShowDenseChartLabel(index: number, total: number): boolean {
  if (total <= 6) {
    return true;
  }

  const step = Math.ceil(total / 4);

  return index === 0 || index === total - 1 || index % step === 0;
}

function formatRangeLabel(
  values: number[],
  formatter: (value: number) => string,
): string {
  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);

  return `${formatter(minValue)} - ${formatter(maxValue)}`;
}

function createChartColumnsStyle(columnCount: number): CSSProperties {
  return {
    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
  };
}
