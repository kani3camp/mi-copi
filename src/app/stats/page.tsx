import Link from "next/link";
import {
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatDateLabel,
  formatDateTimeLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
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
        <h1 style={{ ...sectionTitleStyle, fontSize: "40px" }}>統計</h1>
        <p style={subtleTextStyle}>
          保存済みの回答とセッションを、全体・モード別・直近・日次の切り口で見渡せます。
        </p>
        <div style={navRowStyle}>
          <Link href="/" style={navLinkStyle}>
            ホームへ戻る
          </Link>
        </div>
      </header>

      {stats.isAuthenticated ? (
        <>
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>全体概要</h2>
            <div style={metricsGridStyle}>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>累計セッション数</span>
                <span style={metricValueStyle}>{stats.totalSessions}</span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>保存済み回答数</span>
                <span style={metricValueStyle}>
                  {stats.totalSavedQuestionResults}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>累計スコア</span>
                <span style={metricValueStyle}>
                  {formatScoreLabel(stats.overview.cumulativeScore)}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>全体正答率</span>
                <span style={metricValueStyle}>
                  {formatAccuracyLabel(stats.overview.correctRate)}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>平均誤差</span>
                <span style={metricValueStyle}>
                  {formatAvgErrorLabel(stats.overview.averageError)}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>中央値誤差</span>
                <span style={metricValueStyle}>
                  {formatAvgErrorLabel(stats.overview.medianError)}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>平均回答時間</span>
                <span style={compactMetricValueStyle}>
                  {formatResponseTimeMsLabel(
                    stats.overview.averageResponseTimeMs,
                  )}
                </span>
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>日次推移</h2>
            <p style={subtleTextStyle}>
              回答日の単位で平均値をまとめています。スコア、誤差、回答時間、正答率の流れを
              ざっくり追えます。
            </p>
            {stats.dailyTrends.length > 0 ? (
              <div style={listStyle}>
                {stats.dailyTrends.map((trend) => (
                  <article key={trend.date} style={metricCardStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <strong style={{ fontSize: "16px" }}>
                        {formatDateLabel(trend.date)}
                      </strong>
                      <span style={subtleTextStyle}>
                        {trend.questionCount} 問
                      </span>
                    </div>
                    <div style={metricsGridStyle}>
                      <div style={metricCardStyle}>
                        <span style={metricLabelStyle}>平均スコア</span>
                        <span style={metricValueStyle}>
                          {formatScoreLabel(trend.averageScore)}
                        </span>
                      </div>
                      <div style={metricCardStyle}>
                        <span style={metricLabelStyle}>平均誤差</span>
                        <span style={metricValueStyle}>
                          {formatAvgErrorLabel(trend.averageError)}
                        </span>
                      </div>
                      <div style={metricCardStyle}>
                        <span style={metricLabelStyle}>平均回答時間</span>
                        <span style={compactMetricValueStyle}>
                          {formatResponseTimeMsLabel(
                            trend.averageResponseTimeMs,
                          )}
                        </span>
                      </div>
                      <div style={metricCardStyle}>
                        <span style={metricLabelStyle}>正答率</span>
                        <span style={metricValueStyle}>
                          {formatAccuracyLabel(trend.correctRate)}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p style={subtleTextStyle}>日次推移データはまだありません。</p>
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>モード別</h2>
            <div style={metricsGridStyle}>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>距離モードのセッション数</span>
                <span style={metricValueStyle}>
                  {stats.byMode.distance.sessionCount}
                </span>
                <span style={subtleTextStyle}>
                  問題数 {stats.byMode.distance.questionCount} / 累計スコア{" "}
                  {formatScoreLabel(stats.byMode.distance.cumulativeScore)}
                </span>
                <span style={subtleTextStyle}>
                  正答率{" "}
                  {formatAccuracyLabel(stats.byMode.distance.correctRate)}
                  {" / "}平均誤差{" "}
                  {formatAvgErrorLabel(stats.byMode.distance.averageError)}
                  {" / "}中央値誤差{" "}
                  {formatAvgErrorLabel(stats.byMode.distance.medianError)}
                  {" / "}平均回答時間{" "}
                  {formatResponseTimeMsLabel(
                    stats.byMode.distance.averageResponseTimeMs,
                  )}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>鍵盤モードのセッション数</span>
                <span style={metricValueStyle}>
                  {stats.byMode.keyboard.sessionCount}
                </span>
                <span style={subtleTextStyle}>
                  問題数 {stats.byMode.keyboard.questionCount} / 累計スコア{" "}
                  {formatScoreLabel(stats.byMode.keyboard.cumulativeScore)}
                </span>
                <span style={subtleTextStyle}>
                  正答率{" "}
                  {formatAccuracyLabel(stats.byMode.keyboard.correctRate)}
                  {" / "}平均誤差{" "}
                  {formatAvgErrorLabel(stats.byMode.keyboard.averageError)}
                  {" / "}中央値誤差{" "}
                  {formatAvgErrorLabel(stats.byMode.keyboard.medianError)}
                  {" / "}平均回答時間{" "}
                  {formatResponseTimeMsLabel(
                    stats.byMode.keyboard.averageResponseTimeMs,
                  )}
                </span>
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>直近の回答サマリー</h2>
            <div style={metricsGridStyle}>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>直近 10 問</span>
                <span style={metricValueStyle}>
                  {stats.recentQuestionSummaries.recent10.questionCount}
                </span>
                <span style={subtleTextStyle}>
                  平均スコア{" "}
                  {formatScoreLabel(
                    stats.recentQuestionSummaries.recent10.averageScore,
                  )}
                  {" / "}正答率{" "}
                  {formatAccuracyLabel(
                    stats.recentQuestionSummaries.recent10.correctRate,
                  )}
                </span>
                <span style={subtleTextStyle}>
                  平均誤差{" "}
                  {formatAvgErrorLabel(
                    stats.recentQuestionSummaries.recent10.averageError,
                  )}
                  {" / "}平均回答時間{" "}
                  {formatResponseTimeMsLabel(
                    stats.recentQuestionSummaries.recent10
                      .averageResponseTimeMs,
                  )}
                </span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>直近 30 問</span>
                <span style={metricValueStyle}>
                  {stats.recentQuestionSummaries.recent30.questionCount}
                </span>
                <span style={subtleTextStyle}>
                  平均スコア{" "}
                  {formatScoreLabel(
                    stats.recentQuestionSummaries.recent30.averageScore,
                  )}
                  {" / "}正答率{" "}
                  {formatAccuracyLabel(
                    stats.recentQuestionSummaries.recent30.correctRate,
                  )}
                </span>
                <span style={subtleTextStyle}>
                  平均誤差{" "}
                  {formatAvgErrorLabel(
                    stats.recentQuestionSummaries.recent30.averageError,
                  )}
                  {" / "}平均回答時間{" "}
                  {formatResponseTimeMsLabel(
                    stats.recentQuestionSummaries.recent30
                      .averageResponseTimeMs,
                  )}
                </span>
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>最近のセッション</h2>
            {stats.recentSessions.length > 0 ? (
              <ul style={listStyle}>
                {stats.recentSessions.map((session) => (
                  <li key={session.id}>
                    <Link
                      href={`/sessions/${session.id}`}
                      style={listLinkStyle}
                    >
                      <strong style={{ fontSize: "16px" }}>
                        {formatSecondaryModeLabel(session.mode)}
                      </strong>
                      <span style={subtleTextStyle}>
                        スコア {formatScoreLabel(session.sessionScore)} / 問題数{" "}
                        {session.answeredQuestionCount} / 正答率{" "}
                        {formatAccuracyLabel(session.accuracyRate)}
                      </span>
                      <span style={subtleTextStyle}>
                        完了日時 {formatDateTimeLabel(session.endedAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={subtleTextStyle}>
                保存済みセッションはまだありません。
              </p>
            )}
          </section>
        </>
      ) : (
        <section style={cardStyle}>
          <p style={subtleTextStyle}>
            保存済みの学習統計を見るにはログインしてください。ゲストのセッションは保存されません。
          </p>
        </section>
      )}
    </main>
  );
}

function formatSecondaryModeLabel(value: "distance" | "keyboard"): string {
  return value === "distance" ? "距離モード" : "鍵盤モード";
}
