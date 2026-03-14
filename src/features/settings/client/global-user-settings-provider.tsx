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
import { getGlobalUserSettingsSaveErrorMessage } from "../../../lib/async-action-errors";
import {
  GLOBAL_USER_SETTINGS_STORAGE_KEY,
  type GlobalUserSettings,
  normalizeGlobalUserSettings,
  parseGlobalUserSettings,
  serializeGlobalUserSettings,
} from "../model/global-user-settings";
import type { GlobalUserSettingsSaveResult } from "../server/global-user-settings";

interface GlobalUserSettingsSaveState {
  status: "idle" | "saving" | "saved" | "error";
  updatedAt: string | null;
  message: string | null;
}

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
  const pendingSettingsRef = useRef<GlobalUserSettings | null>(null);
  const retrySettingsRef = useRef<GlobalUserSettings | null>(null);
  const isSyncingRef = useRef(false);
  const [saveState, setSaveState] = useState<GlobalUserSettingsSaveState>({
    status: "idle",
    updatedAt: initialUpdatedAt,
    message: null,
  });

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
    setSaveState({
      status: "saved",
      updatedAt: null,
      message: "このブラウザに保存しました。",
    });
  }, [isAuthenticatedState]);

  useEffect(() => {
    setIsAuthenticatedState(isAuthenticated);
  }, [isAuthenticated]);

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
        window.localStorage.setItem(
          GLOBAL_USER_SETTINGS_STORAGE_KEY,
          serializeGlobalUserSettings(nextSettings),
        );
      }

      setSaveState({
        status: "saved",
        updatedAt: null,
        message: "このブラウザに保存しました。",
      });
      return;
    }

    pendingSettingsRef.current = nextSettings;
    retrySettingsRef.current = nextSettings;
    setSaveState((currentSaveState) => ({
      status:
        currentSaveState.status === "saving"
          ? "saving"
          : currentSaveState.status === "saved"
            ? "saved"
            : "idle",
      updatedAt: currentSaveState.updatedAt,
      message: null,
    }));
    void syncPendingSettings();
  }

  function retrySave() {
    if (!isAuthenticatedState) {
      return;
    }

    pendingSettingsRef.current =
      retrySettingsRef.current ?? settingsRef.current ?? null;
    void syncPendingSettings();
  }

  async function syncPendingSettings(): Promise<void> {
    if (
      !isAuthenticatedState ||
      !persistSettingsAction ||
      isSyncingRef.current ||
      !pendingSettingsRef.current
    ) {
      return;
    }

    isSyncingRef.current = true;

    while (pendingSettingsRef.current) {
      const snapshot = pendingSettingsRef.current;
      pendingSettingsRef.current = null;

      setSaveState((current) => ({
        status: "saving",
        updatedAt: current.updatedAt,
        message: null,
      }));

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
        retrySettingsRef.current = snapshot;
        setSaveState((current) => ({
          status: "error",
          updatedAt: current.updatedAt,
          message: getGlobalUserSettingsSaveErrorMessage(result),
        }));

        if (!pendingSettingsRef.current) {
          break;
        }

        continue;
      }

      retrySettingsRef.current = null;
      setSaveState({
        status: "saved",
        updatedAt: result.updatedAt,
        message: "クラウドに保存しました。",
      });
    }

    isSyncingRef.current = false;

    if (pendingSettingsRef.current) {
      void syncPendingSettings();
    }
  }

  const hydrateFromServer = useCallback(
    (payload: {
      isAuthenticated: boolean;
      settings: GlobalUserSettings;
      updatedAt: string | null;
    }) => {
      const normalizedSettings = normalizeGlobalUserSettings(payload.settings);

      pendingSettingsRef.current = null;
      retrySettingsRef.current = null;
      settingsRef.current = normalizedSettings;
      setIsAuthenticatedState(payload.isAuthenticated);
      setSettings(normalizedSettings);
      setSaveState({
        status: "idle",
        updatedAt: payload.updatedAt,
        message: null,
      });
    },
    [],
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
