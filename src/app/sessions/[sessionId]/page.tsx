import { notFound } from "next/navigation";

import { getGlobalUserSettingsForCurrentUser } from "../../../features/settings/server/global-user-settings";
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
import { getTrainingSessionDetailForCurrentUser } from "../../../features/training/server/getTrainingSessionDetail";
import { getCurrentUserOrNullCached } from "../../../lib/auth/server";
import { ButtonLink } from "../../ui/navigation-link";
import {
  AppShell,
  Chip,
  List,
  PageHero,
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

interface TrainingSessionDetailPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function TrainingSessionDetailPage({
  params,
}: TrainingSessionDetailPageProps) {
  const { sessionId } = await params;
  const currentUser = await getCurrentUserOrNullCached();
  const [detail, globalSettings] = await Promise.all([
    getTrainingSessionDetailForCurrentUser(sessionId, { currentUser }),
    getGlobalUserSettingsForCurrentUser({ currentUser }),
  ]);

  if (!detail) {
    notFound();
  }

  const intervalNotationStyle = globalSettings.settings.intervalNotationStyle;
  const configGroups = createSessionDetailConfigGroups(detail);

  return (
    <AppShell narrow>
      <PageHero
        title="セッション詳細"
        eyebrow="保存済みセッション"
        subtitle="スコア、設定、各回答を順に振り返ります。"
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
          description="保存済みセッションの主要指標です。"
          actions={<TrainingModeChip mode={detail.mode} />}
        />
        <div className="ui-session-summary-hero">
          <div className="ui-result-hero ui-session-score-hero">
            <span className="ui-result-hero__label">セッションスコア</span>
            <strong className="ui-result-hero__value">
              {formatScoreLabel(detail.sessionScore)}
            </strong>
            <span className="ui-result-hero__meta">
              {detail.answeredQuestionCount} 問 / 完了{" "}
              {formatDateTimeLabel(detail.endedAt)}
            </span>
          </div>
          <SummaryBlock className="ui-summary-block--insight ui-session-summary-stats">
            <SummaryStat
              label="正答率"
              value={formatAccuracyLabel(detail.accuracyRate)}
              detail={`${detail.correctQuestionCount} / ${detail.answeredQuestionCount} 問`}
              tone="success"
            />
            <SummaryStat
              label="平均誤差"
              value={formatAvgErrorLabel(detail.avgErrorAbs)}
              detail="ズレの平均"
              tone="error"
            />
            <SummaryStat
              label="平均回答時間"
              value={formatResponseTimeMsLabel(detail.avgResponseTimeMs)}
              detail="反応速度"
              tone="info"
            />
            <SummaryStat
              label="保存日時"
              value={formatDateTimeLabel(detail.createdAt)}
            />
          </SummaryBlock>
        </div>
      </Surface>

      <Surface>
        <SectionHeader
          title="設定スナップショット"
          description="保存時点の出題条件です。"
        />
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
        <SectionHeader
          title="回答結果"
          description="正解、回答、誤差、回答時間を問題ごとに確認します。"
        />
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
                  <dl className="ui-detail-result-item__grid">
                    {detail.mode === "distance" ? (
                      <>
                        <div
                          className="ui-detail-result-item__fact"
                          data-tone="brand"
                        >
                          <dt>正解</dt>
                          <dd>
                            {getIntervalLabel(
                              result.targetIntervalSemitones,
                              intervalNotationStyle,
                            )}
                          </dd>
                        </div>
                        <div
                          className="ui-detail-result-item__fact"
                          data-tone="teal"
                        >
                          <dt>回答</dt>
                          <dd>
                            {getIntervalLabel(
                              result.answerIntervalSemitones,
                              intervalNotationStyle,
                            )}
                          </dd>
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          className="ui-detail-result-item__fact"
                          data-tone="brand"
                        >
                          <dt>正解</dt>
                          <dd>{result.targetNoteName}</dd>
                        </div>
                        <div
                          className="ui-detail-result-item__fact"
                          data-tone="teal"
                        >
                          <dt>回答</dt>
                          <dd>{result.answerNoteName}</dd>
                        </div>
                      </>
                    )}
                    <div
                      className="ui-detail-result-item__fact"
                      data-tone="blue"
                    >
                      <dt>誤差</dt>
                      <dd>
                        {detail.mode === "distance"
                          ? formatSignedSemitoneLabel(result.errorSemitones)
                          : formatAvgErrorLabel(
                              Math.abs(result.errorSemitones),
                            )}
                      </dd>
                    </div>
                    <div
                      className="ui-detail-result-item__fact"
                      data-tone="blue"
                    >
                      <dt>回答時間</dt>
                      <dd>
                        {formatResponseTimeMsLabel(result.responseTimeMs)}
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
