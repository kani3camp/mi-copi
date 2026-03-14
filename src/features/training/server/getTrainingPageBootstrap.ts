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
  readWarningMessage: string | null;
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

export interface TrainingPageBootstrapDependencies {
  getCurrentUserSettingsSnapshot?: typeof getCurrentUserSettingsSnapshot;
}

export async function getDistanceTrainingPageBootstrapForCurrentUser(
  deps: TrainingPageBootstrapDependencies = {},
): Promise<DistanceTrainingPageBootstrap> {
  return withRequestTiming(
    "training.getDistanceTrainingPageBootstrap",
    async () => {
      const snapshot = await (
        deps.getCurrentUserSettingsSnapshot ?? getCurrentUserSettingsSnapshot
      )();

      return {
        mode: "distance",
        isAuthenticated: snapshot.isAuthenticated,
        settings: snapshot.settings,
        settingsUpdatedAt: snapshot.updatedAt,
        config: snapshot.lastDistanceConfig,
        hasStoredConfig: snapshot.lastDistanceConfig !== null,
        readWarningMessage: snapshot.readWarningMessage,
      };
    },
  );
}

export async function getKeyboardTrainingPageBootstrapForCurrentUser(
  deps: TrainingPageBootstrapDependencies = {},
): Promise<KeyboardTrainingPageBootstrap> {
  return withRequestTiming(
    "training.getKeyboardTrainingPageBootstrap",
    async () => {
      const snapshot = await (
        deps.getCurrentUserSettingsSnapshot ?? getCurrentUserSettingsSnapshot
      )();

      return {
        mode: "keyboard",
        isAuthenticated: snapshot.isAuthenticated,
        settings: snapshot.settings,
        settingsUpdatedAt: snapshot.updatedAt,
        config: snapshot.lastKeyboardConfig,
        hasStoredConfig: snapshot.lastKeyboardConfig !== null,
        readWarningMessage: snapshot.readWarningMessage,
      };
    },
  );
}

export type TrainingPageBootstrapResult<TMode extends TrainingMode> =
  TMode extends "distance"
    ? DistanceTrainingPageBootstrap
    : KeyboardTrainingPageBootstrap;
