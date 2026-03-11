import { getCurrentUserOrNull, type CurrentUser } from "../../../lib/auth/server";
import {
  getLastUsedTrainingConfigsForCurrentUser,
} from "./lastUsedTrainingConfig";
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

export async function getSettingsPageDataForCurrentUser(): Promise<SettingsPageData> {
  const [currentUser, lastUsedConfigs] = await Promise.all([
    getCurrentUserOrNull(),
    getLastUsedTrainingConfigsForCurrentUser(),
  ]);

  if (!currentUser) {
    return {
      isAuthenticated: false,
      user: null,
      lastDistanceConfig: null,
      lastKeyboardConfig: null,
      updatedAt: null,
    };
  }

  return {
    isAuthenticated: true,
    user: currentUser,
    lastDistanceConfig: lastUsedConfigs.lastDistanceConfig,
    lastKeyboardConfig: lastUsedConfigs.lastKeyboardConfig,
    updatedAt: lastUsedConfigs.updatedAt,
  };
}
