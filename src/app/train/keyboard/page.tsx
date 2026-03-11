import {
  buildKeyboardGuestSaveInput,
  createDefaultKeyboardTrainingConfig,
} from "../../../features/training/model/keyboard-guest";
import type { KeyboardTrainingConfig } from "../../../features/training/model/types";
import {
  getLastUsedTrainingConfigsForCurrentUser,
  updateLastUsedTrainingConfigForCurrentUser,
} from "../../../features/training/server/lastUsedTrainingConfig";
import { saveTrainingSessionForCurrentUser } from "../../../features/training/server/saveTrainingSession.entry";
import { getCurrentUserOrNull } from "../../../lib/auth/server";
import { KeyboardTrainClient } from "./keyboard-train-client";

export default async function KeyboardTrainPage() {
  const currentUser = await getCurrentUserOrNull();
  const lastUsedConfigs = await getLastUsedTrainingConfigsForCurrentUser();

  async function saveResultsAction(
    input: Parameters<typeof buildKeyboardGuestSaveInput>[0],
  ) {
    "use server";

    return saveTrainingSessionForCurrentUser(
      buildKeyboardGuestSaveInput(input),
    );
  }

  async function persistLastUsedConfigAction(config: KeyboardTrainingConfig) {
    "use server";

    await updateLastUsedTrainingConfigForCurrentUser("keyboard", config);
  }

  return (
    <KeyboardTrainClient
      isAuthenticated={Boolean(currentUser)}
      initialConfig={
        lastUsedConfigs.lastKeyboardConfig ??
        createDefaultKeyboardTrainingConfig()
      }
      hasStoredConfig={Boolean(
        currentUser && lastUsedConfigs.lastKeyboardConfig,
      )}
      persistLastUsedConfigAction={persistLastUsedConfigAction}
      saveResultsAction={saveResultsAction}
    />
  );
}
