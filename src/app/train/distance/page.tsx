import { GlobalUserSettingsProvider } from "../../../features/settings/client/global-user-settings-provider";
import { getGlobalUserSettingsForCurrentUser } from "../../../features/settings/server/global-user-settings";
import { createDefaultDistanceTrainingConfig } from "../../../features/training/model/distance-guest";
import type { DistanceTrainingConfig } from "../../../features/training/model/types";
import {
  getLastUsedTrainingConfigsForCurrentUser,
  tryUpdateLastUsedTrainingConfigForCurrentUser,
} from "../../../features/training/server/lastUsedTrainingConfig";
import { saveTrainingSessionForCurrentUser } from "../../../features/training/server/saveTrainingSession.entry";
import { getCurrentUserOrNullCached } from "../../../lib/auth/server";
import { DistanceTrainClient } from "./distance-train-client";

export default async function DistanceTrainPage() {
  const currentUser = await getCurrentUserOrNullCached();
  const [lastUsedConfigs, initialGlobalSettings] = await Promise.all([
    getLastUsedTrainingConfigsForCurrentUser({ currentUser }),
    getGlobalUserSettingsForCurrentUser({ currentUser }),
  ]);

  async function saveResultsAction(
    input: Parameters<
      typeof import("../../../features/training/model/distance-guest").buildDistanceGuestSaveInput
    >[0],
  ) {
    "use server";

    const { buildDistanceGuestSaveInput } = await import(
      "../../../features/training/model/distance-guest"
    );

    return saveTrainingSessionForCurrentUser(
      buildDistanceGuestSaveInput(input),
    );
  }

  async function persistLastUsedConfigAction(config: DistanceTrainingConfig) {
    "use server";

    await tryUpdateLastUsedTrainingConfigForCurrentUser("distance", config);
  }

  return (
    <GlobalUserSettingsProvider
      initialSettings={initialGlobalSettings.settings}
      initialUpdatedAt={initialGlobalSettings.updatedAt}
      isAuthenticated={initialGlobalSettings.isAuthenticated}
    >
      <DistanceTrainClient
        isAuthenticated={Boolean(currentUser)}
        initialConfig={
          lastUsedConfigs.lastDistanceConfig ??
          createDefaultDistanceTrainingConfig()
        }
        hasStoredConfig={Boolean(
          currentUser && lastUsedConfigs.lastDistanceConfig,
        )}
        persistLastUsedConfigAction={persistLastUsedConfigAction}
        saveResultsAction={saveResultsAction}
      />
    </GlobalUserSettingsProvider>
  );
}
