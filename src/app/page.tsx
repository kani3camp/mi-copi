import Link from "next/link";

import {
  formatAccuracyLabel,
  formatDateTimeLabel,
  formatScoreLabel,
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

  return (
    <main style={pageShellStyle}>
      <header style={pageHeroStyle}>
        <h1 style={pageTitleStyle}>ミーコピ</h1>
        <p style={pageSubtitleStyle}>
          MVP の最小導線です。distance / keyboard
          の練習、保存結果の確認、設定確認までを軽く通せます。
        </p>
        <div style={navRowStyle}>
          <Link href="/train/distance" style={navLinkStyle}>
            Train: distance
          </Link>
          <Link href="/train/keyboard" style={navLinkStyle}>
            Train: keyboard
          </Link>
          <Link href="/stats" style={navLinkStyle}>
            Stats
          </Link>
          <Link href="/settings" style={navLinkStyle}>
            Settings
          </Link>
          <Link href="/auth-test" style={navLinkStyle}>
            Auth test
          </Link>
        </div>
      </header>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Saved training summary</h2>
        {summary.isAuthenticated ? (
          <>
            <div style={metricsGridStyle}>
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
              <ul style={listStyle}>
                {summary.recentSessions.map((session) => (
                  <li key={session.id}>
                    <Link
                      href={`/sessions/${session.id}`}
                      style={listLinkStyle}
                    >
                      <strong style={{ fontSize: "16px" }}>
                        {session.mode}
                      </strong>
                      <span style={subtleTextStyle}>
                        Session score {formatScoreLabel(session.sessionScore)} /
                        accuracy {formatAccuracyLabel(session.accuracyRate)} /
                        questions {session.answeredQuestionCount}
                      </span>
                      <span style={subtleTextStyle}>
                        Created {formatDateTimeLabel(session.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={subtleTextStyle}>No saved sessions yet.</p>
            )}
          </>
        ) : (
          <p style={subtleTextStyle}>
            Sign in to see saved training data. Guest sessions are not saved.
          </p>
        )}
      </section>
    </main>
  );
}
