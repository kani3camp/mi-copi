import type { IntervalNotationStyle } from "../../../features/settings/model/global-user-settings";
import {
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatDateTimeLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
} from "../../../features/training/model/format";
import {
  formatQuestionDirectionLabel,
  formatSignedSemitoneLabel,
  getIntervalLabel,
} from "../../../features/training/model/interval-notation";
import type { TrainingSessionDetail } from "../../../features/training/server/getTrainingSessionDetail";
import { AnswerComparison } from "../../ui/answer-comparison";
import { MetricValue } from "../../ui/metric-value";
import { ButtonLink } from "../../ui/navigation-link";
import {
  AppShell,
  Chip,
  List,
  PageHeader,
  SectionHeader,
  SummaryBlock,
  SummaryStat,
  Surface,
  TrainingModeChip,
} from "../../ui/primitives";
import {
  createSessionDetailConfigGroups,
  getSessionDetailEvaluation,
} from "./session-detail-view-model";

export function SessionDetailPanels({
  detail,
  intervalNotationStyle,
}: {
  detail: TrainingSessionDetail;
  intervalNotationStyle: IntervalNotationStyle;
}) {
  const configGroups = createSessionDetailConfigGroups(detail);

  return (
    <AppShell narrow className="ui-records-shell ui-detail-shell">
      <PageHeader
        title="セッション詳細"
        actions={
          <>
            <ButtonLink
              href="/"
              variant="ghost"
              size="compact"
              pendingLabel="ホームを開いています..."
            >
              ホームへ戻る
            </ButtonLink>
            <ButtonLink
              href="/stats"
              variant="ghost"
              size="compact"
              pendingLabel="統計を開いています..."
            >
              統計を見る
            </ButtonLink>
          </>
        }
      />

      <Surface tone="accent" className="ui-session-summary-surface">
        <SectionHeader
          title="セッションサマリー"
          actions={<TrainingModeChip mode={detail.mode} />}
        />
        <div className="ui-session-summary-hero">
          <div className="ui-result-hero ui-session-score-hero">
            <span className="ui-result-hero__label">セッションスコア</span>
            <strong className="ui-result-hero__value">
              {formatScoreLabel(detail.sessionScore)}
            </strong>
          </div>
          <SummaryBlock className="ui-summary-block--insight ui-session-summary-stats">
            <SummaryStat
              label="正答率"
              value={
                <MetricValue value={formatAccuracyLabel(detail.accuracyRate)} />
              }
              detail={`${detail.correctQuestionCount} / ${detail.answeredQuestionCount} 問`}
            />
            <SummaryStat
              label="回答数"
              value={
                <MetricValue value={detail.answeredQuestionCount} unit="問" />
              }
            />
            <SummaryStat
              label="平均誤差"
              value={
                <MetricValue
                  value={formatAvgErrorLabel(detail.avgErrorAbs)}
                  unit="半音"
                />
              }
            />
            <SummaryStat
              label="平均回答時間"
              value={
                <MetricValue
                  value={formatResponseTimeMsLabel(detail.avgResponseTimeMs)}
                />
              }
            />
          </SummaryBlock>
        </div>
        <dl className="ui-session-dates">
          <div>
            <dt>完了日時</dt>
            <dd>{formatDateTimeLabel(detail.endedAt)}</dd>
          </div>
          <div>
            <dt>保存日時</dt>
            <dd>{formatDateTimeLabel(detail.createdAt)}</dd>
          </div>
        </dl>
      </Surface>

      <Surface>
        <SectionHeader title="設定スナップショット" />
        <div className="ui-session-config-groups">
          {configGroups.map((group) => (
            <section key={group.title} className="ui-session-config-group">
              <h3 className="ui-session-config-group__title">{group.title}</h3>
              <dl className="ui-detail-kv-list">
                {group.rows.map((row) => (
                  <div key={row.label} className="ui-detail-kv-row">
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </Surface>

      <Surface>
        <SectionHeader title="回答結果" />
        {detail.results.length > 0 ? (
          <List as="div" className="ui-detail-result-list">
            {detail.results.map((result) => {
              const evaluation = getSessionDetailEvaluation(result);

              return (
                <article key={result.id} className="ui-detail-result-item">
                  <div className="ui-detail-result-item__header">
                    <div className="ui-stack-sm">
                      <strong>問題 {result.questionIndex + 1}</strong>
                      <span className="ui-muted">
                        {formatQuestionDirectionLabel(result.direction)} /
                        基準音 {result.baseNoteName}
                      </span>
                    </div>
                    <Chip tone={evaluation.tone}>{evaluation.label}</Chip>
                  </div>
                  <AnswerComparison
                    notation={detail.mode === "keyboard" ? "note" : "text"}
                    correct={
                      detail.mode === "distance"
                        ? getIntervalLabel(
                            result.targetIntervalSemitones,
                            intervalNotationStyle,
                          )
                        : result.targetNoteName
                    }
                    answer={
                      detail.mode === "distance"
                        ? getIntervalLabel(
                            result.answerIntervalSemitones,
                            intervalNotationStyle,
                          )
                        : result.answerNoteName
                    }
                  />
                  <dl className="ui-detail-result-metrics">
                    <div>
                      <dt>誤差</dt>
                      <dd>
                        <MetricValue
                          value={
                            detail.mode === "distance"
                              ? formatSignedSemitoneLabel(result.errorSemitones)
                              : formatAvgErrorLabel(
                                  Math.abs(result.errorSemitones),
                                )
                          }
                          unit={detail.mode === "keyboard" ? "半音" : undefined}
                        />
                      </dd>
                    </div>
                    <div>
                      <dt>回答時間</dt>
                      <dd>
                        <MetricValue
                          value={formatResponseTimeMsLabel(
                            result.responseTimeMs,
                          )}
                        />
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </List>
        ) : (
          <p className="ui-subtitle">回答結果はまだありません。</p>
        )}
      </Surface>
    </AppShell>
  );
}
