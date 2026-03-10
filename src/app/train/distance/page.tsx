import { saveTrainingSessionForCurrentUser } from "../../../features/training/server/saveTrainingSession.entry";
import { getCurrentUserOrNull } from "../../../lib/auth/server";
import { DistanceTrainClient } from "./distance-train-client";

export default async function DistanceTrainPage() {
  const currentUser = await getCurrentUserOrNull();

  async function saveResultsAction(
    input: Parameters<typeof import("../../../features/training/model/distance-guest").buildDistanceGuestSaveInput>[0],
  ) {
    "use server";

    const { buildDistanceGuestSaveInput } = await import(
      "../../../features/training/model/distance-guest"
    );

    return saveTrainingSessionForCurrentUser(buildDistanceGuestSaveInput(input));
  }

  return (
    <DistanceTrainClient
      isAuthenticated={Boolean(currentUser)}
      saveResultsAction={saveResultsAction}
    />
  );
}
