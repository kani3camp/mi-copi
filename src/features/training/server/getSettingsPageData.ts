import {
  type CurrentUser,
  type CurrentUserResolverDependencies,
  resolveCurrentUserOrNull,
} from "../../../lib/auth/server.ts";
import type {
  DistanceTrainingConfig,
  KeyboardTrainingConfig,
} from "../model/types";
import { getLastUsedTrainingConfigsForCurrentUser } from "./lastUsedTrainingConfig.ts";

export interface SettingsPageData {
  isAuthenticated: boolean;
  user: CurrentUser | null;
  lastDistanceConfig: DistanceTrainingConfig | null;
  lastKeyboardConfig: KeyboardTrainingConfig | null;
  updatedAt: string | null;
}

export interface SettingsPageDataDependencies
  extends CurrentUserResolverDependencies {
  getLastUsedTrainingConfigs?: typeof getLastUsedTrainingConfigsForCurrentUser;
}

export async function getSettingsPageDataForCurrentUser(
  deps: SettingsPageDataDependencies = {},
): Promise<SettingsPageData> {
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

  const lastUsedConfigs = await (
    deps.getLastUsedTrainingConfigs ?? getLastUsedTrainingConfigsForCurrentUser
  )({
    currentUser,
  });

  return {
    isAuthenticated: true,
    user: currentUser,
    lastDistanceConfig: lastUsedConfigs.lastDistanceConfig,
    lastKeyboardConfig: lastUsedConfigs.lastKeyboardConfig,
    updatedAt: lastUsedConfigs.updatedAt,
  };
}
