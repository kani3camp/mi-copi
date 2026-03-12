"use server";

import { eq } from "drizzle-orm";

import type { CurrentUser } from "../../../lib/auth/server.ts";
import { createDefaultGlobalUserSettings } from "../../settings/model/global-user-settings.ts";
import { isRecoverableUserSettingsStorageError } from "../../settings/server/user-settings-storage.ts";
import {
  createDefaultDistanceTrainingConfig,
  createDefaultKeyboardTrainingConfig,
  normalizeTrainingConfigOrDefault,
} from "../model/config.ts";
import type {
  DistanceTrainingConfig,
  KeyboardTrainingConfig,
  TrainingMode,
} from "../model/types.ts";

export interface LastUsedTrainingConfigs {
  isAuthenticated: boolean;
  lastDistanceConfig: DistanceTrainingConfig | null;
  lastKeyboardConfig: KeyboardTrainingConfig | null;
  updatedAt: string | null;
}

export interface LastUsedTrainingConfigDependencies {
  db?: {
    select: (...args: unknown[]) => any;
    insert: (...args: unknown[]) => any;
  };
  getCurrentUser?: () => Promise<CurrentUser | null>;
  now?: () => Date;
}

export async function getLastUsedTrainingConfigsForCurrentUser(
  deps: LastUsedTrainingConfigDependencies = {},
): Promise<LastUsedTrainingConfigs> {
  const currentUser = await (deps.getCurrentUser ?? getCurrentUserOrNull)();

  if (!currentUser) {
    return {
      isAuthenticated: false,
      lastDistanceConfig: null,
      lastKeyboardConfig: null,
      updatedAt: null,
    };
  }

  const db = deps.db ?? (await getDb());
  const { userSettings }: any = deps.db
    ? getPlaceholderUserSettingsTable()
    : await getUserSettingsTable();
  let settings: {
    lastDistanceConfig: DistanceTrainingConfig;
    lastKeyboardConfig: KeyboardTrainingConfig;
    updatedAt: Date;
  } | null = null;

  try {
    const [existing] = await db
      .select({
        lastDistanceConfig: userSettings.lastDistanceConfig,
        lastKeyboardConfig: userSettings.lastKeyboardConfig,
        updatedAt: userSettings.updatedAt,
      })
      .from(userSettings)
      .where(eq(userSettings.userId, currentUser.id))
      .limit(1);

    settings = existing
      ? {
          lastDistanceConfig: normalizeTrainingConfigOrDefault(
            existing.lastDistanceConfig,
            "distance",
          ),
          lastKeyboardConfig: normalizeTrainingConfigOrDefault(
            existing.lastKeyboardConfig,
            "keyboard",
          ),
          updatedAt: existing.updatedAt,
        }
      : null;
  } catch (error) {
    if (!isRecoverableUserSettingsStorageError(error)) {
      throw error;
    }
  }

  return {
    isAuthenticated: true,
    lastDistanceConfig: settings?.lastDistanceConfig ?? null,
    lastKeyboardConfig: settings?.lastKeyboardConfig ?? null,
    updatedAt: settings?.updatedAt?.toISOString() ?? null,
  };
}

export async function tryUpdateLastUsedTrainingConfigForCurrentUser(
  mode: "distance",
  config: DistanceTrainingConfig,
  deps?: LastUsedTrainingConfigDependencies,
): Promise<void>;
export async function tryUpdateLastUsedTrainingConfigForCurrentUser(
  mode: "keyboard",
  config: KeyboardTrainingConfig,
  deps?: LastUsedTrainingConfigDependencies,
): Promise<void>;
export async function tryUpdateLastUsedTrainingConfigForCurrentUser(
  mode: TrainingMode,
  config: DistanceTrainingConfig | KeyboardTrainingConfig,
  deps: LastUsedTrainingConfigDependencies = {},
): Promise<void> {
  try {
    if (mode === "distance") {
      await updateLastUsedTrainingConfigForCurrentUser(
        mode,
        config as DistanceTrainingConfig,
        deps,
      );
      return;
    }

    await updateLastUsedTrainingConfigForCurrentUser(
      mode,
      config as KeyboardTrainingConfig,
      deps,
    );
  } catch (error) {
    if (isRecoverableUserSettingsStorageError(error)) {
      return;
    }

    throw error;
  }
}

