import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRef } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { useTrainingSessionCore } from "../../../features/training/client/use-training-session-core";
import {
  createDefaultKeyboardTrainingConfig,
  getKeyboardFeedbackMidi,
} from "../../../features/training/model/keyboard-guest";
import { createKeyboardTrainingSessionAdapter } from "../../../features/training/model/modes/keyboard-session-adapter";
import type { SaveTrainingSessionResult } from "../../../features/training/server/saveTrainingSession";
import { AppShell, Button } from "../../ui/primitives";
import { KeyboardFeedbackPanel } from "./keyboard-train-panels";
import * as runtime from "./keyboard-train-runtime";

const config = {
  ...createDefaultKeyboardTrainingConfig(),
  endCondition: { type: "question_count" as const, questionCount: 5 },
};

function FeedbackPlaybackSession(props: {
  save: () => Promise<SaveTrainingSessionResult>;
}) {
  const adapterRef = useRef(createKeyboardTrainingSessionAdapter(runtime));
  const session = useTrainingSessionCore({
    adapterRef,
    config,
    isAuthenticated: true,
    masterVolume: 40,
    saveResultsAction: props.save,
    soundEffectsEnabled: false,
  });
  return (
    <AppShell narrow>
      <Button onClick={() => session.startSession()}>開始</Button>
      <Button
        disabled={session.phase !== "answering"}
        onClick={() => session.answerQuestion("C")}
      >
        回答
      </Button>
      <Button onClick={() => session.previewFeedbackNote(62)}>試聴要求</Button>
      <output aria-label="状態">{session.phase}</output>
      <output aria-label="記録">{JSON.stringify(session.results)}</output>
      <output aria-label="保存内容">
        {JSON.stringify(session.pendingSaveInput)}
      </output>
      {session.phase === "feedback" && session.feedbackResult ? (
        <KeyboardFeedbackPanel
          feedbackResult={session.feedbackResult}
          lastAnsweredWasFinal={session.lastAnsweredWasFinal}
          showLabels={false}
          onPreviewNote={(note) => {
            if (session.feedbackResult)
              session.previewFeedbackNote(
                getKeyboardFeedbackMidi(session.feedbackResult.question, note),
              );
          }}
          onReplayBase={session.replayBase}
          onReplayCorrectTarget={session.replayCorrectTarget}
          onContinue={session.continueAfterFeedback}
          onEndSession={session.endSessionManually}
        />
      ) : null}
    </AppShell>
  );
}

const meta = {
  title: "Train/Keyboard/Feedback Playback",
  component: FeedbackPlaybackSession,
  args: {
    save: fn(async () => ({
      ok: true as const,
      sessionId: "feedback-playback",
      savedQuestionCount: 2,
    })),
  },
} satisfies Meta<typeof FeedbackPlaybackSession>;
export default meta;
type Story = StoryObj<typeof meta>;

export const PreservesCommittedRecords: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const phase = () => canvas.getByLabelText("状態").textContent;
    const records = () => canvas.getByLabelText("記録").textContent;
    await userEvent.click(canvas.getByRole("button", { name: "試聴要求" }));
    await expect(phase()).toBe("config");
    await userEvent.click(canvas.getByRole("button", { name: "開始" }));
    await waitFor(() => expect(phase()).toBe("answering"));
    await userEvent.click(canvas.getByRole("button", { name: "回答" }));
    await waitFor(() => expect(phase()).toBe("feedback"));
    const firstRecord = records();
    for (const key of canvas.getAllByRole("button", { name: /を試聴$/ })) {
      await userEvent.click(key);
    }
    await expect(records()).toBe(firstRecord);
    await expect(canvas.getByLabelText("保存内容").textContent).toBe("null");
    await expect(args.save).not.toHaveBeenCalled();
    // Advance immediately during an audition; the next question must still play.
    await userEvent.click(canvas.getByRole("button", { name: "次へ" }));
    await waitFor(() => expect(phase()).toBe("answering"));
    await expect(records()).toBe(firstRecord);
    await userEvent.click(canvas.getByRole("button", { name: "試聴要求" }));
    await expect(phase()).toBe("answering");
    await userEvent.click(canvas.getByRole("button", { name: "回答" }));
    await waitFor(() => expect(phase()).toBe("feedback"));
    const finalRecords = records();
    await userEvent.click(
      canvas.getByRole("button", { name: "C# / Dbを試聴" }),
    );
    await userEvent.click(canvas.getByRole("button", { name: "ここで終了" }));
    await waitFor(() => expect(phase()).toBe("result"));
    await waitFor(() => expect(args.save).toHaveBeenCalledTimes(1));
    const payload = JSON.parse(
      canvas.getByLabelText("保存内容").textContent ?? "null",
    );
    const expectedRecords = JSON.parse(finalRecords ?? "[]");
    await expect(payload.results).toHaveLength(2);
    for (const [index, result] of payload.results.entries()) {
      for (const field of [
        "answeredAt",
        "responseTimeMs",
        "isCorrect",
        "errorSemitones",
        "score",
        "replayBaseCount",
        "replayTargetCount",
      ]) {
        await expect(result[field]).toEqual(expectedRecords[index][field]);
      }
      await expect(result.answerNoteName).toBe(
        expectedRecords[index].answeredNote,
      );
    }
    await userEvent.click(canvas.getByRole("button", { name: "試聴要求" }));
    await expect(records()).toBe(finalRecords);
    await expect(args.save).toHaveBeenCalledTimes(1);
  },
};
