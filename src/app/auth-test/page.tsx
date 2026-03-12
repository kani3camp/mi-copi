import type { SaveTrainingSessionInput } from "../../features/training/model/types";
import type { SaveTrainingSessionResult } from "../../features/training/server/saveTrainingSession";
import { saveTrainingSessionForCurrentUser } from "../../features/training/server/saveTrainingSession.entry";
import { getCurrentUserOrNull } from "../../lib/auth/server";
import {
  AppShell,
  ButtonLink,
  Notice,
  PageHero,
  SectionHeader,
  Surface,
} from "../ui/primitives";
import { AuthTestControls } from "./auth-test-controls";

export default async function AuthTestPage() {
  const currentUser = await getCurrentUserOrNull();

  async function saveDummyTrainingSession(): Promise<SaveTrainingSessionResult> {
    "use server";

    return saveTrainingSessionForCurrentUser(buildDummyTrainingSessionInput());
  }

  return (
    <AppShell narrow>
      <PageHero
        title="Auth Test"
        eyebrow="Developer Utility"
        subtitle="Better Auth / Google OAuth と保存疎通を確認するための開発用ページです。product route ではありません。"
        actions={
          <>
            <ButtonLink href="/">ホームへ戻る</ButtonLink>
            <ButtonLink href="/login">ログイン画面へ</ButtonLink>
          </>
        }
      />

      <Notice>
        開発用の検証 route です。日常利用の UI polish はここではなく product
        route を優先します。
      </Notice>

      <Surface tone="accent">
        <SectionHeader
          title="Server current user"
          description="Server Component から見えている current user をそのまま表示します。"
        />
        <pre className="ui-code-block">
          {JSON.stringify(currentUser, null, 2)}
        </pre>
      </Surface>

      <AuthTestControls
        isAuthenticated={Boolean(currentUser)}
        saveDummyTrainingSession={saveDummyTrainingSession}
      />
    </AppShell>
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
        minSemitone: 0,
        maxSemitone: 12,
      },
      directionMode: "mixed",
      includeUnison: false,
      includeOctave: true,
      baseNoteMode: "random",
      fixedBaseNote: null,
      endCondition: {
        type: "question_count",
        questionCount: 5,
      },
      intervalGranularity: "simple",
    },
    finishReason: "manual_end",
    endCondition: {
      type: "question_count",
      questionCount: 5,
    },
    startedAt,
    endedAt: answeredAt,
    summary: {
      plannedQuestionCount: 5,
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
