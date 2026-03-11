import { saveTrainingSessionForCurrentUser } from "../../../features/training/server/saveTrainingSession.entry";
import { buildKeyboardGuestSaveInput } from "../../../features/training/model/keyboard-guest";
import type { KeyboardTrainingConfig } from "../../../features/training/model/types";
import type { KeyboardGuestResult } from "../../../features/training/model/keyboard-guest";
import {
  getLastUsedTrainingConfigsForCurrentUser,
  updateLastUsedTrainingConfigForCurrentUser,
} from "../../../features/training/server/lastUsedTrainingConfig";
import { getCurrentUserOrNull } from "../../../lib/auth/server";
import { createDefaultKeyboardTrainingConfig } from "../../../features/training/model/keyboard-guest";
import { KeyboardTrainClient } from "./keyboard-train-client";

export default async function KeyboardTrainPage() {
  const currentUser = await getCurrentUserOrNull();
  const lastUsedConfigs = await getLastUsedTrainingConfigsForCurrentUser();

  async function saveResultsAction(input: {
    config: KeyboardTrainingConfig;
    startedAt: string;
    results: KeyboardGuestResult[];
  }) {
    "use server";

    return saveTrainingSessionForCurrentUser(buildKeyboardGuestSaveInput(input));
  }

  async function persistLastUsedConfigAction(config: KeyboardTrainingConfig) {
    "use server";

    await updateLastUsedTrainingConfigForCurrentUser("keyboard", config);
  }

  return (
    <KeyboardTrainClient
      isAuthenticated={Boolean(currentUser)}
      initialConfig={
        lastUsedConfigs.lastKeyboardConfig ?? createDefaultKeyboardTrainingConfig()
      }
      hasStoredConfig={Boolean(currentUser && lastUsedConfigs.lastKeyboardConfig)}
      persistLastUsedConfigAction={persistLastUsedConfigAction}
      saveResultsAction={saveResultsAction}
    />
  );
}
