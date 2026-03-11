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
  const accountLinkLabel = summary.isAuthenticated ? "Account" : "Sign in";

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
            Train: distance
          </Link>
          <Link href="/train/keyboard" style={navLinkStyle}>
            Train: keyboard
          </Link>
          {summary.isAuthenticated ? (
            <Link href="/stats" style={navLinkStyle}>
              Stats
            </Link>
          ) : null}
          <Link href="/settings" style={navLinkStyle}>
            Settings
          </Link>
          <Link href="/auth-test" style={navLinkStyle}>
            {accountLinkLabel}
          </Link>
        </div>
      </header>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Saved training summary</h2>
        {summary.isAuthenticated ? (
          <>
            <p style={subtleTextStyle}>
              直近の保存済みセッションから、最後の学習状態と最近の精度感を確認できます。
            </p>
            <div style={metricsGridStyle}>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>Last training time</span>
                <span style={compactMetricValueStyle}>
                  {summary.lastTrainingTime
                    ? formatDateTimeLabel(summary.lastTrainingTime)
                    : "-"}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>Last used mode</span>
                <span style={metricValueStyle}>
                  {summary.lastUsedMode
                    ? formatTrainingModeLabel(summary.lastUsedMode)
                    : "-"}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>Latest session score</span>
                <span style={metricValueStyle}>
                  {summary.latestSessionScore === null
                    ? "-"
                    : formatScoreLabel(summary.latestSessionScore)}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>Recent average error</span>
                <span style={metricValueStyle}>
                  {summary.recentAverageError === null
                    ? "-"
                    : formatAvgErrorLabel(summary.recentAverageError)}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>Recent avg response time</span>
                <span style={compactMetricValueStyle}>
                  {summary.recentAverageResponseTimeMs === null
                    ? "-"
                    : formatResponseTimeMsLabel(
                        summary.recentAverageResponseTimeMs,
                      )}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>Total sessions</span>
                <span style={metricValueStyle}>{summary.totalSessions}</span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>Saved question results</span>
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
                  Latest saved sessions
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
                          Session score {formatScoreLabel(session.sessionScore)}{" "}
                          / accuracy {formatAccuracyLabel(session.accuracyRate)}{" "}
                          / questions {session.answeredQuestionCount}
                        </span>
                        <span style={subtleTextStyle}>
                          Completed {formatDateTimeLabel(session.endedAt)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p style={subtleTextStyle}>No saved sessions yet.</p>
            )}
          </>
        ) : (
          <>
            <p style={subtleTextStyle}>
              Guest mode では練習はできますが、Home / Stats
              の保存サマリーは表示されません。
            </p>
            <div style={navRowStyle}>
              <Link href="/train/distance" style={navLinkStyle}>
                Start distance
              </Link>
              <Link href="/train/keyboard" style={navLinkStyle}>
                Start keyboard
              </Link>
              <Link href="/auth-test" style={navLinkStyle}>
                Sign in
              </Link>
              <Link href="/settings" style={navLinkStyle}>
                Settings
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
