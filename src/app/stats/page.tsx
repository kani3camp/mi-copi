import Link from "next/link";

import { getTrainingStatsForCurrentUser } from "../../features/training/server/getTrainingStats";
import {
  formatAccuracyLabel,
  formatDateTimeLabel,
  formatScoreLabel,
} from "../../features/training/model/format";
import {
  cardStyle,
  listLinkStyle,
  listStyle,
  metricCardStyle,
  metricLabelStyle,
  metricValueStyle,
  metricsGridStyle,
  navLinkStyle,
  navRowStyle,
  pageHeroStyle,
  pageShellStyle,
  sectionTitleStyle,
  subtleTextStyle,
} from "../ui/polish";

export default async function StatsPage() {
  const stats = await getTrainingStatsForCurrentUser();

  return (
    <main
      style={pageShellStyle}
    >
      <header style={pageHeroStyle}>
        <h1 style={{ ...sectionTitleStyle, fontSize: "40px" }}>Stats</h1>
        <p style={subtleTextStyle}>
          保存済み session を mode ごとにざっくり見渡すための最小ページです。
        </p>
        <div style={navRowStyle}>
          <Link href="/" style={navLinkStyle}>
            Back home
          </Link>
        </div>
      </header>

      {stats.isAuthenticated ? (
        <>
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Overview</h2>
            <div style={metricsGridStyle}>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>Total sessions</span>
                <span style={metricValueStyle}>{stats.totalSessions}</span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>Saved question results</span>
                <span style={metricValueStyle}>{stats.totalSavedQuestionResults}</span>
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>By mode</h2>
            <div style={metricsGridStyle}>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>Distance sessions</span>
                <span style={metricValueStyle}>{stats.byMode.distance.sessionCount}</span>
                <span style={subtleTextStyle}>
                  Avg score {formatScoreLabel(stats.byMode.distance.averageScore)} / avg
                  accuracy {formatAccuracyLabel(stats.byMode.distance.averageAccuracy)}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>Keyboard sessions</span>
                <span style={metricValueStyle}>{stats.byMode.keyboard.sessionCount}</span>
                <span style={subtleTextStyle}>
                  Avg score {formatScoreLabel(stats.byMode.keyboard.averageScore)} / avg
                  accuracy {formatAccuracyLabel(stats.byMode.keyboard.averageAccuracy)}
                </span>
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Recent sessions</h2>
            {stats.recentSessions.length > 0 ? (
              <ul style={listStyle}>
                {stats.recentSessions.map((session) => (
                  <li key={session.id}>
                    <Link href={`/sessions/${session.id}`} style={listLinkStyle}>
                      <strong style={{ fontSize: "16px" }}>{session.mode}</strong>
                      <span style={subtleTextStyle}>
                        Session score {formatScoreLabel(session.sessionScore)} / questions{" "}
                        {session.answeredQuestionCount} / accuracy{" "}
                        {formatAccuracyLabel(session.accuracyRate)}
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
          </section>
        </>
      ) : (
        <section style={cardStyle}>
          <p style={subtleTextStyle}>
            Sign in to see saved training stats. Guest sessions are not saved.
          </p>
        </section>
      )}
    </main>
  );
}
