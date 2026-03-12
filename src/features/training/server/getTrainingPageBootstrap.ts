"use server";

import { withRequestTiming } from "../../../lib/server/request-timing.ts";
import type { GlobalUserSettings } from "../../settings/model/global-user-settings";
import { getCurrentUserSettingsSnapshot } from "../../settings/server/getCurrentUserSettingsSnapshot.ts";
import type {
  DistanceTrainingConfig,
  KeyboardTrainingConfig,
  TrainingMode,
} from "../model/types";

interface TrainingPageBootstrapBase {
  isAuthenticated: boolean;
  settingsUpdatedAt: string | null;
  settings: GlobalUserSettings;
  hasStoredConfig: boolean;
}

export interface DistanceTrainingPageBootstrap
  extends TrainingPageBootstrapBase {
  mode: "distance";
  config: DistanceTrainingConfig | null;
}

export interface KeyboardTrainingPageBootstrap
  extends TrainingPageBootstrapBase {
  mode: "keyboard";
  config: KeyboardTrainingConfig | null;
}

export async function getDistanceTrainingPageBootstrapForCurrentUser(): Promise<DistanceTrainingPageBootstrap> {
  return withRequestTiming(
    "training.getDistanceTrainingPageBootstrap",
    async () => {
      const snapshot = await getCurrentUserSettingsSnapshot();

      return {
        mode: "distance",
        isAuthenticated: snapshot.isAuthenticated,
        settings: snapshot.settings,
        settingsUpdatedAt: snapshot.updatedAt,
        config: snapshot.lastDistanceConfig,
        hasStoredConfig: snapshot.lastDistanceConfig !== null,
      };
    },
  );
}

export async function getKeyboardTrainingPageBootstrapForCurrentUser(): Promise<KeyboardTrainingPageBootstrap> {
  return withRequestTiming(
    "training.getKeyboardTrainingPageBootstrap",
    async () => {
      const snapshot = await getCurrentUserSettingsSnapshot();

      return {
        mode: "keyboard",
        isAuthenticated: snapshot.isAuthenticated,
        settings: snapshot.settings,
        settingsUpdatedAt: snapshot.updatedAt,
        config: snapshot.lastKeyboardConfig,
        hasStoredConfig: snapshot.lastKeyboardConfig !== null,
      };
    },
  );
}

export type TrainingPageBootstrapResult<TMode extends TrainingMode> =
  TMode extends "distance"
    ? DistanceTrainingPageBootstrap
    : KeyboardTrainingPageBootstrap;
