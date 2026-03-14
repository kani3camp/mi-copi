import { getGlobalUserSettingsSaveErrorMessage } from "../../../lib/async-action-errors.ts";
import type { GlobalUserSettingsSaveResult } from "../server/global-user-settings.ts";
import {
  GLOBAL_USER_SETTINGS_STORAGE_KEY,
  type GlobalUserSettings,
  serializeGlobalUserSettings,
} from "./global-user-settings.ts";

export interface GlobalUserSettingsSaveState {
  status: "idle" | "saving" | "saved" | "error";
  updatedAt: string | null;
  message: string | null;
}

export interface GlobalUserSettingsSyncQueue {
  pendingSettings: GlobalUserSettings | null;
  retrySettings: GlobalUserSettings | null;
  isSyncing: boolean;
}

interface QueueAuthenticatedGlobalUserSettingsSaveParams {
  queue: GlobalUserSettingsSyncQueue;
  settings: GlobalUserSettings;
  currentSaveState: GlobalUserSettingsSaveState;
}

interface QueueAuthenticatedGlobalUserSettingsRetryParams {
  queue: GlobalUserSettingsSyncQueue;
  fallbackSettings: GlobalUserSettings | null;
}

interface PersistGuestGlobalUserSettingsParams {
  storage: Pick<Storage, "setItem">;
  settings: GlobalUserSettings;
}

interface SyncPendingAuthenticatedGlobalUserSettingsParams {
  isAuthenticated: boolean;
  persistSettingsAction?: (
    settings: GlobalUserSettings,
  ) => Promise<GlobalUserSettingsSaveResult>;
  queue: GlobalUserSettingsSyncQueue;
  getCurrentSaveState: () => GlobalUserSettingsSaveState;
  setSaveState: (nextState: GlobalUserSettingsSaveState) => void;
}

export function createInitialGlobalUserSettingsSaveState(
  updatedAt: string | null,
): GlobalUserSettingsSaveState {
  return {
    status: "idle",
    updatedAt,
    message: null,
  };
}

export function createBrowserSavedGlobalUserSettingsSaveState(): GlobalUserSettingsSaveState {
  return {
    status: "saved",
    updatedAt: null,
    message: "このブラウザに保存しました。",
  };
}

export function createGlobalUserSettingsSyncQueue(): GlobalUserSettingsSyncQueue {
  return {
    pendingSettings: null,
    retrySettings: null,
    isSyncing: false,
  };
}

export function persistGuestGlobalUserSettings({
  storage,
  settings,
}: PersistGuestGlobalUserSettingsParams): GlobalUserSettingsSaveState {
  storage.setItem(
    GLOBAL_USER_SETTINGS_STORAGE_KEY,
    serializeGlobalUserSettings(settings),
  );

  return createBrowserSavedGlobalUserSettingsSaveState();
}

export function queueAuthenticatedGlobalUserSettingsSave({
  queue,
  settings,
  currentSaveState,
}: QueueAuthenticatedGlobalUserSettingsSaveParams): GlobalUserSettingsSaveState {
  queue.pendingSettings = settings;
  queue.retrySettings = settings;

  return {
    status:
      currentSaveState.status === "saving"
        ? "saving"
        : currentSaveState.status === "saved"
          ? "saved"
          : "idle",
    updatedAt: currentSaveState.updatedAt,
    message: null,
  };
}

export function queueAuthenticatedGlobalUserSettingsRetry({
  queue,
  fallbackSettings,
}: QueueAuthenticatedGlobalUserSettingsRetryParams): boolean {
  queue.pendingSettings = queue.retrySettings ?? fallbackSettings;

  return queue.pendingSettings !== null;
}

export function clearQueuedAuthenticatedGlobalUserSettings(
  queue: GlobalUserSettingsSyncQueue,
): void {
  queue.pendingSettings = null;
  queue.retrySettings = null;
}

export async function syncPendingAuthenticatedGlobalUserSettings({
  isAuthenticated,
  persistSettingsAction,
  queue,
  getCurrentSaveState,
  setSaveState,
}: SyncPendingAuthenticatedGlobalUserSettingsParams): Promise<void> {
  if (
    !isAuthenticated ||
    !persistSettingsAction ||
    queue.isSyncing ||
    !queue.pendingSettings
  ) {
    return;
  }

  queue.isSyncing = true;

  try {
    while (queue.pendingSettings) {
      const snapshot = queue.pendingSettings;
      queue.pendingSettings = null;

      setSaveState({
        status: "saving",
        updatedAt: getCurrentSaveState().updatedAt,
        message: null,
      });

      let result: GlobalUserSettingsSaveResult;

      try {
        result = await persistSettingsAction(snapshot);
      } catch {
        result = {
          ok: false,
          code: "SAVE_FAILED",
          message: getGlobalUserSettingsSaveErrorMessage(),
        };
      }

      if (!result.ok) {
        queue.retrySettings = snapshot;
        setSaveState({
          status: "error",
          updatedAt: getCurrentSaveState().updatedAt,
          message: getGlobalUserSettingsSaveErrorMessage(result),
        });

        if (!queue.pendingSettings) {
          break;
        }

        continue;
      }

      queue.retrySettings = null;
      setSaveState({
        status: "saved",
        updatedAt: result.updatedAt,
        message: "クラウドに保存しました。",
      });
    }
  } finally {
    queue.isSyncing = false;
  }
}
