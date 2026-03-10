import { saveTrainingSessionForCurrentUser } from "../../../features/training/server/saveTrainingSession.entry";
import { getCurrentUserOrNull } from "../../../lib/auth/server";
import { buildKeyboardGuestSaveInput } from "../../../features/training/model/keyboard-guest";
import type { KeyboardTrainingConfig } from "../../../features/training/model/types";
import type { KeyboardGuestResult } from "../../../features/training/model/keyboard-guest";
import { KeyboardTrainClient } from "./keyboard-train-client";

export default async function KeyboardTrainPage() {
  const currentUser = await getCurrentUserOrNull();

  async function saveResultsAction(input: {
    config: KeyboardTrainingConfig;
    startedAt: string;
    results: KeyboardGuestResult[];
  }) {
    "use server";

    return saveTrainingSessionForCurrentUser(buildKeyboardGuestSaveInput(input));
  }

  return (
    <KeyboardTrainClient
      isAuthenticated={Boolean(currentUser)}
      saveResultsAction={saveResultsAction}
    />
  );
}
