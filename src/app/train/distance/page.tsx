import { saveTrainingSessionForCurrentUser } from "../../../features/training/server/saveTrainingSession.entry";
import {
  getLastUsedTrainingConfigsForCurrentUser,
  updateLastUsedTrainingConfigForCurrentUser,
} from "../../../features/training/server/lastUsedTrainingConfig";
import { getCurrentUserOrNull } from "../../../lib/auth/server";
import { createDefaultDistanceTrainingConfig } from "../../../features/training/model/distance-guest";
import type { DistanceTrainingConfig } from "../../../features/training/model/types";
import { DistanceTrainClient } from "./distance-train-client";

export default async function DistanceTrainPage() {
  const currentUser = await getCurrentUserOrNull();
  const lastUsedConfigs = await getLastUsedTrainingConfigsForCurrentUser();

  async function saveResultsAction(
    input: Parameters<typeof import("../../../features/training/model/distance-guest").buildDistanceGuestSaveInput>[0],
  ) {
    "use server";

    const { buildDistanceGuestSaveInput } = await import(
      "../../../features/training/model/distance-guest"
    );

    return saveTrainingSessionForCurrentUser(buildDistanceGuestSaveInput(input));
  }

  async function persistLastUsedConfigAction(config: DistanceTrainingConfig) {
    "use server";

    await updateLastUsedTrainingConfigForCurrentUser("distance", config);
  }

  return (
    <DistanceTrainClient
      isAuthenticated={Boolean(currentUser)}
      initialConfig={
        lastUsedConfigs.lastDistanceConfig ?? createDefaultDistanceTrainingConfig()
      }
      hasStoredConfig={Boolean(currentUser && lastUsedConfigs.lastDistanceConfig)}
      persistLastUsedConfigAction={persistLastUsedConfigAction}
      saveResultsAction={saveResultsAction}
    />
  );
}
