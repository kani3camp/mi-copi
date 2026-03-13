import { Suspense } from "react";

import {
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatDateTimeLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
  formatTrainingModeLabel,
} from "../features/training/model/format";
import { getHomeTrainingSummaryForCurrentUser } from "../features/training/server/getHomeTrainingSummary";
import {
  getCurrentUserOrNullCached,
  hasSessionTokenCookieCached,
} from "../lib/auth/server";
import { HomeSignOutButton } from "./home-sign-out-button";
import { ButtonLink, ListLinkCard } from "./ui/navigation-link";
import {
  AppShell,
  Chip,
  PageHeader,
  SectionHeader,
  SummaryBlock,
  SummaryStat,
  Surface,
  TrainingModeChip,
} from "./ui/primitives";

export default async function HomePage() {
  const hasSessionToken = await hasSessionTokenCookieCached();

  return (
    <AppShell>
      <PageHeader
        title="ミーコピ"
        eyebrow="相対音感トレーニング"
        subtitle="基準音ありの相対音感トレーニングを、短く反復するためのホームです。"
      />

      <div className="ui-stack-md">
        <SectionHeader title="すぐ始める" />
        <div className="ui-grid-cards">
          <ModeEntry
            href="/train/distance"
            label="距離モード"
            title="音程名で答える"
            description="半音距離と反応速度を短く繰り返し鍛えます。"
            pendingLabel="距離モードを開いています..."
            tone="teal"
          />
          <ModeEntry
            href="/train/keyboard"
            label="鍵盤モード"
            title="鍵盤で答える"
            description="基準音の位置を見ながら耳コピ寄りに答えます。"
            pendingLabel="鍵盤モードを開いています..."
            tone="blue"
          />
        </div>
      </div>

      {hasSessionToken ? (
        <Suspense fallback={<HomeSummaryLoading />}>
          <AuthenticatedHomeContent />
        </Suspense>
      ) : (
        <GuestHomeContent />
      )}

      <Surface>
        <SectionHeader title="メニュー" />
        <div className="ui-page-aux-actions">
          <ButtonLink
            href="/settings"
            variant="ghost"
            size="compact"
            pendingLabel="設定を開いています..."
          >
            設定
          </ButtonLink>
          <ButtonLink
            href="/login"
            variant="ghost"
            size="compact"
            pendingLabel="ログイン画面を開いています..."
          >
            {hasSessionToken ? "アカウント" : "ログイン"}
          </ButtonLink>
          {hasSessionToken ? (
            <Suspense fallback={null}>
              <HomeAccountActions />
            </Suspense>
          ) : null}
        </div>
      </Surface>
    </AppShell>
  );
}

function ModeEntry(props: {
  href: string;
  label: string;
  title: string;
  description: string;
  pendingLabel: string;
  tone: "teal" | "blue";
}) {
  return (
    <ListLinkCard
      href={props.href}
      pendingLabel={props.pendingLabel}
      className="ui-list-link--mode"
      data-tone={props.tone}
    >
      <div className="ui-mode-entry__header">
        <TrainingModeChip
          mode={props.tone === "teal" ? "distance" : "keyboard"}
          label={props.label}
        />
      </div>
      <strong>{props.title}</strong>
      <span className="ui-muted">{props.description}</span>
      <div className="ui-mode-entry__footer">
        <span className="ui-mode-entry__cta">練習を始める</span>
      </div>
    </ListLinkCard>
  );
}

async function HomeAccountActions() {
  const currentUser = await getCurrentUserOrNullCached();

  if (!currentUser) {
    return null;
  }

  return <HomeSignOutButton />;
}

async function AuthenticatedHomeContent() {
  const currentUser = await getCurrentUserOrNullCached();

  if (!currentUser) {
    return <GuestHomeContent />;
  }

  const summary = await getHomeTrainingSummaryForCurrentUser({ currentUser });

  return (
    <>
      <Surface>
        <SectionHeader
          title="学習サマリー"
          actions={<Chip tone="blue">保存済みデータ</Chip>}
        />
        <SummaryBlock className="ui-summary-block--insight">
          <SummaryStat
            label="最終学習日時"
            value={
              summary.lastTrainingTime
                ? formatDateTimeLabel(summary.lastTrainingTime)
                : "-"
            }
            detail={
              summary.lastUsedMode
                ? formatTrainingModeLabel(summary.lastUsedMode)
                : "モード未記録"
            }
            emphasis="primary"
            className="ui-summary-stat--brand"
          />
          <SummaryStat
            label="最近の平均誤差"
            value={
              summary.recentAverageError === null
                ? "-"
                : formatAvgErrorLabel(summary.recentAverageError)
            }
            detail="ズレの平均"
            className="ui-summary-stat--coral"
          />
          <SummaryStat
            label="最近の平均回答時間"
            value={
              summary.recentAverageResponseTimeMs === null
                ? "-"
                : formatResponseTimeMsLabel(summary.recentAverageResponseTimeMs)
            }
            detail="反応速度"
            className="ui-summary-stat--blue"
          />
          <SummaryStat
            label="最近のセッションスコア"
            value={
              summary.latestSessionScore === null
                ? "-"
                : formatScoreLabel(summary.latestSessionScore)
            }
            detail="直近の手応え"
            className="ui-summary-stat--teal"
          />
        </SummaryBlock>
      </Surface>

      <Surface>
        <SectionHeader
          title="最近の保存済みセッション"
          actions={
            <ButtonLink
              href="/stats"
              variant="ghost"
              size="compact"
              pendingLabel="統計を開いています..."
            >
              統計を見る
            </ButtonLink>
          }
        />
        {summary.recentSessions.length > 0 ? (
          <div className="ui-list">
            {summary.recentSessions.map((session) => (
              <ListLinkCard
                key={session.id}
                href={`/sessions/${session.id}`}
                pendingLabel="セッション詳細を開いています..."
                className="ui-list-link--compact ui-list-link--session"
              >
                <div className="ui-inline-split">
                  <TrainingModeChip mode={session.mode} />
                  <strong>{formatScoreLabel(session.sessionScore)}</strong>
                </div>
                <span className="ui-muted">
                  正答率 {formatAccuracyLabel(session.accuracyRate)} / 回答数{" "}
                  {session.answeredQuestionCount}
                </span>
                <span className="ui-mini-note">
                  完了 {formatDateTimeLabel(session.endedAt)}
                </span>
              </ListLinkCard>
            ))}
          </div>
        ) : (
          <p className="ui-subtitle">保存済みセッションはまだありません。</p>
        )}
      </Surface>
    </>
  );
}

function GuestHomeContent() {
  return (
    <Surface>
      <SectionHeader
        title="ゲスト利用"
        description="練習はすぐ始められます。保存や統計はログイン後に有効になります。"
      />
      <SummaryBlock>
        <SummaryStat
          label="今できること"
          value="距離モード / 鍵盤モード"
          detail="結果はその場で確認できます。"
          emphasis="primary"
          className="ui-summary-stat--teal"
        />
        <SummaryStat
          label="ログイン後に増えること"
          value="保存 / 統計 / 同期"
          detail="過去の成長を見返せます。"
          className="ui-summary-stat--blue"
        />
      </SummaryBlock>
    </Surface>
  );
}

function HomeSummaryLoading() {
  return (
    <Surface>
      <SectionHeader title="学習サマリーを読み込み中" />
      <p className="ui-subtitle">保存済みの学習情報を取得しています。</p>
    </Surface>
  );
}
