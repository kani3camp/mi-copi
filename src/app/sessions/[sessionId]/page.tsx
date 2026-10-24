import { notFound } from "next/navigation";
import { getGlobalUserSettingsForCurrentUser } from "../../../features/settings/server/global-user-settings";
import { getTrainingSessionDetailForCurrentUser } from "../../../features/training/server/getTrainingSessionDetail";
import { getCurrentUserOrNullCached } from "../../../lib/auth/server";
import { SessionDetailPanels } from "./session-detail-panels";

export default async function TrainingSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const currentUser = await getCurrentUserOrNullCached();
  const [detail, globalSettings] = await Promise.all([
    getTrainingSessionDetailForCurrentUser(sessionId, { currentUser }),
    getGlobalUserSettingsForCurrentUser({ currentUser }),
  ]);
  if (!detail) notFound();
  return (
    <SessionDetailPanels
      detail={detail}
      intervalNotationStyle={globalSettings.settings.intervalNotationStyle}
    />
  );
}
