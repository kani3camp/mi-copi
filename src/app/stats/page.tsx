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
              <MetricCard
                label="累計セッション数"
                value={stats.totalSessions}
              />
              <MetricCard
                label="保存済み回答数"
                value={stats.totalSavedQuestionResults}
              />
            </MetricGrid>
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
              <RecentQuestionCard
                label="直近 10 問"
                summary={stats.recentQuestionSummaries.recent10}
              />
              <RecentQuestionCard
                label="直近 30 問"
                summary={stats.recentQuestionSummaries.recent30}
              />
            </div>
          </Surface>

          <Surface>
            <SectionHeader
              title="日次推移"
              description="回答日の単位で平均値をまとめています。日ごとのペースや精度の流れをざっくり追えます。"
            />
            {stats.dailyTrends.length > 0 ? (
              <List as="div">
                {stats.dailyTrends.map((trend) => (
                  <article
                    key={trend.date}
                    className="ui-panel-card ui-panel-card--compact"
                  >
                    <div className="ui-inline-split">
                      <strong>{formatDateLabel(trend.date)}</strong>
                      <span className="ui-muted">{trend.questionCount} 問</span>
                    </div>
                    <MetricGrid className="ui-grid-metrics--compact">
                      <MetricCard
                        label="平均スコア"
                        value={formatScoreLabel(trend.averageScore)}
                        className="ui-metric-card--dense"
                      />
                      <MetricCard
                        label="平均誤差"
                        value={formatAvgErrorLabel(trend.averageError)}
                        className="ui-metric-card--dense"
                      />
                      <MetricCard
                        label="平均回答時間"
                        value={formatResponseTimeMsLabel(
                          trend.averageResponseTimeMs,
                        )}
                        compactValue
                        className="ui-metric-card--dense"
                      />
                      <MetricCard
                        label="正答率"
                        value={formatAccuracyLabel(trend.correctRate)}
                        className="ui-metric-card--dense"
                      />
                    </MetricGrid>
                  </article>
                ))}
              </List>
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
              <List as="div">
                {stats.intervalPerformance.map((interval) => (
                  <article
                    key={interval.intervalSemitones}
                    className="ui-panel-card"
                  >
                    <div className="ui-inline-split">
                      <strong>
                        {getIntervalLabel(
                          interval.intervalSemitones,
                          intervalNotationStyle,
                        )}
                      </strong>
                      <span className="ui-muted">
                        {interval.questionCount} 問
                      </span>
                    </div>
                    <MetricGrid>
                      <MetricCard
                        label="正答率"
                        value={formatAccuracyLabel(interval.correctRate)}
                      />
                      <MetricCard
                        label="平均誤差"
                        value={formatAvgErrorLabel(interval.averageError)}
                      />
                      <MetricCard
                        label="平均回答時間"
                        value={formatResponseTimeMsLabel(
                          interval.averageResponseTimeMs,
                        )}
                        compactValue
                      />
                      <MetricCard
                        label="平均スコア"
                        value={formatScoreLabel(interval.averageScore)}
                      />
                    </MetricGrid>
                  </article>
                ))}
              </List>
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
              <MetricGrid>
                <DirectionPerformanceCard
                  label="上方向"
                  stats={stats.directionPerformance.up}
                />
                <DirectionPerformanceCard
                  label="下方向"
                  stats={stats.directionPerformance.down}
                />
              </MetricGrid>
            </Surface>

            <Surface>
              <SectionHeader
                title="回答傾向"
                description="回答が高めか低めか、または一致しやすいかを全体傾向として見られます。"
              />
              <MetricGrid>
                <BiasMetricCard
                  label="高めに回答"
                  count={stats.answerBias.higherCount}
                  rate={stats.answerBias.higherRate}
                />
                <BiasMetricCard
                  label="低めに回答"
                  count={stats.answerBias.lowerCount}
                  rate={stats.answerBias.lowerRate}
                />
                <BiasMetricCard
                  label="一致"
                  count={stats.answerBias.onTargetCount}
                  rate={stats.answerBias.onTargetRate}
                />
              </MetricGrid>
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

function DirectionPerformanceCard(props: {
  label: string;
  stats: {
    questionCount: number;
    correctRate: number;
    averageError: number;
    averageResponseTimeMs: number;
    averageScore: number;
  };
}) {
  return (
    <MetricCard
      label={props.label}
      value={props.stats.questionCount}
      detail={
        <>
          正答率 {formatAccuracyLabel(props.stats.correctRate)}
          {" / "}平均誤差 {formatAvgErrorLabel(props.stats.averageError)}
          <br />
          平均回答時間{" "}
          {formatResponseTimeMsLabel(props.stats.averageResponseTimeMs)}
          {" / "}平均スコア {formatScoreLabel(props.stats.averageScore)}
        </>
      }
    />
  );
}

function BiasMetricCard(props: { label: string; count: number; rate: number }) {
  return (
    <MetricCard
      label={props.label}
      value={props.count}
      detail={formatAccuracyLabel(props.rate)}
    />
  );
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
        <strong>{props.sessionCount} セッション</strong>
        <span className="ui-muted">
          問題数 {props.questionCount} / 累計スコア{" "}
          {formatScoreLabel(props.cumulativeScore)}
        </span>
        <span className="ui-muted">
          正答率 {formatAccuracyLabel(props.correctRate)}
          {" / "}平均誤差 {formatAvgErrorLabel(props.averageError)}
          {" / "}中央値誤差 {formatAvgErrorLabel(props.medianError)}
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
      <strong>{props.summary.questionCount} 問</strong>
      <span className="ui-muted">
        平均スコア {formatScoreLabel(props.summary.averageScore)}
        {" / "}正答率 {formatAccuracyLabel(props.summary.correctRate)}
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
          <List as="div">
            {props.points.map((point) => (
              <div
                key={`${props.label}-detail-${point.date}`}
                className="ui-kv-card"
              >
                <strong>{formatDateLabel(point.date)}</strong>
                <span className="ui-muted">
                  平均スコア {formatScoreLabel(point.averageScore)}
                </span>
                <span className="ui-muted">{point.questionCount} 問</span>
              </div>
            ))}
          </List>
        </>
      ) : (
        <span className="ui-subtitle">データはまだありません。</span>
      )}
    </div>
  );
}
