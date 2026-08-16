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
  type CurrentUser,
  getCurrentUserOrNullCached,
} from "../lib/auth/server";
import { HomeSignOutButton } from "./home-sign-out-button";
import { ButtonLink, ListLinkCard } from "./ui/navigation-link";
import {
  ActionCard,
  AppShell,
  Chip,
  PageHero,
  SectionHeader,
  SummaryBlock,
  SummaryStat,
  Surface,
  TrainingModeChip,
} from "./ui/primitives";

export default async function HomePage() {
  const currentUser = await getCurrentUserOrNullCached();
  const isAuthenticated = currentUser !== null;

  return (
    <AppShell>
      <PageHero
        title="ミーコピ"
        eyebrow="相対音感トレーニング"
        subtitle="基準音からの差を、短いループで耳コピ向けに整えていくホームです。"
        actions={<HomeHeaderActions isAuthenticated={isAuthenticated} />}
      >
        <div className="ui-cluster">
          <Chip tone="brand">スマホ縦向き優先</Chip>
          <Chip tone="neutral">基準音あり</Chip>
          <Chip tone="neutral">短い反復</Chip>
        </div>
      </PageHero>

      <Surface tone="accent" className="ui-home-start-surface">
        <SectionHeader
          title="すぐ始める"
          description="練習開始の導線を上に集めています。モードを選んで、そのまま短く回せます。"
        />
        <div className="ui-grid-cards ui-home-mode-grid">
          <ModeEntry
            href="/train/distance"
            mode="distance"
            title="音程名で答える"
            description="半音距離と反応速度を短く繰り返し鍛えます。"
            pendingLabel="距離モードを開いています..."
          />
          <ModeEntry
            href="/train/keyboard"
            mode="keyboard"
            title="鍵盤で答える"
            description="基準音の位置を見ながら耳コピ寄りに答えます。"
            pendingLabel="鍵盤モードを開いています..."
          />
        </div>
        {isAuthenticated ? null : <HomeGuestLoginCta />}
      </Surface>

      {isAuthenticated ? (
        <Suspense fallback={<HomeSummaryLoading />}>
          <AuthenticatedHomeContent currentUser={currentUser} />
        </Suspense>
      ) : (
        <GuestHomeContent />
      )}
    </AppShell>
  );
}

function ModeEntry(props: {
  href: string;
  mode: "distance" | "keyboard";
  title: string;
  description: string;
  pendingLabel: string;
}) {
  return (
    <ActionCard
      tone="brand"
      className={
        props.mode === "keyboard" ? "ui-home-mode-card--secondary" : undefined
      }
      eyebrow={<Chip tone="brand">{formatTrainingModeLabel(props.mode)}</Chip>}
      title={props.title}
      description={props.description}
      footer={
        <div className="ui-stack-sm">
          <p className="ui-mini-note">
            {props.mode === "distance"
              ? "音程名で即答するテンポ重視の練習です。"
              : "基準音の位置を見ながら答える耳コピ寄りの練習です。"}
          </p>
          <ButtonLink
            href={props.href}
            pendingLabel={props.pendingLabel}
            variant="primary"
            block
          >
            練習を始める
          </ButtonLink>
        </div>
      }
    />
  );
}

function HomeHeaderActions(props: { isAuthenticated: boolean }) {
  return (
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
        {props.isAuthenticated ? "アカウント" : "ログイン"}
      </ButtonLink>
      {props.isAuthenticated ? <HomeSignOutButton /> : null}
    </div>
  );
}

function HomeGuestLoginCta() {
  return (
    <ActionCard
      className="ui-home-login-card"
      eyebrow={<Chip tone="warning">保存なし</Chip>}
      title="ログインすると結果を残せます"
      description="ゲストでも練習は始められます。保存や統計を使うときだけログインすれば十分です。"
      footer={
        <ButtonLink
          href="/login"
          pendingLabel="ログイン画面を開いています..."
          variant="secondary"
          block
        >
          ログインして結果を保存
        </ButtonLink>
      }
    />
  );
}

async function AuthenticatedHomeContent(props: { currentUser: CurrentUser }) {
  const summary = await getHomeTrainingSummaryForCurrentUser({
    currentUser: props.currentUser,
  });

  return (
    <>
      <Surface tone="elevated">
        <SectionHeader
          title="学習サマリー"
          description="スコアを主指標にしつつ、ズレと反応速度も同じ視線で追えます。"
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
        <SummaryBlock className="ui-summary-block--insight ui-home-summary-grid">
          <SummaryStat
            label="最近のセッションスコア"
            value={
              summary.latestSessionScore === null
                ? "-"
                : formatScoreLabel(summary.latestSessionScore)
            }
            detail="直近の手応え"
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
          />
          <SummaryStat
            label="最近の平均回答時間"
            value={
              summary.recentAverageResponseTimeMs === null
                ? "-"
                : formatResponseTimeMsLabel(summary.recentAverageResponseTimeMs)
            }
            detail="反応速度"
          />
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
          />
        </SummaryBlock>
      </Surface>

      <Surface tone="elevated">
        <SectionHeader title="最近の保存済みセッション" />
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
    <Surface tone="elevated">
      <SectionHeader
        title="ゲスト利用"
        description="練習はすぐ始められます。保存や統計はログイン後に有効になります。"
      />
      <SummaryBlock className="ui-home-summary-grid">
        <SummaryStat
          label="今できること"
          value="距離モード / 鍵盤モード"
          detail="結果はその場で確認できます。"
          emphasis="primary"
          className="ui-summary-stat--brand"
        />
        <SummaryStat
          label="ログイン後に増えること"
          value="保存 / 統計 / 同期"
          detail="過去の成長を見返せます。"
        />
      </SummaryBlock>
    </Surface>
  );
}

function HomeSummaryLoading() {
  return (
    <Surface tone="elevated">
      <SectionHeader title="学習サマリーを読み込み中" />
      <p className="ui-subtitle">保存済みの学習情報を取得しています。</p>
    </Surface>
  );
}
