import { GlobalUserSettingsProvider } from "../../../features/settings/client/global-user-settings-provider";
import { getGlobalUserSettingsForCurrentUser } from "../../../features/settings/server/global-user-settings";
import {
  buildKeyboardGuestSaveInput,
  createDefaultKeyboardTrainingConfig,
} from "../../../features/training/model/keyboard-guest";
import type { KeyboardTrainingConfig } from "../../../features/training/model/types";
import {
  getLastUsedTrainingConfigsForCurrentUser,
  tryUpdateLastUsedTrainingConfigForCurrentUser,
} from "../../../features/training/server/lastUsedTrainingConfig";
import { saveTrainingSessionForCurrentUser } from "../../../features/training/server/saveTrainingSession.entry";
import { getCurrentUserOrNullCached } from "../../../lib/auth/server";
import { KeyboardTrainClient } from "./keyboard-train-client";

export default async function KeyboardTrainPage() {
  const currentUser = await getCurrentUserOrNullCached();
  const [lastUsedConfigs, initialGlobalSettings] = await Promise.all([
    getLastUsedTrainingConfigsForCurrentUser({ currentUser }),
    getGlobalUserSettingsForCurrentUser({ currentUser }),
  ]);

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

    await tryUpdateLastUsedTrainingConfigForCurrentUser("keyboard", config);
  }

  return (
    <GlobalUserSettingsProvider
      initialSettings={initialGlobalSettings.settings}
      initialUpdatedAt={initialGlobalSettings.updatedAt}
      isAuthenticated={initialGlobalSettings.isAuthenticated}
    >
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
    </GlobalUserSettingsProvider>
  );
}
