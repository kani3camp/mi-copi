import type { SaveTrainingSessionInput } from "../../features/training/model/types";
import type { SaveTrainingSessionResult } from "../../features/training/server/saveTrainingSession";
import { saveTrainingSessionForCurrentUser } from "../../features/training/server/saveTrainingSession.entry";
import { getCurrentUserOrNull } from "../../lib/auth/server";
import { AuthTestControls } from "./auth-test-controls";

export default async function AuthTestPage() {
  const currentUser = await getCurrentUserOrNull();

  async function saveDummyTrainingSession(): Promise<SaveTrainingSessionResult> {
    "use server";

    return saveTrainingSessionForCurrentUser(buildDummyTrainingSessionInput());
  }

  return (
    <main
      style={{
        maxWidth: "860px",
        margin: "0 auto",
        padding: "40px 20px",
        display: "grid",
        gap: "24px",
      }}
    >
      <header style={{ display: "grid", gap: "8px" }}>
        <h1 style={{ margin: 0 }}>Auth Test</h1>
        <p style={{ margin: 0 }}>
          Better Auth / Google OAuth の疎通確認専用ページです。
        </p>
      </header>

      <section style={{ display: "grid", gap: "12px" }}>
        <div>
          <strong>Server current user</strong>
        </div>
        <pre
          style={{
            margin: 0,
            padding: "12px",
            border: "1px solid #d4d4d8",
            borderRadius: "8px",
            overflowX: "auto",
            background: "#fafafa",
            fontSize: "12px",
          }}
        >
          {JSON.stringify(currentUser, null, 2)}
        </pre>
      </section>

      <AuthTestControls
        isAuthenticated={Boolean(currentUser)}
        saveDummyTrainingSession={saveDummyTrainingSession}
      />
    </main>
  );
}

function buildDummyTrainingSessionInput(): SaveTrainingSessionInput {
  const startedAtDate = new Date();
  const presentedAtDate = new Date(startedAtDate.getTime() + 1000);
  const answeredAtDate = new Date(startedAtDate.getTime() + 2500);

  const startedAt = startedAtDate.toISOString();
  const presentedAt = presentedAtDate.toISOString();
  const answeredAt = answeredAtDate.toISOString();

  return {
    config: {
      mode: "distance",
      intervalRange: {
        minSemitones: 0,
        maxSemitones: 12,
      },
      directionMode: "mixed",
      includeUnison: false,
      includeOctave: true,
      baseNoteMode: "random",
      fixedBaseNote: null,
      endCondition: {
        type: "question_count",
        questionCount: 1,
      },
      intervalGranularity: "simple",
    },
    finishReason: "target_reached",
    endCondition: {
      type: "question_count",
      questionCount: 1,
    },
    startedAt,
    endedAt: answeredAt,
    summary: {
      plannedQuestionCount: 1,
      answeredQuestionCount: 1,
      correctQuestionCount: 1,
      sessionScore: 100,
      avgScorePerQuestion: 100,
      accuracyRate: 1,
      avgErrorAbs: 0,
      avgResponseTimeMs: 1500,
    },
    results: [
      {
        questionIndex: 0,
        presentedAt,
        answeredAt,
        mode: "distance",
        baseNoteName: "C",
        baseMidi: 60,
        targetNoteName: "D",
        targetMidi: 62,
        answerNoteName: "D",
        answerMidi: 62,
        targetIntervalSemitones: 2,
        answerIntervalSemitones: 2,
        direction: "up",
        isCorrect: true,
        errorSemitones: 0,
        responseTimeMs: 1500,
        replayBaseCount: 0,
        replayTargetCount: 1,
        score: 100,
        scoreFormulaVersion: "v1",
      },
    ],
  };
}
