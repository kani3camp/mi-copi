import Link from "next/link";

import { getTrainingStatsForCurrentUser } from "../../features/training/server/getTrainingStats";
import { formatDateTimeLabel } from "../../features/training/model/format";

export default async function StatsPage() {
  const stats = await getTrainingStatsForCurrentUser();

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
        display: "grid",
        gap: "16px",
      }}
    >
      <header style={{ display: "grid", gap: "8px" }}>
        <h1 style={{ margin: 0 }}>Stats</h1>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/">Back home</Link>
        </div>
      </header>

      {stats.isAuthenticated ? (
        <>
          <section
            style={{
              display: "grid",
              gap: "8px",
              padding: "16px",
              border: "1px solid #d4d4d8",
              borderRadius: "12px",
            }}
          >
            <div>
              <strong>Total sessions:</strong> {stats.totalSessions}
            </div>
            <div>
              <strong>Total saved question results:</strong>{" "}
              {stats.totalSavedQuestionResults}
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gap: "8px",
              padding: "16px",
              border: "1px solid #d4d4d8",
              borderRadius: "12px",
            }}
          >
            <h2 style={{ margin: 0 }}>By mode</h2>
            <div>
              <strong>Distance sessions:</strong> {stats.byMode.distance.sessionCount}
            </div>
            <div>
              <strong>Distance avg score:</strong>{" "}
              {Math.round(stats.byMode.distance.averageScore)}
            </div>
            <div>
              <strong>Distance avg accuracy:</strong>{" "}
              {Math.round(stats.byMode.distance.averageAccuracy * 100)}%
            </div>
            <div>
              <strong>Keyboard sessions:</strong> {stats.byMode.keyboard.sessionCount}
            </div>
            <div>
              <strong>Keyboard avg score:</strong>{" "}
              {Math.round(stats.byMode.keyboard.averageScore)}
            </div>
            <div>
              <strong>Keyboard avg accuracy:</strong>{" "}
              {Math.round(stats.byMode.keyboard.averageAccuracy * 100)}%
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gap: "12px",
              padding: "16px",
              border: "1px solid #d4d4d8",
              borderRadius: "12px",
            }}
          >
            <h2 style={{ margin: 0 }}>Recent sessions</h2>
            {stats.recentSessions.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {stats.recentSessions.map((session) => (
                  <li key={session.id}>
                    <Link href={`/sessions/${session.id}`}>
                      {session.mode} / session score {Math.round(session.sessionScore)} /
                      questions {session.answeredQuestionCount} / accuracy{" "}
                      {Math.round(session.accuracyRate * 100)}% /{" "}
                      {formatDateTimeLabel(session.createdAt)}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div>No saved sessions yet.</div>
            )}
          </section>
        </>
      ) : (
        <section
          style={{
            display: "grid",
            gap: "8px",
            padding: "16px",
            border: "1px solid #d4d4d8",
            borderRadius: "12px",
          }}
        >
          <div>Sign in to see saved training stats. Guest sessions are not saved.</div>
        </section>
      )}
    </main>
  );
}
