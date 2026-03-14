import { GlobalUserSettingsProvider } from "../../../features/settings/client/global-user-settings-provider";
import { createDefaultGlobalUserSettings } from "../../../features/settings/model/global-user-settings";
import { createDefaultDistanceTrainingConfig } from "../../../features/training/model/config";
import type {
  DistanceTrainingConfig,
  SaveTrainingSessionInput,
} from "../../../features/training/model/types";
import { getDistanceTrainingPageBootstrapForCurrentUser } from "../../../features/training/server/getTrainingPageBootstrap";
import { tryUpdateLastUsedTrainingConfigForCurrentUser } from "../../../features/training/server/lastUsedTrainingConfig";
import { saveTrainingSessionForCurrentUser } from "../../../features/training/server/saveTrainingSession.entry";
import { hasSessionTokenCookieCached } from "../../../lib/auth/server";
import { DistanceTrainClient } from "./distance-train-client";

export default async function DistanceTrainPage() {
  const hasSessionToken = await hasSessionTokenCookieCached();

  async function saveResultsAction(input: SaveTrainingSessionInput) {
    "use server";

    return saveTrainingSessionForCurrentUser(input);
  }

  async function persistLastUsedConfigAction(config: DistanceTrainingConfig) {
    "use server";

    await tryUpdateLastUsedTrainingConfigForCurrentUser("distance", config);
  }

  async function loadBootstrapAction() {
    "use server";

    return getDistanceTrainingPageBootstrapForCurrentUser();
  }

  return (
    <GlobalUserSettingsProvider
      initialSettings={createDefaultGlobalUserSettings()}
      initialUpdatedAt={null}
      isAuthenticated={hasSessionToken}
    >
      <DistanceTrainClient
        isAuthenticated={hasSessionToken}
        initialConfig={createDefaultDistanceTrainingConfig()}
        hasStoredConfig={false}
        loadBootstrapAction={hasSessionToken ? loadBootstrapAction : undefined}
        persistLastUsedConfigAction={persistLastUsedConfigAction}
        saveResultsAction={saveResultsAction}
      />
    </GlobalUserSettingsProvider>
  );
}
