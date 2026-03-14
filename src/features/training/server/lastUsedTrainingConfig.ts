"use server";

import { eq } from "drizzle-orm";

import {
  type CurrentUserResolverDependencies,
  resolveCurrentUserOrNull,
} from "../../../lib/auth/server.ts";
import { createDefaultGlobalUserSettings } from "../../settings/model/global-user-settings.ts";
import { getCurrentUserSettingsSnapshot } from "../../settings/server/getCurrentUserSettingsSnapshot.ts";
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
import type { InsertDb, SelectOnlyDb } from "./query-types.ts";

export interface LastUsedTrainingConfigs {
  isAuthenticated: boolean;
  lastDistanceConfig: DistanceTrainingConfig | null;
  lastKeyboardConfig: KeyboardTrainingConfig | null;
  updatedAt: string | null;
}

export interface LastUsedTrainingConfigDependencies {
  db?: SelectOnlyDb & InsertDb;
  currentUser?: CurrentUserResolverDependencies["currentUser"];
  getCurrentUser?: CurrentUserResolverDependencies["getCurrentUser"];
  now?: () => Date;
}

type AppSchemaModule = typeof import("../../../lib/db/schema/app.ts");

type UserSettingsTables = {
  userSettings: AppSchemaModule["userSettings"];
};

interface UserSettingsUpsertExistingRow {
  masterVolume: number;
  soundEffectsEnabled: boolean;
  intervalNotationStyle: "ja" | "abbr" | "mixed";
  keyboardNoteLabelsVisible: boolean;
  lastDistanceConfig: unknown;
  lastKeyboardConfig: unknown;
}

export async function getLastUsedTrainingConfigsForCurrentUser(
  deps: LastUsedTrainingConfigDependencies = {},
): Promise<LastUsedTrainingConfigs> {
  const snapshot = await getCurrentUserSettingsSnapshot(deps);

  return {
    isAuthenticated: snapshot.isAuthenticated,
    lastDistanceConfig: snapshot.lastDistanceConfig,
    lastKeyboardConfig: snapshot.lastKeyboardConfig,
    updatedAt: snapshot.updatedAt,
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
  const currentUser = await resolveCurrentUserOrNull(deps);

  if (!currentUser) {
    return;
  }

  const db = (deps.db ?? (await getDb())) as SelectOnlyDb & InsertDb;
  const { userSettings } = deps.db
    ? getPlaceholderUserSettingsTable()
    : await getUserSettingsTable();
  const [existing] = (await db
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
    .limit(1)) as UserSettingsUpsertExistingRow[];

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

async function getDb() {
  const { getDb: resolveDb } = await import("../../../lib/db/client.ts");

  return resolveDb();
}

async function getUserSettingsTable() {
  const { userSettings } = await import("../../../lib/db/schema/app.ts");

  return { userSettings };
}

function getPlaceholderUserSettingsTable(): UserSettingsTables {
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
  } as unknown as UserSettingsTables;
}
