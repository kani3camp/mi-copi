"use server";

import { eq } from "drizzle-orm";

import { getCurrentUserOrNull } from "../../../lib/auth/server";
import { getDb } from "../../../lib/db/client";
import { userSettings } from "../../../lib/db/schema/app";
import { createDefaultDistanceTrainingConfig } from "../../training/model/distance-guest";
import { createDefaultKeyboardTrainingConfig } from "../../training/model/keyboard-guest";
import type {
  DistanceTrainingConfig,
  KeyboardTrainingConfig,
} from "../../training/model/types";
import {
  createDefaultGlobalUserSettings,
  type GlobalUserSettings,
  normalizeGlobalUserSettings,
} from "../model/global-user-settings";

interface UserSettingsRow {
  masterVolume: number;
  soundEffectsEnabled: boolean;
  intervalNotationStyle: GlobalUserSettings["intervalNotationStyle"];
  keyboardNoteLabelsVisible: boolean;
  lastDistanceConfig: DistanceTrainingConfig;
  lastKeyboardConfig: KeyboardTrainingConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface CurrentGlobalUserSettingsResult {
  isAuthenticated: boolean;
  settings: GlobalUserSettings;
  updatedAt: string | null;
}

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

export async function getGlobalUserSettingsForCurrentUser(): Promise<CurrentGlobalUserSettingsResult> {
  const currentUser = await getCurrentUserOrNull();

  if (!currentUser) {
    return {
      isAuthenticated: false,
      settings: createDefaultGlobalUserSettings(),
      updatedAt: null,
    };
  }

  const existing = await getUserSettingsRowForUserId(currentUser.id);

  return {
    isAuthenticated: true,
    settings: existing
      ? normalizeGlobalUserSettings({
          masterVolume: existing.masterVolume,
          soundEffectsEnabled: existing.soundEffectsEnabled,
          intervalNotationStyle: existing.intervalNotationStyle,
          keyboardNoteLabelsVisible: existing.keyboardNoteLabelsVisible,
        })
      : createDefaultGlobalUserSettings(),
    updatedAt: existing?.updatedAt.toISOString() ?? null,
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
        lastDistanceConfig:
          existing?.lastDistanceConfig ?? createDefaultDistanceTrainingConfig(),
        lastKeyboardConfig:
          existing?.lastKeyboardConfig ?? createDefaultKeyboardTrainingConfig(),
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
          lastDistanceConfig:
            existing?.lastDistanceConfig ??
            createDefaultDistanceTrainingConfig(),
          lastKeyboardConfig:
            existing?.lastKeyboardConfig ??
            createDefaultKeyboardTrainingConfig(),
          updatedAt: now,
        },
      });
  } catch {
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
): Promise<UserSettingsRow | null> {
  const db = getDb();
  const [existing] = await db
    .select({
      masterVolume: userSettings.masterVolume,
      soundEffectsEnabled: userSettings.soundEffectsEnabled,
      intervalNotationStyle: userSettings.intervalNotationStyle,
      keyboardNoteLabelsVisible: userSettings.keyboardNoteLabelsVisible,
      lastDistanceConfig: userSettings.lastDistanceConfig,
      lastKeyboardConfig: userSettings.lastKeyboardConfig,
      createdAt: userSettings.createdAt,
      updatedAt: userSettings.updatedAt,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  return existing ?? null;
}
