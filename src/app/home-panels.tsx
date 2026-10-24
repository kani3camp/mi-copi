import type { ReactNode } from "react";

import {
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatDateTimeLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
  formatTrainingModeLabel,
} from "../features/training/model/format";
import type { HomeTrainingSummary } from "../features/training/server/getHomeTrainingSummary";
import { ButtonLink, ListLinkCard } from "./ui/navigation-link";
import { PageHeader, SectionHeader } from "./ui/primitives";

export function HomeHeader(props: { isAuthenticated: boolean }) {
  return (
    <PageHeader
      title="ミーコピ"
      subtitle="相対音感トレーニング"
      className="ui-home-header"
      actions={
        <nav className="ui-home-nav" aria-label="アカウントと設定">
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
        </nav>
      }
    />
  );
}

export function HomeTrainingEntries(props: { isAuthenticated: boolean }) {
  return (
    <section className="ui-home-training" aria-label="練習を始める">
      <div className="ui-home-entries">
        <HomeModeEntry
          mode="distance"
          title="音程名で答える"
          description="基準音からの距離を選ぶ"
        />
        <HomeModeEntry
          mode="keyboard"
          title="鍵盤で答える"
          description="基準の位置から音を選ぶ"
        />
      </div>
      {props.isAuthenticated ? null : (
        <div className="ui-home-guest">
          <p>ゲスト利用中は結果が保存されません。</p>
          <ButtonLink
            href="/login"
            variant="ghost"
            size="compact"
            pendingLabel="ログイン画面を開いています..."
          >
            ログインして記録を残す
          </ButtonLink>
        </div>
      )}
    </section>
  );
}

function HomeModeEntry(props: {
  mode: "distance" | "keyboard";
  title: string;
  description: string;
}) {
  return (
    <ListLinkCard
      href={`/train/${props.mode}`}
      pendingLabel={`${formatTrainingModeLabel(props.mode)}を開いています...`}
      className="ui-home-entry"
      aria-label={`${formatTrainingModeLabel(props.mode)}の練習を始める`}
    >
      <span className="ui-home-entry__mode">
        {formatTrainingModeLabel(props.mode)}
      </span>
      <ModeIllustration mode={props.mode} />
      <div className="ui-home-entry__copy">
        <h2>{props.title}</h2>
        <p>{props.description}</p>
      </div>
      <span
        className="ui-button ui-button--primary ui-home-entry__start"
        aria-hidden="true"
      >
        練習を始める
      </span>
    </ListLinkCard>
  );
}

function ModeIllustration(props: { mode: "distance" | "keyboard" }) {
  return (
    <svg
      className="ui-home-illustration"
      viewBox="0 0 140 44"
      aria-hidden="true"
      focusable="false"
    >
      {props.mode === "distance" ? (
        <>
          <path
            className="ui-home-illustration__line"
            d="M10 22H130 M38 17V27 M61 17V27 M84 17V27 M107 17V27 M130 13V31"
          />
          <path
            className="ui-home-illustration__reference"
            d="M10 14L18 22L10 30L2 22Z"
          />
        </>
      ) : (
        <>
          {[0, 1, 2, 3, 4, 5, 6].map((key) => (
            <rect
              key={key}
              className="ui-home-illustration__white"
              x={5 + key * 18}
              y="5"
              width="16"
              height="34"
              rx="2"
            />
          ))}
          <path
            className="ui-home-illustration__reference"
            d="M5 34H21V39H5Z"
          />
          {[0, 1, 3, 4, 5].map((key) => (
            <rect
              key={key}
              className="ui-home-illustration__black"
              x={17 + key * 18}
              y="5"
              width="10"
              height="21"
              rx="1"
            />
          ))}
        </>
      )}
    </svg>
  );
}

export function HomeRecords(props: {
  summary: HomeTrainingSummary;
  signOut?: ReactNode;
}) {
  const { summary } = props;
  return (
    <div className="ui-home-records">
      <section className="ui-home-records__summary" aria-label="学習の記録">
        <SectionHeader
          title="学習の記録"
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
        <div className="ui-home-headline">
          <div className="ui-home-score">
            <span>最近のセッションスコア</span>
            <strong>
              {summary.latestSessionScore === null
                ? "—"
                : formatScoreLabel(summary.latestSessionScore)}
            </strong>
          </div>
          <dl className="ui-home-last-training">
            <div>
              <dt>最終学習日時</dt>
              <dd>
                {summary.lastTrainingTime ? (
                  <time dateTime={summary.lastTrainingTime}>
                    {formatDateTimeLabel(summary.lastTrainingTime)}
                  </time>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt>モード</dt>
              <dd>
                {summary.lastUsedMode
                  ? formatTrainingModeLabel(summary.lastUsedMode)
                  : "モード未記録"}
              </dd>
            </div>
          </dl>
          <dl className="ui-home-averages">
            <div>
              <dt>最近の平均誤差</dt>
              <dd>
                <strong>
                  {summary.recentAverageError === null
                    ? "—"
                    : formatAvgErrorLabel(summary.recentAverageError)}
                </strong>
                {summary.recentAverageError === null ? null : <span>半音</span>}
              </dd>
            </div>
            <div>
              <dt>最近の平均回答時間</dt>
              <dd>
                <strong>
                  {summary.recentAverageResponseTimeMs === null
                    ? "—"
                    : formatResponseTimeMsLabel(
                        summary.recentAverageResponseTimeMs,
                      ).replace(/ ms$/, "")}
                </strong>
                {summary.recentAverageResponseTimeMs === null ? null : (
                  <span>ms</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </section>
      <section
        className="ui-home-history"
        aria-label="最近の保存済みセッション"
      >
        <SectionHeader title="最近の保存済みセッション" />
        {summary.recentSessions.length > 0 ? (
          <div className="ui-home-history__list">
            {summary.recentSessions.map((session) => (
              <ListLinkCard
                key={session.id}
                href={`/sessions/${session.id}`}
                pendingLabel="セッション詳細を開いています..."
                className="ui-home-session"
              >
                <div className="ui-home-session__copy">
                  <strong>{formatTrainingModeLabel(session.mode)}</strong>
                  <span>
                    正答率 {formatAccuracyLabel(session.accuracyRate)} · 回答数{" "}
                    {session.answeredQuestionCount}
                  </span>
                  <time dateTime={session.endedAt}>
                    {formatDateTimeLabel(session.endedAt)}
                  </time>
                </div>
                <strong className="ui-home-session__score">
                  <span className="sr-only">スコア </span>
                  {formatScoreLabel(session.sessionScore)}
                </strong>
              </ListLinkCard>
            ))}
          </div>
        ) : (
          <p className="ui-home-empty">保存済みセッションはまだありません。</p>
        )}
      </section>
      {props.signOut ? (
        <div className="ui-home-sign-out">{props.signOut}</div>
      ) : null}
    </div>
  );
}
