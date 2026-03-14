"use server";

import { eq } from "drizzle-orm";
import { getStoredSettingsReadErrorMessage } from "../../../lib/async-action-errors.ts";
import {
  type CurrentUserResolverDependencies,
  resolveCurrentUserOrNull,
} from "../../../lib/auth/server.ts";
import { withRequestTiming } from "../../../lib/server/request-timing.ts";
import { normalizeTrainingConfigOrDefault } from "../../training/model/config.ts";
import type {
  DistanceTrainingConfig,
  KeyboardTrainingConfig,
} from "../../training/model/types.ts";
import type { SelectOnlyDb } from "../../training/server/query-types.ts";
import {
  createDefaultGlobalUserSettings,
  type GlobalUserSettings,
  normalizeGlobalUserSettings,
} from "../model/global-user-settings.ts";
import { isRecoverableUserSettingsStorageError } from "./user-settings-storage.ts";

type AppSchemaModule = typeof import("../../../lib/db/schema/app.ts");

type UserSettingsTables = {
  userSettings: AppSchemaModule["userSettings"];
};

interface UserSettingsRow {
  masterVolume: number;
  soundEffectsEnabled: boolean;
  intervalNotationStyle: GlobalUserSettings["intervalNotationStyle"];
  keyboardNoteLabelsVisible: boolean;
  lastDistanceConfig: unknown;
  lastKeyboardConfig: unknown;
  updatedAt: Date;
}

export interface CurrentUserSettingsSnapshot {
  isAuthenticated: boolean;
  settings: GlobalUserSettings;
  lastDistanceConfig: DistanceTrainingConfig | null;
  lastKeyboardConfig: KeyboardTrainingConfig | null;
  updatedAt: string | null;
  readWarningMessage: string | null;
}

export interface CurrentUserSettingsSnapshotDependencies
  extends CurrentUserResolverDependencies {
  db?: SelectOnlyDb;
}

export async function getCurrentUserSettingsSnapshot(
  deps: CurrentUserSettingsSnapshotDependencies = {},
): Promise<CurrentUserSettingsSnapshot> {
  return withRequestTiming(
    "settings.getCurrentUserSettingsSnapshot",
    async () => {
      const currentUser = await resolveCurrentUserOrNull(deps);

      if (!currentUser) {
        return {
          isAuthenticated: false,
          settings: createDefaultGlobalUserSettings(),
          lastDistanceConfig: null,
          lastKeyboardConfig: null,
          updatedAt: null,
          readWarningMessage: null,
        };
      }

      const db = (deps.db ?? (await getDbClient())) as SelectOnlyDb;
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
          updatedAt: userSettings.updatedAt,
        })
        .from(userSettings)
        .where(eq(userSettings.userId, currentUser.id))
        .limit(1)) as UserSettingsRow[];

      if (!existing) {
        return {
          isAuthenticated: true,
          settings: createDefaultGlobalUserSettings(),
          lastDistanceConfig: null,
          lastKeyboardConfig: null,
          updatedAt: null,
          readWarningMessage: null,
        };
      }

      return {
        isAuthenticated: true,
        settings: normalizeGlobalUserSettings({
          masterVolume: existing.masterVolume,
          soundEffectsEnabled: existing.soundEffectsEnabled,
          intervalNotationStyle: existing.intervalNotationStyle,
          keyboardNoteLabelsVisible: existing.keyboardNoteLabelsVisible,
        }),
        lastDistanceConfig: normalizeTrainingConfigOrDefault(
          existing.lastDistanceConfig,
          "distance",
        ),
        lastKeyboardConfig: normalizeTrainingConfigOrDefault(
          existing.lastKeyboardConfig,
          "keyboard",
        ),
        updatedAt: existing.updatedAt.toISOString(),
        readWarningMessage: null,
      };
    },
  ).catch((error) => {
    if (isRecoverableUserSettingsStorageError(error)) {
      return {
        isAuthenticated: true,
        settings: createDefaultGlobalUserSettings(),
        lastDistanceConfig: null,
        lastKeyboardConfig: null,
        updatedAt: null,
        readWarningMessage: getStoredSettingsReadErrorMessage(),
      };
    }

    throw error;
  });
}

async function getDbClient() {
  const { getDb } = await import("../../../lib/db/client.ts");

  return getDb();
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
