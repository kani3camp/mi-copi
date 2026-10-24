import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { GlobalUserSettingsProvider } from "../../features/settings/client/global-user-settings-provider";
import type { GlobalUserSettings } from "../../features/settings/model/global-user-settings";
import { getCurrentUserSettingsSnapshot } from "../../features/settings/server/getCurrentUserSettingsSnapshot";
import { updateGlobalUserSettingsForCurrentUser } from "../../features/settings/server/global-user-settings";
import { getSettingsPageDataForCurrentUser } from "../../features/training/server/getSettingsPageData";
import { resetLastUsedTrainingConfigForCurrentUser } from "../../features/training/server/lastUsedTrainingConfig";
import { getCurrentUserOrNullCached } from "../../lib/auth/server";
import { SettingsPanels } from "./settings-panels";

interface SettingsPageProps {
  searchParams?: Promise<{
    reset?: string;
    error?: string;
  }>;
}

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const currentUser = await getCurrentUserOrNullCached();
  const [data, userSettingsSnapshot] = await Promise.all([
    getSettingsPageDataForCurrentUser({ currentUser }),
    getCurrentUserSettingsSnapshot({ currentUser }),
  ]);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const resetTarget = resolvedSearchParams?.reset;
  const resetError = resolvedSearchParams?.error;

  async function persistGlobalUserSettingsAction(settings: GlobalUserSettings) {
    "use server";

    return updateGlobalUserSettingsForCurrentUser(settings);
  }

  async function resetDistanceAction() {
    "use server";

    try {
      await resetLastUsedTrainingConfigForCurrentUser("distance");
      revalidatePath("/settings");
      revalidatePath("/train/distance");
    } catch {
      redirect("/settings?error=distance");
    }

    redirect("/settings?reset=distance");
  }

  async function resetKeyboardAction() {
    "use server";

    try {
      await resetLastUsedTrainingConfigForCurrentUser("keyboard");
      revalidatePath("/settings");
      revalidatePath("/train/keyboard");
    } catch {
      redirect("/settings?error=keyboard");
    }

    redirect("/settings?reset=keyboard");
  }

  return (
    <GlobalUserSettingsProvider
      initialSettings={userSettingsSnapshot.settings}
      initialUpdatedAt={userSettingsSnapshot.updatedAt}
      isAuthenticated={userSettingsSnapshot.isAuthenticated}
      persistSettingsAction={persistGlobalUserSettingsAction}
    >
      <SettingsPanels
        data={data}
        resetTarget={resetTarget}
        resetError={resetError}
        resetDistanceAction={resetDistanceAction}
        resetKeyboardAction={resetKeyboardAction}
      />
    </GlobalUserSettingsProvider>
  );
}
