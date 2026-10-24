import type { IntervalNotationStyle } from "../../features/settings/model/global-user-settings";
import {
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatDateLabel,
  formatDateTimeLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
} from "../../features/training/model/format";
import { getIntervalLabel } from "../../features/training/model/interval-notation";
import type { TrainingStats } from "../../features/training/server/getTrainingStats";
import { MetricValue } from "../ui/metric-value";
import { ButtonLink, ListLinkCard } from "../ui/navigation-link";
import {
  AppShell,
  GraphCard,
  Notice,
  PageHeader,
  SectionHeader,
  SummaryBlock,
  SummaryStat,
  Surface,
  TrainingModeChip,
} from "../ui/primitives";
import { MetricBarChart, MetricLineChart } from "./stats-charts";
import { StatsTrendSwitch } from "./stats-trend-switch";
import {
  createScoreTrendOptions,
  formatCompactDateLabel,
  getCompactIntervalChartLabel,
} from "./stats-view-model";

export function StatsPanels({
  stats,
  intervalNotationStyle,
}: {
  stats: TrainingStats;
  intervalNotationStyle: IntervalNotationStyle;
}) {
  const scoreTrendOptions = createScoreTrendOptions(stats.scoreTrends);

  return (
    <AppShell className="ui-records-shell ui-stats-shell">
      <PageHeader
        title="成長の記録"
        actions={
          <ButtonLink
            href="/"
            variant="ghost"
            size="compact"
            pendingLabel="ホームを開いています..."
          >
            ホーム
          </ButtonLink>
        }
      />

      {stats.isAuthenticated ? (
        <>
          <Surface tone="accent" className="ui-stats-hero-surface">
            <div className="ui-stats-hero">
              <div className="ui-stats-hero__score">
                <span className="ui-stats-hero__label">累計スコア</span>
                <strong className="ui-stats-hero__value">
                  {formatScoreLabel(stats.overview.cumulativeScore)}
                </strong>
                <span className="ui-stats-hero__meta">
                  {stats.totalSessions} セッション / 保存済み回答{" "}
                  {stats.totalSavedQuestionResults} 件
                </span>
              </div>
              <SummaryBlock className="ui-summary-block--insight ui-stats-hero__supporting">
                <SummaryStat
                  label="正答率"
                  value={
                    <MetricValue
                      value={formatAccuracyLabel(stats.overview.correctRate)}
                    />
                  }
                />
                <SummaryStat
                  label="平均誤差"
                  value={
                    <MetricValue
                      value={formatAvgErrorLabel(stats.overview.averageError)}
                      unit="半音"
                    />
                  }
                />
                <SummaryStat
                  label="誤差中央値"
                  value={
                    <MetricValue
                      value={formatAvgErrorLabel(stats.overview.medianError)}
                      unit="半音"
                    />
                  }
                />
                <SummaryStat
                  label="平均回答時間"
                  value={
                    <MetricValue
                      value={formatResponseTimeMsLabel(
                        stats.overview.averageResponseTimeMs,
                      )}
                    />
                  }
                />
              </SummaryBlock>
            </div>
          </Surface>

          <GraphCard title="スコア推移" className="ui-stats-primary-chart">
            <StatsTrendSwitch options={scoreTrendOptions} />
          </GraphCard>

          <div className="ui-grid-chart-panels ui-stats-support-chart-grid">
            <GraphCard title="平均誤差（半音）">
              <MetricLineChart
                title="平均誤差"
                titleVisibility="sr-only"
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
            <GraphCard title="平均回答時間（ms）">
              <MetricLineChart
                title="平均回答時間"
                titleVisibility="sr-only"
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
            <GraphCard title="正答率">
              <MetricLineChart
                title="正答率"
                titleVisibility="sr-only"
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
          </div>

          <Surface className="ui-stats-learning-surface">
            <SectionHeader title="モード別と直近の手応え" />
            <div className="ui-flat-panel-list ui-stats-panel-grid">
              <ComparisonPanel
                title="距離モード"
                tone="teal"
                badge={`${stats.byMode.distance.sessionCount} セッション`}
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
                badge={`${stats.byMode.keyboard.sessionCount} セッション`}
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
                badge={`${stats.recentQuestionSummaries.recent10.questionCount} 問`}
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
                  {
                    label: "平均回答時間",
                    value: formatResponseTimeMsLabel(
                      stats.recentQuestionSummaries.recent10
                        .averageResponseTimeMs,
                    ),
                  },
                ]}
              />
              <ComparisonPanel
                title="直近 30 問"
                tone="brand"
                badge={`${stats.recentQuestionSummaries.recent30.questionCount} 問`}
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
                  {
                    label: "平均回答時間",
                    value: formatResponseTimeMsLabel(
                      stats.recentQuestionSummaries.recent30
                        .averageResponseTimeMs,
                    ),
                  },
                ]}
              />
            </div>
          </Surface>

          <Surface className="ui-stats-learning-surface">
            <SectionHeader title="上下方向と回答傾向" />
            <div className="ui-flat-panel-list ui-stats-panel-grid">
              <ComparisonPanel
                title="上方向"
                tone="brand"
                badge={`${stats.directionPerformance.up.questionCount} 問`}
                stats={[
                  {
                    label: "平均スコア",
                    value: formatScoreLabel(
                      stats.directionPerformance.up.averageScore,
                    ),
                  },
                  {
                    label: "正答率",
                    value: formatAccuracyLabel(
                      stats.directionPerformance.up.correctRate,
                    ),
                  },
                  {
                    label: "平均誤差",
                    value: formatAvgErrorLabel(
                      stats.directionPerformance.up.averageError,
                    ),
                  },
                ]}
              />
              <ComparisonPanel
                title="下方向"
                tone="blue"
                badge={`${stats.directionPerformance.down.questionCount} 問`}
                stats={[
                  {
                    label: "平均スコア",
                    value: formatScoreLabel(
                      stats.directionPerformance.down.averageScore,
                    ),
                  },
                  {
                    label: "正答率",
                    value: formatAccuracyLabel(
                      stats.directionPerformance.down.correctRate,
                    ),
                  },
                  {
                    label: "平均誤差",
                    value: formatAvgErrorLabel(
                      stats.directionPerformance.down.averageError,
                    ),
                  },
                ]}
              />
              <ComparisonPanel
                title="回答の偏り"
                tone="amber"
                badge="高め / 低め"
                stats={[
                  {
                    label: "高め",
                    value: `${stats.answerBias.higherCount} 問 (${formatAccuracyLabel(stats.answerBias.higherRate)})`,
                  },
                  {
                    label: "低め",
                    value: `${stats.answerBias.lowerCount} 問 (${formatAccuracyLabel(stats.answerBias.lowerRate)})`,
                  },
                  {
                    label: "ぴったり",
                    value: `${stats.answerBias.onTargetCount} 問 (${formatAccuracyLabel(stats.answerBias.onTargetRate)})`,
                  },
                ]}
              />
            </div>
          </Surface>

          <GraphCard
            title="苦手分析"
            subtitle="平均誤差が大きい音程を、強いズレの順に見ます。"
            className="ui-stats-interval-chart"
          >
            <MetricBarChart
              title="音程別の平均誤差"
              titleVisibility="sr-only"
              tone="coral"
              valueFormatter={formatAvgErrorLabel}
              labelOrientation="vertical"
              points={stats.intervalPerformance.map((interval) => ({
                key: `${interval.intervalSemitones}-error`,
                label: getCompactIntervalChartLabel(interval.intervalSemitones),
                assistiveLabel: `${getIntervalLabel(interval.intervalSemitones, intervalNotationStyle)} 平均誤差 ${formatAvgErrorLabel(interval.averageError)} / ${interval.questionCount} 問`,
                value: interval.averageError,
              }))}
            />
          </GraphCard>

          <Surface className="ui-stats-recent-sessions">
            <SectionHeader title="最近のセッション" />
            {stats.recentSessions.length > 0 ? (
              <div className="ui-list ui-stats-session-list">
                {stats.recentSessions.map((session) => (
                  <ListLinkCard
                    key={session.id}
                    href={`/sessions/${session.id}`}
                    pendingLabel="セッション詳細を開いています..."
                    className="ui-list-link--compact ui-list-link--session"
                  >
                    <div className="ui-list-link__split">
                      <TrainingModeChip mode={session.mode} />
                      <strong className="ui-stats-session-score">
                        {formatScoreLabel(session.sessionScore)}
                      </strong>
                    </div>
                    <span className="ui-muted">
                      回答 {session.answeredQuestionCount} 問 / 正答率{" "}
                      {formatAccuracyLabel(session.accuracyRate)}
                    </span>
                    <span className="ui-muted">
                      完了 {formatDateTimeLabel(session.endedAt)}
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
        <Surface className="ui-stats-auth-empty">
          <Notice tone="warning">
            保存済みの学習統計を見るにはログインしてください。ゲストのセッションは保存されません。
          </Notice>
          <div className="ui-nav-row">
            <ButtonLink
              href="/login"
              variant="secondary"
              pendingLabel="ログイン画面を開いています..."
            >
              ログインして統計を使う
            </ButtonLink>
          </div>
        </Surface>
      )}
    </AppShell>
  );
}

function ComparisonPanel(props: {
  title: string;
  tone: "brand" | "teal" | "amber" | "blue";
  badge?: string;
  stats: Array<{ label: string; value: string }>;
}) {
  return (
    <section className="ui-flat-panel" data-tone={props.tone}>
      <div className="ui-flat-panel__header">
        <strong>{props.title}</strong>
        {props.badge ? (
          <span className="ui-flat-panel__badge">{props.badge}</span>
        ) : null}
      </div>
      <dl className="ui-flat-panel__list">
        {props.stats.map((stat) => (
          <div
            key={`${props.title}-${stat.label}`}
            className="ui-flat-panel__row"
          >
            <dt>{stat.label}</dt>
            <dd>
              <MetricValue
                value={stat.value}
                unit={stat.label === "平均誤差" ? "半音" : undefined}
              />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
