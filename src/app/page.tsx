import Link from "next/link";

import { getHomeTrainingSummaryForCurrentUser } from "../features/training/server/getHomeTrainingSummary";

export default async function HomePage() {
  const summary = await getHomeTrainingSummaryForCurrentUser();

  return (
    <main
      style={{
        maxWidth: "720px",
        margin: "0 auto",
        padding: "40px 20px",
        display: "grid",
        gap: "16px",
      }}
    >
      <h1 style={{ margin: 0 }}>ミーコピ</h1>
      <p style={{ margin: 0 }}>
        MVP の最小導線です。guest の distance / keyboard vertical slice と auth test に入れます。
      </p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <Link href="/train/distance">Start distance guest slice</Link>
        <Link href="/train/keyboard">Start keyboard guest slice</Link>
        <Link href="/stats">Open stats</Link>
        <Link href="/auth-test">Open auth test</Link>
      </div>

      <section
        style={{
          display: "grid",
          gap: "12px",
          padding: "16px",
          border: "1px solid #d4d4d8",
          borderRadius: "12px",
        }}
      >
        <h2 style={{ margin: 0 }}>Saved training summary</h2>
        {summary.isAuthenticated ? (
          <>
            <div>
              <strong>Total sessions:</strong> {summary.totalSessions}
            </div>
            <div>
              <strong>Total saved question results:</strong>{" "}
              {summary.totalSavedQuestionResults}
            </div>

            {summary.recentSessions.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {summary.recentSessions.map((session) => (
                  <li key={session.id}>
                    <Link href={`/sessions/${session.id}`}>
                      {session.mode} / session score {Math.round(session.sessionScore)} /
                      accuracy {Math.round(session.accuracyRate * 100)}% / questions{" "}
                      {session.answeredQuestionCount} / {session.createdAt}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div>No saved sessions yet.</div>
            )}
          </>
        ) : (
          <div>Sign in to see saved training data. Guest sessions are not saved.</div>
        )}
      </section>
    </main>
  );
}
