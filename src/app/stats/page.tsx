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
  GraphCard,
  Notice,
  PageHeader,
  SectionHeader,
  SummaryBlock,
  SummaryStat,
  Surface,
  TrainingModeLabel,
} from "../ui/primitives";
import { MetricBarChart, MetricLineChart } from "./stats-charts";

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
            <GraphCard title="正答率" subtitle="回答の安定度">
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
            <GraphCard title="平均誤差" subtitle="ズレの大きさ">
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
            <GraphCard title="平均回答時間" subtitle="反応速度">
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
          >
            <MetricBarChart
              title="音程別の平均誤差"
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
                      <TrainingModeLabel mode={session.mode} />
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
    6: "増4",
    7: "完5",
    8: "短6",
    9: "長6",
    10: "短7",
    11: "長7",
    12: "完8",
  };

  return labels[semitones] ?? `${semitones}半`;
}
