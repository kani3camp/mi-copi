import { getGlobalUserSettingsForCurrentUser } from "../../features/settings/server/global-user-settings";
import { getTrainingStatsForCurrentUser } from "../../features/training/server/getTrainingStats";
import { getCurrentUserOrNullCached } from "../../lib/auth/server";
import { StatsPanels } from "./stats-panels";

export default async function StatsPage() {
  const currentUser = await getCurrentUserOrNullCached();
  const [stats, globalSettings] = await Promise.all([
    getTrainingStatsForCurrentUser({ currentUser }),
    getGlobalUserSettingsForCurrentUser({ currentUser }),
  ]);
  return (
    <StatsPanels
      stats={stats}
      intervalNotationStyle={globalSettings.settings.intervalNotationStyle}
    />
  );
}
