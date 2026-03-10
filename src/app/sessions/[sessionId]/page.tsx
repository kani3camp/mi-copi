import Link from "next/link";
import { notFound } from "next/navigation";

import { getTrainingSessionDetailForCurrentUser } from "../../../features/training/server/getTrainingSessionDetail";

interface TrainingSessionDetailPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function TrainingSessionDetailPage({
  params,
}: TrainingSessionDetailPageProps) {
  const { sessionId } = await params;
  const detail = await getTrainingSessionDetailForCurrentUser(sessionId);

  if (!detail) {
    notFound();
  }

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
        <h1 style={{ margin: 0 }}>Session detail</h1>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/">Back home</Link>
        </div>
      </header>

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
          <strong>Mode:</strong> {detail.mode}
        </div>
        <div>
          <strong>Created at:</strong> {detail.createdAt}
        </div>
        <div>
          <strong>Ended at:</strong> {detail.endedAt}
        </div>
        <div>
          <strong>Questions:</strong> {detail.answeredQuestionCount}
        </div>
        <div>
          <strong>Correct:</strong> {detail.correctQuestionCount}
        </div>
        <div>
          <strong>Accuracy:</strong> {Math.round(detail.accuracyRate * 100)}%
        </div>
        <div>
          <strong>Average error:</strong> {detail.avgErrorAbs}
        </div>
        <div>
          <strong>Average response time:</strong> {detail.avgResponseTimeMs} ms
        </div>
        <div>
          <strong>Session score:</strong> {detail.sessionScore}
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
        <h2 style={{ margin: 0 }}>Config snapshot</h2>
        <div>
          <strong>Mode:</strong> {detail.configSnapshot.mode}
        </div>
        <div>
          <strong>Interval range:</strong>{" "}
          {detail.configSnapshot.intervalRange.minSemitones} -{" "}
          {detail.configSnapshot.intervalRange.maxSemitones}
        </div>
        <div>
          <strong>Direction:</strong> {detail.configSnapshot.directionMode}
        </div>
        <div>
          <strong>Base note mode:</strong> {detail.configSnapshot.baseNoteMode}
        </div>
        <div>
          <strong>Fixed base note:</strong>{" "}
          {detail.configSnapshot.fixedBaseNote ?? "none"}
        </div>
        <div>
          <strong>Include unison:</strong>{" "}
          {detail.configSnapshot.includeUnison ? "yes" : "no"}
        </div>
        <div>
          <strong>Include octave:</strong>{" "}
          {detail.configSnapshot.includeOctave ? "yes" : "no"}
        </div>
        <div>
          <strong>End condition:</strong>{" "}
          {detail.configSnapshot.endCondition.type === "question_count"
            ? `question_count (${detail.configSnapshot.endCondition.questionCount})`
            : `time_limit (${detail.configSnapshot.endCondition.timeLimitMinutes} min)`}
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
        <h2 style={{ margin: 0 }}>Question results</h2>
        {detail.results.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            {detail.results.map((result) => (
              <li key={result.id}>
                #{result.questionIndex + 1} / {result.baseNoteName} -&gt;{" "}
                {result.targetNoteName} / answer {result.answerNoteName} /{" "}
                {result.isCorrect ? "correct" : `error ${Math.abs(result.errorSemitones)}`} /{" "}
                {result.responseTimeMs} ms
              </li>
            ))}
          </ul>
        ) : (
          <div>No question results found.</div>
        )}
      </section>
    </main>
  );
}
