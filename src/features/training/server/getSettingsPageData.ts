import {
  type CurrentUser,
  type CurrentUserResolverDependencies,
  resolveCurrentUserOrNull,
} from "../../../lib/auth/server.ts";
import { withRequestTiming } from "../../../lib/server/request-timing.ts";
import { getCurrentUserSettingsSnapshot } from "../../settings/server/getCurrentUserSettingsSnapshot.ts";
import type {
  DistanceTrainingConfig,
  KeyboardTrainingConfig,
} from "../model/types";

export interface SettingsPageData {
  isAuthenticated: boolean;
  user: CurrentUser | null;
  lastDistanceConfig: DistanceTrainingConfig | null;
  lastKeyboardConfig: KeyboardTrainingConfig | null;
  updatedAt: string | null;
}

export interface SettingsPageDataDependencies
  extends CurrentUserResolverDependencies {
  getCurrentUserSettingsSnapshot?: typeof getCurrentUserSettingsSnapshot;
}

export async function getSettingsPageDataForCurrentUser(
  deps: SettingsPageDataDependencies = {},
): Promise<SettingsPageData> {
  return withRequestTiming("training.getSettingsPageData", async () => {
    const currentUser = await resolveCurrentUserOrNull(deps);

    if (!currentUser) {
      return {
        isAuthenticated: false,
        user: null,
        lastDistanceConfig: null,
        lastKeyboardConfig: null,
        updatedAt: null,
      };
    }

    const snapshot = await (
      deps.getCurrentUserSettingsSnapshot ?? getCurrentUserSettingsSnapshot
    )({
      currentUser,
    });

    return {
      isAuthenticated: true,
      user: currentUser,
      lastDistanceConfig: snapshot.lastDistanceConfig,
      lastKeyboardConfig: snapshot.lastKeyboardConfig,
      updatedAt: snapshot.updatedAt,
    };
  });
}
