import Link from "next/link";

import {
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatDateTimeLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
  formatTrainingModeLabel,
} from "../features/training/model/format";
import { getHomeTrainingSummaryForCurrentUser } from "../features/training/server/getHomeTrainingSummary";
import { HomeSignOutButton } from "./home-sign-out-button";
import {
  AppShell,
  ButtonLink,
  Chip,
  KeyValueCard,
  KeyValueGrid,
  List,
  ListLinkCard,
  MetricCard,
  MetricGrid,
  PageHero,
  SectionHeader,
  Surface,
} from "./ui/primitives";

export default async function HomePage() {
  const summary = await getHomeTrainingSummaryForCurrentUser();

  return (
    <AppShell>
      <PageHero
        title="ミーコピ"
        eyebrow="Relative Pitch MVP"
        subtitle="基準音ありの相対音感トレーニングを、スマホで短く反復できるホームです。次の練習開始と、保存済みの成長確認をここから行えます。"
        actions={
          <>
            <ButtonLink href="/settings">設定</ButtonLink>
            <ButtonLink href="/login">
              {summary.isAuthenticated ? "アカウント" : "ログイン"}
            </ButtonLink>
            {summary.isAuthenticated ? <HomeSignOutButton /> : null}
          </>
        }
      >
        <div className="ui-grid-cards">
          <TrainModeCard
            href="/train/distance"
            eyebrow="距離モード"
            title="音程名で答える"
            description="音程名で答える反復練習。誤差と回答速度をすぐ確認できます。"
          />
          <TrainModeCard
            href="/train/keyboard"
            eyebrow="鍵盤モード"
            title="鍵盤で答える"
            description="鍵盤で問題音を答える練習。黒鍵込みで耳コピ寄りに試せます。"
          />
        </div>
      </PageHero>

      {summary.isAuthenticated ? (
        <>
          <Surface tone="accent">
            <SectionHeader
              title="学習サマリー"
              description="直近の保存済みセッションから、最後の状態と最近の精度感をすばやく確認できます。"
              actions={<Chip tone="success">保存済みデータあり</Chip>}
            />
            <MetricGrid>
              <MetricCard
                label="最終学習日時"
                value={
                  summary.lastTrainingTime
                    ? formatDateTimeLabel(summary.lastTrainingTime)
                    : "-"
                }
                compactValue
                accent
                className="ui-metric-card--home-summary"
              />
              <MetricCard
                label="最後に使ったモード"
                value={
                  summary.lastUsedMode
                    ? formatTrainingModeLabel(summary.lastUsedMode)
                    : "-"
                }
                compactValue
                className="ui-metric-card--home-summary"
              />
              <MetricCard
                label="直近セッションスコア"
                value={
                  summary.latestSessionScore === null
                    ? "-"
                    : formatScoreLabel(summary.latestSessionScore)
                }
              />
              <MetricCard
                label="最近の平均誤差"
                value={
                  summary.recentAverageError === null
                    ? "-"
                    : formatAvgErrorLabel(summary.recentAverageError)
                }
              />
              <MetricCard
                label="最近の平均回答時間"
                value={
                  summary.recentAverageResponseTimeMs === null
                    ? "-"
                    : formatResponseTimeMsLabel(
                        summary.recentAverageResponseTimeMs,
                      )
                }
                compactValue
              />
              <MetricCard
                label="累計セッション数"
                value={summary.totalSessions}
              />
              <MetricCard
                label="保存済み回答数"
                value={summary.totalSavedQuestionResults}
              />
            </MetricGrid>
          </Surface>

          <Surface>
            <SectionHeader
              title="最近の保存済みセッション"
              description="前回の仕上がりを見てから次の練習に入れます。"
              actions={<ButtonLink href="/stats">統計を見る</ButtonLink>}
            />
            {summary.recentSessions.length > 0 ? (
              <List>
                {summary.recentSessions.map((session) => (
                  <li key={session.id}>
                    <ListLinkCard href={`/sessions/${session.id}`}>
                      <Chip tone={getTrainingModeChipTone(session.mode)}>
                        {formatTrainingModeLabel(session.mode)}
                      </Chip>
                      <span className="ui-muted">
                        スコア {formatScoreLabel(session.sessionScore)} / 正答率{" "}
                        {formatAccuracyLabel(session.accuracyRate)} / 問題数{" "}
                        {session.answeredQuestionCount}
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
        <Surface>
          <SectionHeader
            title="ゲスト利用中"
            description="練習はすぐ始められますが、ホームと統計の保存サマリーはログイン後に有効になります。"
          />
          <KeyValueGrid>
            <KeyValueCard
              label="今できること"
              value="距離モードと鍵盤モードの練習"
              detail="結果はその場で確認できます。"
            />
            <KeyValueCard
              label="ログイン後に増えること"
              value="保存、統計、設定のクラウド同期"
              detail="過去の推移を後から見返せます。"
            />
          </KeyValueGrid>
          <div className="ui-nav-row">
            <ButtonLink href="/login" variant="primary">
              ログインして履歴を残す
            </ButtonLink>
            <ButtonLink href="/settings">設定を見る</ButtonLink>
          </div>
        </Surface>
      )}
    </AppShell>
  );
}

function getTrainingModeChipTone(mode: "distance" | "keyboard") {
  return mode === "distance" ? "info" : "active";
}

function TrainModeCard(props: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={props.href} className="ui-list-link">
      <span className="ui-hero__eyebrow">{props.eyebrow}</span>
      <strong>{props.title}</strong>
      <span className="ui-muted">{props.description}</span>
    </Link>
  );
}
