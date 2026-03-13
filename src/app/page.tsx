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
} from "./ui/primitives";

export default async function HomePage() {
  const hasSessionToken = await hasSessionTokenCookieCached();

  return (
    <AppShell>
      <PageHeader
        title="ミーコピ"
        eyebrow="Relative Pitch Trainer"
        subtitle="基準音ありの相対音感トレーニングを、短く反復するためのホームです。"
        actions={
          <>
            <ButtonLink
              href="/settings"
              variant="ghost"
              pendingLabel="設定を開いています..."
            >
              設定
            </ButtonLink>
            <ButtonLink
              href="/login"
              variant="ghost"
              pendingLabel="ログイン画面を開いています..."
            >
              {hasSessionToken ? "アカウント" : "ログイン"}
            </ButtonLink>
            {hasSessionToken ? (
              <Suspense fallback={null}>
                <HomeAccountActions />
              </Suspense>
            ) : null}
          </>
        }
      />

      <Surface tone="accent">
        <SectionHeader
          title="すぐ始める"
          description="距離モードと鍵盤モードを同じ重みで配置しています。"
        />
        <div className="ui-grid-cards">
          <ModeEntry
            href="/train/distance"
            label="距離モード"
            title="音程名で答える"
            description="半音距離の理解と反応速度を鍛えるモードです。"
            pendingLabel="距離モードを開いています..."
            tone="brand"
          />
          <ModeEntry
            href="/train/keyboard"
            label="鍵盤モード"
            title="鍵盤で答える"
            description="基準音の位置を見ながら耳コピ寄りに答えるモードです。"
            pendingLabel="鍵盤モードを開いています..."
            tone="teal"
          />
        </div>
      </Surface>

      {hasSessionToken ? (
        <Suspense fallback={<HomeSummaryLoading />}>
          <AuthenticatedHomeContent />
        </Suspense>
      ) : (
        <GuestHomeContent />
      )}
    </AppShell>
  );
}

function ModeEntry(props: {
  href: string;
  label: string;
  title: string;
  description: string;
  pendingLabel: string;
  tone: "brand" | "teal";
}) {
  return (
    <ListLinkCard
      href={props.href}
      pendingLabel={props.pendingLabel}
      className="ui-list-link--mode"
    >
      <Chip tone={props.tone}>{props.label}</Chip>
      <strong>{props.title}</strong>
      <span className="ui-muted">{props.description}</span>
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
          actions={<Chip tone="brand">保存済み</Chip>}
        />
        <SummaryBlock>
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
          />
          <SummaryStat
            label="最近の平均誤差"
            value={
              summary.recentAverageError === null
                ? "-"
                : formatAvgErrorLabel(summary.recentAverageError)
            }
          />
          <SummaryStat
            label="最近の平均回答時間"
            value={
              summary.recentAverageResponseTimeMs === null
                ? "-"
                : formatResponseTimeMsLabel(summary.recentAverageResponseTimeMs)
            }
          />
          <SummaryStat
            label="最近のセッションスコア"
            value={
              summary.latestSessionScore === null
                ? "-"
                : formatScoreLabel(summary.latestSessionScore)
            }
          />
        </SummaryBlock>
      </Surface>

      <Surface>
        <SectionHeader
          title="最近の保存済みセッション"
          actions={
            <ButtonLink href="/stats" pendingLabel="統計を開いています...">
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
                className="ui-list-link--compact"
              >
                <Chip tone={session.mode === "distance" ? "brand" : "teal"}>
                  {formatTrainingModeLabel(session.mode)}
                </Chip>
                <span className="ui-muted">
                  スコア {formatScoreLabel(session.sessionScore)} / 正答率{" "}
                  {formatAccuracyLabel(session.accuracyRate)} / 回答数{" "}
                  {session.answeredQuestionCount}
                </span>
                <span className="ui-muted">
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
        />
        <SummaryStat
          label="ログイン後に増えること"
          value="保存 / 統計 / 同期"
          detail="過去の成長を見返せます。"
        />
      </SummaryBlock>
      <div className="ui-nav-row">
        <ButtonLink
          href="/login"
          variant="primary"
          pendingLabel="ログイン画面を開いています..."
        >
          ログインして履歴を残す
        </ButtonLink>
        <ButtonLink href="/settings" pendingLabel="設定を開いています...">
          設定を見る
        </ButtonLink>
      </div>
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
