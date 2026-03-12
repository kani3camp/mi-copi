"use server";

import { eq } from "drizzle-orm";

import {
  type CurrentUserResolverDependencies,
  getCurrentUserOrNull,
} from "../../../lib/auth/server.ts";
import { getDb } from "../../../lib/db/client";
import { userSettings } from "../../../lib/db/schema/app";
import { normalizeTrainingConfigOrDefault } from "../../training/model/config";
import type {
  DistanceTrainingConfig,
  KeyboardTrainingConfig,
} from "../../training/model/types";
import {
  type GlobalUserSettings,
  normalizeGlobalUserSettings,
} from "../model/global-user-settings";
import { getCurrentUserSettingsSnapshot } from "./getCurrentUserSettingsSnapshot";
import { isRecoverableUserSettingsStorageError } from "./user-settings-storage";

interface StoredUserSettingsRow {
  lastDistanceConfig: DistanceTrainingConfig;
  lastKeyboardConfig: KeyboardTrainingConfig;
  createdAt: Date;
}

export interface CurrentGlobalUserSettingsResult {
  isAuthenticated: boolean;
  settings: GlobalUserSettings;
  updatedAt: string | null;
}

export interface GlobalUserSettingsReadDependencies
  extends CurrentUserResolverDependencies {}

export type GlobalUserSettingsSaveResult =
  | {
      ok: true;
      updatedAt: string;
    }
  | {
      ok: false;
      code: "UNAUTHORIZED" | "SAVE_FAILED";
      message: string;
    };

export async function getGlobalUserSettingsForCurrentUser(
  deps: GlobalUserSettingsReadDependencies = {},
): Promise<CurrentGlobalUserSettingsResult> {
  const snapshot = await getCurrentUserSettingsSnapshot(deps);

  return {
    isAuthenticated: snapshot.isAuthenticated,
    settings: snapshot.settings,
    updatedAt: snapshot.updatedAt,
  };
}

export async function updateGlobalUserSettingsForCurrentUser(
  input: GlobalUserSettings,
): Promise<GlobalUserSettingsSaveResult> {
  const currentUser = await getCurrentUserOrNull();

  if (!currentUser) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "A signed-in user is required to save settings.",
    };
  }

  const db = getDb();
  const existing = await getUserSettingsRowForUserId(currentUser.id);
  const now = new Date();
  const normalizedSettings = normalizeGlobalUserSettings(input);

  try {
    await db
      .insert(userSettings)
      .values({
        userId: currentUser.id,
        masterVolume: normalizedSettings.masterVolume,
        soundEffectsEnabled: normalizedSettings.soundEffectsEnabled,
        intervalNotationStyle: normalizedSettings.intervalNotationStyle,
        keyboardNoteLabelsVisible: normalizedSettings.keyboardNoteLabelsVisible,
        lastDistanceConfig: normalizeTrainingConfigOrDefault(
          existing?.lastDistanceConfig,
          "distance",
        ),
        lastKeyboardConfig: normalizeTrainingConfigOrDefault(
          existing?.lastKeyboardConfig,
          "keyboard",
        ),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          masterVolume: normalizedSettings.masterVolume,
          soundEffectsEnabled: normalizedSettings.soundEffectsEnabled,
          intervalNotationStyle: normalizedSettings.intervalNotationStyle,
          keyboardNoteLabelsVisible:
            normalizedSettings.keyboardNoteLabelsVisible,
          lastDistanceConfig: normalizeTrainingConfigOrDefault(
            existing?.lastDistanceConfig,
            "distance",
          ),
          lastKeyboardConfig: normalizeTrainingConfigOrDefault(
            existing?.lastKeyboardConfig,
            "keyboard",
          ),
          updatedAt: now,
        },
      });
  } catch (error) {
    if (isRecoverableUserSettingsStorageError(error)) {
      return {
        ok: false,
        code: "SAVE_FAILED",
        message:
          "The settings storage is not ready yet. Apply the latest migrations and try again.",
      };
    }

    console.error("Failed to save global user settings.", error);

    return {
      ok: false,
      code: "SAVE_FAILED",
      message: "The latest settings could not be saved.",
    };
  }

  return {
    ok: true,
    updatedAt: now.toISOString(),
  };
}

async function getUserSettingsRowForUserId(
  userId: string,
): Promise<StoredUserSettingsRow | null> {
  const db = getDb();

  try {
    const [existing] = await db
      .select({
        lastDistanceConfig: userSettings.lastDistanceConfig,
        lastKeyboardConfig: userSettings.lastKeyboardConfig,
        createdAt: userSettings.createdAt,
      })
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (!existing) {
      return null;
    }

    return {
      ...existing,
      lastDistanceConfig: normalizeTrainingConfigOrDefault(
        existing.lastDistanceConfig,
        "distance",
      ),
      lastKeyboardConfig: normalizeTrainingConfigOrDefault(
        existing.lastKeyboardConfig,
        "keyboard",
      ),
    };
  } catch (error) {
    if (isRecoverableUserSettingsStorageError(error)) {
      return null;
    }

    throw error;
  }
}
