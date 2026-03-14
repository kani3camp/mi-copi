import { GlobalUserSettingsProvider } from "../../../features/settings/client/global-user-settings-provider";
import { createDefaultGlobalUserSettings } from "../../../features/settings/model/global-user-settings";
import { createDefaultKeyboardTrainingConfig } from "../../../features/training/model/config";
import type {
  KeyboardTrainingConfig,
  SaveTrainingSessionInput,
} from "../../../features/training/model/types";
import { getKeyboardTrainingPageBootstrapForCurrentUser } from "../../../features/training/server/getTrainingPageBootstrap";
import { tryUpdateLastUsedTrainingConfigForCurrentUser } from "../../../features/training/server/lastUsedTrainingConfig";
import { saveTrainingSessionForCurrentUser } from "../../../features/training/server/saveTrainingSession.entry";
import { hasSessionTokenCookieCached } from "../../../lib/auth/server";
import { KeyboardTrainClient } from "./keyboard-train-client";

export default async function KeyboardTrainPage() {
  const hasSessionToken = await hasSessionTokenCookieCached();

  async function saveResultsAction(input: SaveTrainingSessionInput) {
    "use server";

    return saveTrainingSessionForCurrentUser(input);
  }

  async function persistLastUsedConfigAction(config: KeyboardTrainingConfig) {
    "use server";

    await tryUpdateLastUsedTrainingConfigForCurrentUser("keyboard", config);
  }

  async function loadBootstrapAction() {
    "use server";

    return getKeyboardTrainingPageBootstrapForCurrentUser();
  }

  return (
    <GlobalUserSettingsProvider
      initialSettings={createDefaultGlobalUserSettings()}
      initialUpdatedAt={null}
      isAuthenticated={hasSessionToken}
    >
      <KeyboardTrainClient
        isAuthenticated={hasSessionToken}
        initialConfig={createDefaultKeyboardTrainingConfig()}
        hasStoredConfig={false}
        loadBootstrapAction={hasSessionToken ? loadBootstrapAction : undefined}
        persistLastUsedConfigAction={persistLastUsedConfigAction}
        saveResultsAction={saveResultsAction}
      />
    </GlobalUserSettingsProvider>
  );
}
