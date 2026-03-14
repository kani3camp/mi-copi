import assert from "node:assert/strict";
import test from "node:test";
import type { GlobalUserSettings } from "./global-user-settings";
import type {
  GlobalUserSettingsSaveState,
  GlobalUserSettingsSyncQueue,
} from "./global-user-settings-sync";

const {
  createBrowserSavedGlobalUserSettingsSaveState,
  createGlobalUserSettingsSyncQueue,
  createInitialGlobalUserSettingsSaveState,
  persistGuestGlobalUserSettings,
  queueAuthenticatedGlobalUserSettingsRetry,
  queueAuthenticatedGlobalUserSettingsSave,
  syncPendingAuthenticatedGlobalUserSettings,
} = await import(
  new URL("./global-user-settings-sync.ts", import.meta.url).href
);
const {
  createDefaultGlobalUserSettings,
  GLOBAL_USER_SETTINGS_STORAGE_KEY,
  serializeGlobalUserSettings,
} = await import(new URL("./global-user-settings.ts", import.meta.url).href);

test("authenticated settings stay queued until sync runs", async () => {
  const queue = createGlobalUserSettingsSyncQueue();
  const saveStateStore = createSaveStateStore("2026-03-14T00:00:00.000Z");
  const persistedSettings: GlobalUserSettings[] = [];
  const queuedSettings: GlobalUserSettings = {
    ...createDefaultGlobalUserSettings(),
    masterVolume: 56,
  };

  saveStateStore.setSaveState(
    queueAuthenticatedGlobalUserSettingsSave({
      queue,
      settings: queuedSettings,
      currentSaveState: saveStateStore.getCurrentSaveState(),
    }),
  );

  assert.equal(persistedSettings.length, 0);
  assert.deepEqual(queue.pendingSettings, queuedSettings);
  assert.equal(queue.retrySettings, queuedSettings);

  await syncPendingAuthenticatedGlobalUserSettings({
    isAuthenticated: true,
    persistSettingsAction: async (settings: GlobalUserSettings) => {
      persistedSettings.push(settings);

      return {
        ok: true,
        updatedAt: "2026-03-14T01:00:00.000Z",
      };
    },
    queue,
    getCurrentSaveState: saveStateStore.getCurrentSaveState,
    setSaveState: saveStateStore.setSaveState,
  });

  assert.deepEqual(persistedSettings, [queuedSettings]);
  assert.deepEqual(
    saveStateStore.history.map((state) => state.status),
    ["idle", "saving", "saved"],
  );
  assert.deepEqual(saveStateStore.getCurrentSaveState(), {
    status: "saved",
    updatedAt: "2026-03-14T01:00:00.000Z",
    message: "クラウドに保存しました。",
  });
});

