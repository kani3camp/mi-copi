import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { calculateQuestionScoreV1 } from "../../features/training/model/scoring";
import type { SaveTrainingSessionResult } from "../../features/training/server/saveTrainingSession";
import { ButtonLink } from "../ui/navigation-link";
import { AppShell } from "../ui/primitives";
import { DistanceResultPanel } from "./distance/distance-train-panels";
import { KeyboardResultPanel } from "./keyboard/keyboard-train-panels";
import {
  createDistanceResult,
  createDistanceSummary,
  createKeyboardResult,
  createKeyboardSummary,
} from "./train-story-fixtures";
import { TrainingProgressHeader } from "./training-page-shell";

type ResultState =
  | "guest"
  | "pending"
  | "saved"
  | "failed"
  | "zero"
  | "time-up";
function ResultScreen(props: {
  mode: "distance" | "keyboard";
  state: ResultState;
}) {
  const results = Array.from(
    { length: props.state === "zero" ? 0 : 15 },
    (_, i) => {
      const answer = [6, 5, 12][i % 3];
      const error = answer - 6;
      return createDistanceResult({
        question: {
          questionIndex: i,
          targetNote: "F#",
          targetMidi: 66,
          distanceSemitones: 6,
        },
        answeredDistanceSemitones: answer,
        isCorrect: error === 0,
        errorSemitones: error,
        responseTimeMs: 1420 + i * 100,
        score: calculateQuestionScoreV1({
          errorSemitones: error,
          responseTimeMs: 1420 + i * 100,
          targetIntervalSemitones: 6,
        }),
        answeredAt: `2026-10-11T10:00:${String(i + 1).padStart(2, "0")}.000Z`,
      });
    },
  );
  const keyboardResults = results.map((result) =>
    createKeyboardResult({
      ...result,
      answeredNote:
        result.answeredDistanceSemitones === 6
          ? "F#"
          : result.answeredDistanceSemitones === 5
            ? "F"
            : "C",
    }),
  );
  const saveResult: SaveTrainingSessionResult | null =
    props.state === "saved"
      ? {
          ok: true,
          sessionId: "00000000-0000-4000-8000-000000000001",
          savedQuestionCount: 15,
        }
      : props.state === "failed"
        ? {
            ok: false,
            code: "SAVE_FAILED",
            message: "Failed to persist the training session.",
          }
        : null;
  const common = {
    finishReason:
      props.state === "time-up" || props.state === "zero"
        ? ("time_up" as const)
        : ("target_reached" as const),
    isAuthenticated: props.state !== "guest" && props.state !== "time-up",
    canSaveResult: !["guest", "time-up", "zero"].includes(props.state),
    cannotSaveBecauseNoAnswers: props.state === "zero",
    isSavePending: props.state === "pending",
    saveResult,
    onRetrySave: fn(),
    onReset: fn(),
  };
  return (
    <div className="app-root">
      <AppShell narrow className="ui-train-shell">
        <TrainingProgressHeader
          modeLabel={props.mode === "distance" ? "距離モード" : "鍵盤モード"}
          questionLabel="結果"
          actions={
            <ButtonLink href="/" size="compact" variant="ghost">
              戻る
            </ButtonLink>
          }
        />
        {props.mode === "distance" ? (
          <DistanceResultPanel
            summary={createDistanceSummary(results)}
            recentResults={results.slice(-3).reverse()}
            intervalNotationStyle="mixed"
            {...common}
          />
        ) : (
          <KeyboardResultPanel
            summary={createKeyboardSummary(keyboardResults)}
            {...common}
          />
        )}
      </AppShell>
    </div>
  );
}
const meta = {
  title: "Train/Result complete screen",
  component: ResultScreen,
  args: { mode: "distance", state: "guest" },
} satisfies Meta<typeof ResultScreen>;
export default meta;
type Story = StoryObj<typeof meta>;
export const DistanceGuest: Story = {};
export const DistancePending: Story = { args: { state: "pending" } };
export const DistanceSaved: Story = { args: { state: "saved" } };
export const DistanceFailed: Story = { args: { state: "failed" } };
export const DistanceZero: Story = { args: { state: "zero" } };
export const DistanceTimeUp: Story = { args: { state: "time-up" } };
export const KeyboardGuest: Story = { args: { mode: "keyboard" } };
export const KeyboardPending: Story = {
  args: { mode: "keyboard", state: "pending" },
};
export const KeyboardSaved: Story = {
  args: { mode: "keyboard", state: "saved" },
};
export const KeyboardFailed: Story = {
  args: { mode: "keyboard", state: "failed" },
};
export const KeyboardZero: Story = {
  args: { mode: "keyboard", state: "zero" },
};
export const KeyboardTimeUp: Story = {
  args: { mode: "keyboard", state: "time-up" },
};