export async function updateLastUsedTrainingConfigForCurrentUser(
  mode: "distance",
  config: DistanceTrainingConfig,
  deps?: LastUsedTrainingConfigDependencies,
): Promise<void>;
export async function updateLastUsedTrainingConfigForCurrentUser(
  mode: "keyboard",
  config: KeyboardTrainingConfig,
  deps?: LastUsedTrainingConfigDependencies,
): Promise<void>;
export async function updateLastUsedTrainingConfigForCurrentUser(
  mode: TrainingMode,
  config: DistanceTrainingConfig | KeyboardTrainingConfig,
  deps: LastUsedTrainingConfigDependencies = {},
): Promise<void> {
  const currentUser = await (deps.getCurrentUser ?? getCurrentUserOrNull)();

  if (!currentUser) {
    return;
  }

  const db = deps.db ?? (await getDb());
  const { userSettings }: any = deps.db
    ? getPlaceholderUserSettingsTable()
    : await getUserSettingsTable();
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
  const now = deps.now?.() ?? new Date();
  const normalizedDistanceConfig = normalizeTrainingConfigOrDefault(
    existing?.lastDistanceConfig,
    "distance",
  );
  const normalizedKeyboardConfig = normalizeTrainingConfigOrDefault(
    existing?.lastKeyboardConfig,
    "keyboard",
  );

  if (mode === "distance") {
    const distanceConfig = normalizeTrainingConfigOrDefault(config, "distance");

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
        lastKeyboardConfig: normalizedKeyboardConfig,
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
          lastKeyboardConfig: normalizedKeyboardConfig,
          updatedAt: now,
        },
      });

    return;
  }

  const keyboardConfig = normalizeTrainingConfigOrDefault(config, "keyboard");

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
      lastDistanceConfig: normalizedDistanceConfig,
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
        lastDistanceConfig: normalizedDistanceConfig,
        lastKeyboardConfig: keyboardConfig,
        updatedAt: now,
      },
    });
}

export async function resetLastUsedTrainingConfigForCurrentUser(
  mode: "distance" | "keyboard",
  deps: LastUsedTrainingConfigDependencies = {},
): Promise<void> {
  if (mode === "distance") {
    await updateLastUsedTrainingConfigForCurrentUser(
      "distance",
      createDefaultDistanceTrainingConfig(),
      deps,
    );
    return;
  }

  await updateLastUsedTrainingConfigForCurrentUser(
    "keyboard",
    createDefaultKeyboardTrainingConfig(),
    deps,
  );
}

async function getCurrentUserOrNull(): Promise<CurrentUser | null> {
  const { getCurrentUserOrNull: resolveCurrentUserOrNull } = await import(
    "../../../lib/auth/server.ts"
  );

  return resolveCurrentUserOrNull();
}

async function getDb() {
  const { getDb: resolveDb } = await import("../../../lib/db/client.ts");

  return resolveDb();
}

async function getUserSettingsTable() {
  const { userSettings } = await import("../../../lib/db/schema/app.ts");

  return { userSettings };
}

function getPlaceholderUserSettingsTable() {
  return {
    userSettings: {
      userId: "user_settings.user_id",
      masterVolume: "user_settings.master_volume",
      soundEffectsEnabled: "user_settings.sound_effects_enabled",
      intervalNotationStyle: "user_settings.interval_notation_style",
      keyboardNoteLabelsVisible: "user_settings.keyboard_note_labels_visible",
      lastDistanceConfig: "user_settings.last_distance_config",
      lastKeyboardConfig: "user_settings.last_keyboard_config",
      updatedAt: "user_settings.updated_at",
    },
  };
}