test("rapid authenticated changes collapse to the latest pending snapshot", async () => {
  const queue = createGlobalUserSettingsSyncQueue();
  const saveStateStore = createSaveStateStore("2026-03-14T00:00:00.000Z");
  const firstSaveDeferred = createDeferred();
  const persistedSettings: GlobalUserSettings[] = [];
  const firstSettings: GlobalUserSettings = {
    ...createDefaultGlobalUserSettings(),
    masterVolume: 60,
  };
  const secondSettings: GlobalUserSettings = {
    ...createDefaultGlobalUserSettings(),
    masterVolume: 44,
  };
  const latestSettings: GlobalUserSettings = {
    ...createDefaultGlobalUserSettings(),
    masterVolume: 28,
  };

  saveStateStore.setSaveState(
    queueAuthenticatedGlobalUserSettingsSave({
      queue,
      settings: firstSettings,
      currentSaveState: saveStateStore.getCurrentSaveState(),
    }),
  );

  const syncPromise = syncPendingAuthenticatedGlobalUserSettings({
    isAuthenticated: true,
    persistSettingsAction: async (settings: GlobalUserSettings) => {
      persistedSettings.push(settings);

      if (persistedSettings.length === 1) {
        return firstSaveDeferred.promise;
      }

      return {
        ok: true,
        updatedAt: "2026-03-14T02:00:00.000Z",
      };
    },
    queue,
    getCurrentSaveState: saveStateStore.getCurrentSaveState,
    setSaveState: saveStateStore.setSaveState,
  });

  saveStateStore.setSaveState(
    queueAuthenticatedGlobalUserSettingsSave({
      queue,
      settings: secondSettings,
      currentSaveState: saveStateStore.getCurrentSaveState(),
    }),
  );
  saveStateStore.setSaveState(
    queueAuthenticatedGlobalUserSettingsSave({
      queue,
      settings: latestSettings,
      currentSaveState: saveStateStore.getCurrentSaveState(),
    }),
  );

  firstSaveDeferred.resolve({
    ok: true,
    updatedAt: "2026-03-14T01:00:00.000Z",
  });

  await syncPromise;

  assert.deepEqual(persistedSettings, [firstSettings, latestSettings]);
  assert.equal(queue.retrySettings, null);
  assert.deepEqual(saveStateStore.getCurrentSaveState(), {
    status: "saved",
    updatedAt: "2026-03-14T02:00:00.000Z",
    message: "クラウドに保存しました。",
  });
});

test("late authenticated changes queued during unlock are drained by a follow-up sync", async () => {
  const saveStateStore = createSaveStateStore("2026-03-14T00:00:00.000Z");
  const initialSettings: GlobalUserSettings = {
    ...createDefaultGlobalUserSettings(),
    masterVolume: 52,
  };
  const lateSettings: GlobalUserSettings = {
    ...createDefaultGlobalUserSettings(),
    masterVolume: 31,
  };
  const persistedSettings: GlobalUserSettings[] = [];
  const queue = createLateEnqueueOnUnlockQueue(lateSettings);

  saveStateStore.setSaveState(
    queueAuthenticatedGlobalUserSettingsSave({
      queue,
      settings: initialSettings,
      currentSaveState: saveStateStore.getCurrentSaveState(),
    }),
  );

  await syncPendingAuthenticatedGlobalUserSettings({
    isAuthenticated: true,
    persistSettingsAction: async (settings: GlobalUserSettings) => {
      persistedSettings.push(settings);

      return {
        ok: true,
        updatedAt:
          persistedSettings.length === 1
            ? "2026-03-14T01:00:00.000Z"
            : "2026-03-14T02:00:00.000Z",
      };
    },
    queue,
    getCurrentSaveState: saveStateStore.getCurrentSaveState,
    setSaveState: saveStateStore.setSaveState,
  });

  assert.deepEqual(persistedSettings, [initialSettings, lateSettings]);
  assert.equal(queue.pendingSettings, null);
  assert.equal(queue.retrySettings, null);
  assert.deepEqual(saveStateStore.getCurrentSaveState(), {
    status: "saved",
    updatedAt: "2026-03-14T02:00:00.000Z",
    message: "クラウドに保存しました。",
  });
});

