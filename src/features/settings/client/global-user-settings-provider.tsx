"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  GLOBAL_USER_SETTINGS_STORAGE_KEY,
  type GlobalUserSettings,
  normalizeGlobalUserSettings,
  parseGlobalUserSettings,
} from "../model/global-user-settings";
import {
  clearQueuedAuthenticatedGlobalUserSettings,
  createBrowserSavedGlobalUserSettingsSaveState,
  createGlobalUserSettingsSyncQueue,
  createInitialGlobalUserSettingsSaveState,
  type GlobalUserSettingsSaveState,
  persistGuestGlobalUserSettings,
  queueAuthenticatedGlobalUserSettingsRetry,
  queueAuthenticatedGlobalUserSettingsSave,
  syncPendingAuthenticatedGlobalUserSettings,
} from "../model/global-user-settings-sync";
import type { GlobalUserSettingsSaveResult } from "../server/global-user-settings";

interface GlobalUserSettingsContextValue {
  isAuthenticated: boolean;
  settings: GlobalUserSettings;
  saveState: GlobalUserSettingsSaveState;
  updateSettings: (patch: Partial<GlobalUserSettings>) => void;
  retrySave: () => void;
  hydrateFromServer: (payload: {
    isAuthenticated: boolean;
    settings: GlobalUserSettings;
    updatedAt: string | null;
  }) => void;
}

const GlobalUserSettingsContext =
  createContext<GlobalUserSettingsContextValue | null>(null);

interface GlobalUserSettingsProviderProps {
  children: ReactNode;
  isAuthenticated: boolean;
  initialSettings: GlobalUserSettings;
  initialUpdatedAt: string | null;
  persistSettingsAction?: (
    settings: GlobalUserSettings,
  ) => Promise<GlobalUserSettingsSaveResult>;
}

export function GlobalUserSettingsProvider({
  children,
  isAuthenticated,
  initialSettings,
  initialUpdatedAt,
  persistSettingsAction,
}: GlobalUserSettingsProviderProps) {
  const [isAuthenticatedState, setIsAuthenticatedState] =
    useState(isAuthenticated);
  const [settings, setSettings] = useState<GlobalUserSettings>(
    normalizeGlobalUserSettings(initialSettings),
  );
  const settingsRef = useRef(settings);
  const syncQueueRef = useRef(createGlobalUserSettingsSyncQueue());
  const [syncRequestVersion, setSyncRequestVersion] = useState(0);
  const [saveState, setSaveState] = useState<GlobalUserSettingsSaveState>(
    createInitialGlobalUserSettingsSaveState(initialUpdatedAt),
  );
  const saveStateRef = useRef(saveState);

  const applySaveState = useCallback(
    (nextState: GlobalUserSettingsSaveState) => {
      saveStateRef.current = nextState;
      setSaveState(nextState);
    },
    [],
  );

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (isAuthenticatedState || typeof window === "undefined") {
      return;
    }

    const storedSettings = parseGlobalUserSettings(
      window.localStorage.getItem(GLOBAL_USER_SETTINGS_STORAGE_KEY),
    );

    if (!storedSettings) {
      return;
    }

    settingsRef.current = storedSettings;
    setSettings(storedSettings);
    applySaveState(createBrowserSavedGlobalUserSettingsSaveState());
  }, [applySaveState, isAuthenticatedState]);

  useEffect(() => {
    setIsAuthenticatedState(isAuthenticated);
  }, [isAuthenticated]);

  const syncPendingSettings = useCallback(async (): Promise<void> => {
    await syncPendingAuthenticatedGlobalUserSettings({
      isAuthenticated: isAuthenticatedState,
      persistSettingsAction,
      queue: syncQueueRef.current,
      getCurrentSaveState: () => saveStateRef.current,
      setSaveState: applySaveState,
    });
  }, [applySaveState, isAuthenticatedState, persistSettingsAction]);

  useEffect(() => {
    if (syncRequestVersion === 0) {
      return;
    }

    void syncPendingSettings();
  }, [syncPendingSettings, syncRequestVersion]);

  function updateSettings(patch: Partial<GlobalUserSettings>) {
    const nextSettings = normalizeGlobalUserSettings({
      ...settingsRef.current,
      ...patch,
    });

    settingsRef.current = nextSettings;
    setSettings(nextSettings);

    if (!isAuthenticatedState) {
      setIsAuthenticatedState(false);

      if (typeof window !== "undefined") {
        applySaveState(
          persistGuestGlobalUserSettings({
            storage: window.localStorage,
            settings: nextSettings,
          }),
        );

        return;
      }

      applySaveState(createBrowserSavedGlobalUserSettingsSaveState());
      return;
    }

    applySaveState(
      queueAuthenticatedGlobalUserSettingsSave({
        queue: syncQueueRef.current,
        settings: nextSettings,
        currentSaveState: saveStateRef.current,
      }),
    );
    setSyncRequestVersion((current) => current + 1);
  }

  function retrySave() {
    if (!isAuthenticatedState) {
      return;
    }

    if (
      !queueAuthenticatedGlobalUserSettingsRetry({
        queue: syncQueueRef.current,
        fallbackSettings: settingsRef.current,
      })
    ) {
      return;
    }

    setSyncRequestVersion((current) => current + 1);
  }

  const hydrateFromServer = useCallback(
    (payload: {
      isAuthenticated: boolean;
      settings: GlobalUserSettings;
      updatedAt: string | null;
    }) => {
      const normalizedSettings = normalizeGlobalUserSettings(payload.settings);

      clearQueuedAuthenticatedGlobalUserSettings(syncQueueRef.current);
      settingsRef.current = normalizedSettings;
      setIsAuthenticatedState(payload.isAuthenticated);
      setSettings(normalizedSettings);
      applySaveState(
        createInitialGlobalUserSettingsSaveState(payload.updatedAt),
      );
    },
    [applySaveState],
  );

  return (
    <GlobalUserSettingsContext.Provider
      value={{
        isAuthenticated: isAuthenticatedState,
        settings,
        saveState,
        updateSettings,
        retrySave,
        hydrateFromServer,
      }}
    >
      {children}
    </GlobalUserSettingsContext.Provider>
  );
}

export function useGlobalUserSettings(): GlobalUserSettingsContextValue {
  const context = useContext(GlobalUserSettingsContext);

  if (!context) {
    throw new Error(
      "useGlobalUserSettings must be used within GlobalUserSettingsProvider.",
    );
  }

  return context;
}
