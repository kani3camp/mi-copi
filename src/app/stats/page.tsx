import Link from "next/link";
import {
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatDateTimeLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
  formatTrainingModeLabel,
} from "../../features/training/model/format";
import { getTrainingStatsForCurrentUser } from "../../features/training/server/getTrainingStats";
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
  sectionTitleStyle,
  subtleTextStyle,
} from "../ui/polish";

export default async function StatsPage() {
  const stats = await getTrainingStatsForCurrentUser();
  const compactMetricValueStyle = { ...metricValueStyle, fontSize: "22px" };

  return (
    <main style={pageShellStyle}>
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
                <span style={metricValueStyle}>
                  {stats.totalSavedQuestionResults}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>Cumulative score</span>
                <span style={metricValueStyle}>
                  {formatScoreLabel(stats.overview.cumulativeScore)}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>Overall correct rate</span>
                <span style={metricValueStyle}>
                  {formatAccuracyLabel(stats.overview.correctRate)}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>Average error</span>
                <span style={metricValueStyle}>
                  {formatAvgErrorLabel(stats.overview.averageError)}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>Median error</span>
                <span style={metricValueStyle}>
                  {formatAvgErrorLabel(stats.overview.medianError)}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>Average response time</span>
                <span style={compactMetricValueStyle}>
                  {formatResponseTimeMsLabel(
                    stats.overview.averageResponseTimeMs,
                  )}
                </span>
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>By mode</h2>
            <div style={metricsGridStyle}>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>Distance sessions</span>
                <span style={metricValueStyle}>
                  {stats.byMode.distance.sessionCount}
                </span>
                <span style={subtleTextStyle}>
                  Questions {stats.byMode.distance.questionCount} / cumulative
                  score{" "}
                  {formatScoreLabel(stats.byMode.distance.cumulativeScore)}
                </span>
                <span style={subtleTextStyle}>
                  Correct{" "}
                  {formatAccuracyLabel(stats.byMode.distance.correctRate)}
                  {" / "}avg error{" "}
                  {formatAvgErrorLabel(stats.byMode.distance.averageError)}
                  {" / "}median error{" "}
                  {formatAvgErrorLabel(stats.byMode.distance.medianError)}
                  {" / "}avg response{" "}
                  {formatResponseTimeMsLabel(
                    stats.byMode.distance.averageResponseTimeMs,
                  )}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>Keyboard sessions</span>
                <span style={metricValueStyle}>
                  {stats.byMode.keyboard.sessionCount}
                </span>
                <span style={subtleTextStyle}>
                  Questions {stats.byMode.keyboard.questionCount} / cumulative
                  score{" "}
                  {formatScoreLabel(stats.byMode.keyboard.cumulativeScore)}
                </span>
                <span style={subtleTextStyle}>
                  Correct{" "}
                  {formatAccuracyLabel(stats.byMode.keyboard.correctRate)}
                  {" / "}avg error{" "}
                  {formatAvgErrorLabel(stats.byMode.keyboard.averageError)}
                  {" / "}median error{" "}
                  {formatAvgErrorLabel(stats.byMode.keyboard.medianError)}
                  {" / "}avg response{" "}
                  {formatResponseTimeMsLabel(
                    stats.byMode.keyboard.averageResponseTimeMs,
                  )}
                </span>
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Recent question summaries</h2>
            <div style={metricsGridStyle}>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>Recent 10 questions</span>
                <span style={metricValueStyle}>
                  {stats.recentQuestionSummaries.recent10.questionCount}
                </span>
                <span style={subtleTextStyle}>
                  Avg score{" "}
                  {formatScoreLabel(
                    stats.recentQuestionSummaries.recent10.averageScore,
                  )}
                  {" / "}correct{" "}
                  {formatAccuracyLabel(
                    stats.recentQuestionSummaries.recent10.correctRate,
                  )}
                </span>
                <span style={subtleTextStyle}>
                  Avg error{" "}
                  {formatAvgErrorLabel(
                    stats.recentQuestionSummaries.recent10.averageError,
                  )}
                  {" / "}avg response{" "}
                  {formatResponseTimeMsLabel(
                    stats.recentQuestionSummaries.recent10
                      .averageResponseTimeMs,
                  )}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>Recent 30 questions</span>
                <span style={metricValueStyle}>
                  {stats.recentQuestionSummaries.recent30.questionCount}
                </span>
                <span style={subtleTextStyle}>
                  Avg score{" "}
                  {formatScoreLabel(
                    stats.recentQuestionSummaries.recent30.averageScore,
                  )}
                  {" / "}correct{" "}
                  {formatAccuracyLabel(
                    stats.recentQuestionSummaries.recent30.correctRate,
                  )}
                </span>
                <span style={subtleTextStyle}>
                  Avg error{" "}
                  {formatAvgErrorLabel(
                    stats.recentQuestionSummaries.recent30.averageError,
                  )}
                  {" / "}avg response{" "}
                  {formatResponseTimeMsLabel(
                    stats.recentQuestionSummaries.recent30
                      .averageResponseTimeMs,
                  )}
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
                    <Link
                      href={`/sessions/${session.id}`}
                      style={listLinkStyle}
                    >
                      <strong style={{ fontSize: "16px" }}>
                        {formatTrainingModeLabel(session.mode)}
                      </strong>
                      <span style={subtleTextStyle}>
                        Session score {formatScoreLabel(session.sessionScore)} /
                        questions {session.answeredQuestionCount} / accuracy{" "}
                        {formatAccuracyLabel(session.accuracyRate)}
                      </span>
                      <span style={subtleTextStyle}>
                        Completed {formatDateTimeLabel(session.endedAt)}
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
