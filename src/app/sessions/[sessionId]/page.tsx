import Link from "next/link";
import { notFound } from "next/navigation";

import {
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatDateTimeLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
} from "../../../features/training/model/format";
import { getTrainingSessionDetailForCurrentUser } from "../../../features/training/server/getTrainingSessionDetail";
import {
  cardStyle,
  keyValueCardStyle,
  keyValueGridStyle,
  listStyle,
  navLinkStyle,
  navRowStyle,
  pageHeroStyle,
  pageShellStyle,
  sectionTitleStyle,
  subtleTextStyle,
} from "../../ui/polish";

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
    <main style={pageShellStyle}>
      <header style={pageHeroStyle}>
        <h1 style={{ ...sectionTitleStyle, fontSize: "40px" }}>
          Session detail
        </h1>
        <p style={subtleTextStyle}>
          保存済み session の概要、設定、question results を最小表示しています。
        </p>
        <div style={navRowStyle}>
          <Link href="/" style={navLinkStyle}>
            Back home
          </Link>
          <Link href="/stats" style={navLinkStyle}>
            Open stats
          </Link>
        </div>
      </header>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Summary</h2>
        <div style={keyValueGridStyle}>
          <div style={keyValueCardStyle}>
            <strong>Mode:</strong> {detail.mode}
          </div>
          <div style={keyValueCardStyle}>
            <strong>Created at:</strong> {formatDateTimeLabel(detail.createdAt)}
          </div>
          <div style={keyValueCardStyle}>
            <strong>Ended at:</strong> {formatDateTimeLabel(detail.endedAt)}
          </div>
          <div style={keyValueCardStyle}>
            <strong>Question count:</strong> {detail.answeredQuestionCount}
          </div>
          <div style={keyValueCardStyle}>
            <strong>Correct:</strong> {detail.correctQuestionCount}
          </div>
          <div style={keyValueCardStyle}>
            <strong>Accuracy:</strong>{" "}
            {formatAccuracyLabel(detail.accuracyRate)}
          </div>
          <div style={keyValueCardStyle}>
            <strong>Avg error:</strong>{" "}
            {formatAvgErrorLabel(detail.avgErrorAbs)}
          </div>
          <div style={keyValueCardStyle}>
            <strong>Avg response time:</strong>{" "}
            {formatResponseTimeMsLabel(detail.avgResponseTimeMs)}
          </div>
          <div style={keyValueCardStyle}>
            <strong>Session score:</strong>{" "}
            {formatScoreLabel(detail.sessionScore)}
          </div>
        </div>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Config snapshot</h2>
        <div style={keyValueGridStyle}>
          <div style={keyValueCardStyle}>
            <strong>Mode:</strong> {detail.configSnapshot.mode}
          </div>
          <div style={keyValueCardStyle}>
            <strong>Interval range:</strong>{" "}
            {detail.configSnapshot.intervalRange.minSemitones} -{" "}
            {detail.configSnapshot.intervalRange.maxSemitones}
          </div>
          <div style={keyValueCardStyle}>
            <strong>Direction:</strong> {detail.configSnapshot.directionMode}
          </div>
          <div style={keyValueCardStyle}>
            <strong>Base note mode:</strong>{" "}
            {detail.configSnapshot.baseNoteMode}
          </div>
          <div style={keyValueCardStyle}>
            <strong>Fixed base note:</strong>{" "}
            {detail.configSnapshot.fixedBaseNote ?? "none"}
          </div>
          <div style={keyValueCardStyle}>
            <strong>Include unison:</strong>{" "}
            {detail.configSnapshot.includeUnison ? "yes" : "no"}
          </div>
          <div style={keyValueCardStyle}>
            <strong>Include octave:</strong>{" "}
            {detail.configSnapshot.includeOctave ? "yes" : "no"}
          </div>
          <div style={keyValueCardStyle}>
            <strong>End condition:</strong>{" "}
            {detail.configSnapshot.endCondition.type === "question_count"
              ? `question_count (${detail.configSnapshot.endCondition.questionCount})`
              : `time_limit (${detail.configSnapshot.endCondition.timeLimitMinutes} min)`}
          </div>
          {detail.configSnapshot.mode === "distance" ? (
            <div style={keyValueCardStyle}>
              <strong>Interval granularity:</strong>{" "}
              {detail.configSnapshot.intervalGranularity}
            </div>
          ) : (
            <div style={keyValueCardStyle}>
              <strong>Keyboard answer style:</strong> note class
            </div>
          )}
        </div>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Question results</h2>
        {detail.results.length > 0 ? (
          <ul style={listStyle}>
            {detail.results.map((result) => (
              <li
                key={result.id}
                style={{
                  ...keyValueCardStyle,
                  gridTemplateColumns: "none",
                }}
              >
                <strong>Question #{result.questionIndex + 1}</strong>
                <span style={subtleTextStyle}>
                  {result.baseNoteName} -&gt; {result.targetNoteName} / answer{" "}
                  {result.answerNoteName}
                </span>
                <span style={subtleTextStyle}>
                  {result.isCorrect
                    ? "Correct"
                    : `Error ${formatAvgErrorLabel(Math.abs(result.errorSemitones))}`}{" "}
                  / {formatResponseTimeMsLabel(result.responseTimeMs)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={subtleTextStyle}>No question results found.</p>
        )}
      </section>
    </main>
  );
}
