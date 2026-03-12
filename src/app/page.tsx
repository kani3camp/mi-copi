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
  cardStyle,
  listLinkStyle,
  listStyle,
  metricCardStyle,
  metricLabelStyle,
  metricsGridStyle,
  metricValueStyle,
  navLinkStyle,
  navRowStyle,
  pageHeroStyle,
  pageShellStyle,
  pageSubtitleStyle,
  pageTitleStyle,
  sectionTitleStyle,
  subtleTextStyle,
} from "./ui/polish";

export default async function HomePage() {
  const summary = await getHomeTrainingSummaryForCurrentUser();
  const compactMetricValueStyle = { ...metricValueStyle, fontSize: "22px" };

  return (
    <main style={pageShellStyle}>
      <header style={pageHeroStyle}>
        <h1 style={pageTitleStyle}>ミーコピ</h1>
        <p style={pageSubtitleStyle}>
          基準音ありの相対音感トレーニングを、短い反復で回せる MVP
          ホームです。保存済みデータがある場合は直近の状態もここで確認できます。
        </p>
        <div style={navRowStyle}>
          <Link href="/train/distance" style={navLinkStyle}>
            距離モード
          </Link>
          <Link href="/train/keyboard" style={navLinkStyle}>
            鍵盤モード
          </Link>
          {summary.isAuthenticated ? (
            <Link href="/stats" style={navLinkStyle}>
              統計
            </Link>
          ) : null}
          <Link href="/settings" style={navLinkStyle}>
            設定
          </Link>
          <Link href="/login" style={navLinkStyle}>
            {summary.isAuthenticated ? "アカウント" : "ログイン"}
          </Link>
          {summary.isAuthenticated ? <HomeSignOutButton /> : null}
        </div>
      </header>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>学習サマリー</h2>
        {summary.isAuthenticated ? (
          <>
            <p style={subtleTextStyle}>
              直近の保存済みセッションから、最後の学習状態と最近の精度感を確認できます。
            </p>
            <div style={metricsGridStyle}>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>最終学習日時</span>
                <span style={compactMetricValueStyle}>
                  {summary.lastTrainingTime
                    ? formatDateTimeLabel(summary.lastTrainingTime)
                    : "-"}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>最後に使ったモード</span>
                <span style={metricValueStyle}>
                  {summary.lastUsedMode
                    ? formatTrainingModeLabel(summary.lastUsedMode)
                    : "-"}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>直近セッションスコア</span>
                <span style={metricValueStyle}>
                  {summary.latestSessionScore === null
                    ? "-"
                    : formatScoreLabel(summary.latestSessionScore)}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>最近の平均誤差</span>
                <span style={metricValueStyle}>
                  {summary.recentAverageError === null
                    ? "-"
                    : formatAvgErrorLabel(summary.recentAverageError)}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>最近の平均回答時間</span>
                <span style={compactMetricValueStyle}>
                  {summary.recentAverageResponseTimeMs === null
                    ? "-"
                    : formatResponseTimeMsLabel(
                        summary.recentAverageResponseTimeMs,
                      )}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>累計セッション数</span>
                <span style={metricValueStyle}>{summary.totalSessions}</span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>保存済み回答数</span>
                <span style={metricValueStyle}>
                  {summary.totalSavedQuestionResults}
                </span>
              </div>
            </div>

            {summary.recentSessions.length > 0 ? (
              <>
                <h3
                  style={{
                    ...sectionTitleStyle,
                    fontSize: "18px",
                  }}
                >
                  最近の保存済みセッション
                </h3>
                <ul style={listStyle}>
                  {summary.recentSessions.map((session) => (
                    <li key={session.id}>
                      <Link
                        href={`/sessions/${session.id}`}
                        style={listLinkStyle}
                      >
                        <strong style={{ fontSize: "16px" }}>
                          {formatTrainingModeLabel(session.mode)}
                        </strong>
                        <span style={subtleTextStyle}>
                          スコア {formatScoreLabel(session.sessionScore)} /
                          正答率 {formatAccuracyLabel(session.accuracyRate)} /
                          問題数 {session.answeredQuestionCount}
                        </span>
                        <span style={subtleTextStyle}>
                          完了日時 {formatDateTimeLabel(session.endedAt)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p style={subtleTextStyle}>
                保存済みセッションはまだありません。
              </p>
            )}
          </>
        ) : (
          <>
            <p style={subtleTextStyle}>
              ゲストでは練習できますが、ホームと統計の保存サマリーは表示されません。
            </p>
            <div style={navRowStyle}>
              <Link href="/train/distance" style={navLinkStyle}>
                距離モード
              </Link>
              <Link href="/train/keyboard" style={navLinkStyle}>
                鍵盤モード
              </Link>
              <Link href="/login" style={navLinkStyle}>
                ログイン
              </Link>
              <Link href="/settings" style={navLinkStyle}>
                設定
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