test("failed save keeps retry state and retrying reuses the queued snapshot", async () => {
  const queue = createGlobalUserSettingsSyncQueue();
  const saveStateStore = createSaveStateStore("2026-03-14T00:00:00.000Z");
  const persistedSettings: GlobalUserSettings[] = [];
  const queuedSettings: GlobalUserSettings = {
    ...createDefaultGlobalUserSettings(),
    keyboardNoteLabelsVisible: false,
  };
  let attempt = 0;

  saveStateStore.setSaveState(
    queueAuthenticatedGlobalUserSettingsSave({
      queue,
      settings: queuedSettings,
      currentSaveState: saveStateStore.getCurrentSaveState(),
    }),
  );

  const persistSettingsAction = async (settings: GlobalUserSettings) => {
    persistedSettings.push(settings);
    attempt += 1;

    if (attempt === 1) {
      return {
        ok: false,
        code: "SAVE_FAILED",
        message: "failed",
      } as const;
    }

    return {
      ok: true,
      updatedAt: "2026-03-14T03:00:00.000Z",
    } as const;
  };

  await syncPendingAuthenticatedGlobalUserSettings({
    isAuthenticated: true,
    persistSettingsAction,
    queue,
    getCurrentSaveState: saveStateStore.getCurrentSaveState,
    setSaveState: saveStateStore.setSaveState,
  });

  assert.deepEqual(saveStateStore.getCurrentSaveState(), {
    status: "error",
    updatedAt: "2026-03-14T00:00:00.000Z",
    message: "設定を保存できませんでした。もう一度お試しください。",
  });
  assert.deepEqual(queue.retrySettings, queuedSettings);
  assert.equal(
    queueAuthenticatedGlobalUserSettingsRetry({
      queue,
      fallbackSettings: createDefaultGlobalUserSettings(),
    }),
    true,
  );

  await syncPendingAuthenticatedGlobalUserSettings({
    isAuthenticated: true,
    persistSettingsAction,
    queue,
    getCurrentSaveState: saveStateStore.getCurrentSaveState,
    setSaveState: saveStateStore.setSaveState,
  });

  assert.deepEqual(persistedSettings, [queuedSettings, queuedSettings]);
  assert.equal(queue.retrySettings, null);
  assert.deepEqual(saveStateStore.getCurrentSaveState(), {
    status: "saved",
    updatedAt: "2026-03-14T03:00:00.000Z",
    message: "クラウドに保存しました。",
  });
});

test("guest persistence writes local storage without entering the auth sync queue", () => {
  const storedValues = new Map<string, string>();
  const storage = {
    setItem(key: string, value: string) {
      storedValues.set(key, value);
    },
  };
  const guestSettings: GlobalUserSettings = {
    ...createDefaultGlobalUserSettings(),
    soundEffectsEnabled: false,
  };

  const saveState = persistGuestGlobalUserSettings({
    storage,
    settings: guestSettings,
  });

  assert.equal(storedValues.size, 1);
  assert.equal(
    storedValues.get(GLOBAL_USER_SETTINGS_STORAGE_KEY),
    serializeGlobalUserSettings(guestSettings),
  );
  assert.deepEqual(saveState, createBrowserSavedGlobalUserSettingsSaveState());
});

function createSaveStateStore(initialUpdatedAt: string | null) {
  let currentSaveState =
    createInitialGlobalUserSettingsSaveState(initialUpdatedAt);
  const history: GlobalUserSettingsSaveState[] = [];

  return {
    history,
    getCurrentSaveState() {
      return currentSaveState;
    },
    setSaveState(nextState: GlobalUserSettingsSaveState) {
      currentSaveState = nextState;
      history.push(nextState);
    },
  };
}

function createDeferred() {
  let resolve: (value: { ok: true; updatedAt: string }) => void = () => {
    throw new Error("Deferred promise was not initialized.");
  };

  const promise = new Promise<{
    ok: true;
    updatedAt: string;
  }>((nextResolve) => {
    resolve = nextResolve;
  });

  return {
    promise,
    resolve,
  };
}

function createLateEnqueueOnUnlockQueue(
  lateSettings: GlobalUserSettings,
): GlobalUserSettingsSyncQueue {
  let isSyncing = false;
  let queuedLateSettings: GlobalUserSettings | null = lateSettings;

  const queue: GlobalUserSettingsSyncQueue = {
    pendingSettings: null,
    retrySettings: null,
    get isSyncing() {
      return isSyncing;
    },
    set isSyncing(nextValue: boolean) {
      isSyncing = nextValue;

      if (!nextValue && queue.pendingSettings === null && queuedLateSettings) {
        queue.pendingSettings = queuedLateSettings;
        queue.retrySettings = queuedLateSettings;
        queuedLateSettings = null;
      }
    },
  };

  return queue;
}
