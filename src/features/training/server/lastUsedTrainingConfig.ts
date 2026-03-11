"use server";

import { eq } from "drizzle-orm";

import { getCurrentUserOrNull } from "../../../lib/auth/server";
import { getDb } from "../../../lib/db/client";
import { userSettings } from "../../../lib/db/schema/app";
import { createDefaultGlobalUserSettings } from "../../settings/model/global-user-settings";
import { createDefaultDistanceTrainingConfig } from "../model/distance-guest";
import { createDefaultKeyboardTrainingConfig } from "../model/keyboard-guest";
import type {
  DistanceTrainingConfig,
  KeyboardTrainingConfig,
  TrainingMode,
} from "../model/types";

export interface LastUsedTrainingConfigs {
  isAuthenticated: boolean;
  lastDistanceConfig: DistanceTrainingConfig | null;
  lastKeyboardConfig: KeyboardTrainingConfig | null;
  updatedAt: string | null;
}

export async function getLastUsedTrainingConfigsForCurrentUser(): Promise<LastUsedTrainingConfigs> {
  const currentUser = await getCurrentUserOrNull();

  if (!currentUser) {
    return {
      isAuthenticated: false,
      lastDistanceConfig: null,
      lastKeyboardConfig: null,
      updatedAt: null,
    };
  }

  const db = getDb();
  const [settings] = await db
    .select({
      lastDistanceConfig: userSettings.lastDistanceConfig,
      lastKeyboardConfig: userSettings.lastKeyboardConfig,
      updatedAt: userSettings.updatedAt,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, currentUser.id))
    .limit(1);

  return {
    isAuthenticated: true,
    lastDistanceConfig: settings?.lastDistanceConfig ?? null,
    lastKeyboardConfig: settings?.lastKeyboardConfig ?? null,
    updatedAt: settings?.updatedAt?.toISOString() ?? null,
  };
}

export async function updateLastUsedTrainingConfigForCurrentUser(
  mode: "distance",
  config: DistanceTrainingConfig,
): Promise<void>;
export async function updateLastUsedTrainingConfigForCurrentUser(
  mode: "keyboard",
  config: KeyboardTrainingConfig,
): Promise<void>;
export async function updateLastUsedTrainingConfigForCurrentUser(
  mode: TrainingMode,
  config: DistanceTrainingConfig | KeyboardTrainingConfig,
): Promise<void> {
  const currentUser = await getCurrentUserOrNull();

  if (!currentUser) {
    return;
  }

  const db = getDb();
  const [existing] = await db
    .select({
      masterVolume: userSettings.masterVolume,
      soundEffectsEnabled: userSettings.soundEffectsEnabled,
      intervalNotationStyle: userSettings.intervalNotationStyle,
      keyboardNoteLabelsVisible: userSettings.keyboardNoteLabelsVisible,
      lastDistanceConfig: userSettings.lastDistanceConfig,
      lastKeyboardConfig: userSettings.lastKeyboardConfig,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, currentUser.id))
    .limit(1);

  const defaultGlobalSettings = createDefaultGlobalUserSettings();
  const now = new Date();

  if (mode === "distance") {
    const distanceConfig = config as DistanceTrainingConfig;

    await db
      .insert(userSettings)
      .values({
        userId: currentUser.id,
        masterVolume:
          existing?.masterVolume ?? defaultGlobalSettings.masterVolume,
        soundEffectsEnabled:
          existing?.soundEffectsEnabled ??
          defaultGlobalSettings.soundEffectsEnabled,
        intervalNotationStyle:
          existing?.intervalNotationStyle ??
          defaultGlobalSettings.intervalNotationStyle,
        keyboardNoteLabelsVisible:
          existing?.keyboardNoteLabelsVisible ??
          defaultGlobalSettings.keyboardNoteLabelsVisible,
        lastDistanceConfig: distanceConfig,
        lastKeyboardConfig:
          existing?.lastKeyboardConfig ?? createDefaultKeyboardTrainingConfig(),
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          masterVolume:
            existing?.masterVolume ?? defaultGlobalSettings.masterVolume,
          soundEffectsEnabled:
            existing?.soundEffectsEnabled ??
            defaultGlobalSettings.soundEffectsEnabled,
          intervalNotationStyle:
            existing?.intervalNotationStyle ??
            defaultGlobalSettings.intervalNotationStyle,
          keyboardNoteLabelsVisible:
            existing?.keyboardNoteLabelsVisible ??
            defaultGlobalSettings.keyboardNoteLabelsVisible,
          lastDistanceConfig: distanceConfig,
          lastKeyboardConfig:
            existing?.lastKeyboardConfig ??
            createDefaultKeyboardTrainingConfig(),
          updatedAt: now,
        },
      });

    return;
  }

  const keyboardConfig = config as KeyboardTrainingConfig;

  await db
    .insert(userSettings)
    .values({
      userId: currentUser.id,
      masterVolume:
        existing?.masterVolume ?? defaultGlobalSettings.masterVolume,
      soundEffectsEnabled:
        existing?.soundEffectsEnabled ??
        defaultGlobalSettings.soundEffectsEnabled,
      intervalNotationStyle:
        existing?.intervalNotationStyle ??
        defaultGlobalSettings.intervalNotationStyle,
      keyboardNoteLabelsVisible:
        existing?.keyboardNoteLabelsVisible ??
        defaultGlobalSettings.keyboardNoteLabelsVisible,
      lastDistanceConfig:
        existing?.lastDistanceConfig ?? createDefaultDistanceTrainingConfig(),
      lastKeyboardConfig: keyboardConfig,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: {
        masterVolume:
          existing?.masterVolume ?? defaultGlobalSettings.masterVolume,
        soundEffectsEnabled:
          existing?.soundEffectsEnabled ??
          defaultGlobalSettings.soundEffectsEnabled,
        intervalNotationStyle:
          existing?.intervalNotationStyle ??
          defaultGlobalSettings.intervalNotationStyle,
        keyboardNoteLabelsVisible:
          existing?.keyboardNoteLabelsVisible ??
          defaultGlobalSettings.keyboardNoteLabelsVisible,
        lastDistanceConfig:
          existing?.lastDistanceConfig ?? createDefaultDistanceTrainingConfig(),
        lastKeyboardConfig: keyboardConfig,
        updatedAt: now,
      },
    });
}

export async function resetLastUsedTrainingConfigForCurrentUser(
  mode: "distance" | "keyboard",
): Promise<void> {
  if (mode === "distance") {
    await updateLastUsedTrainingConfigForCurrentUser(
      "distance",
      createDefaultDistanceTrainingConfig(),
    );
    return;
  }

  await updateLastUsedTrainingConfigForCurrentUser(
    "keyboard",
    createDefaultKeyboardTrainingConfig(),
  );
}
