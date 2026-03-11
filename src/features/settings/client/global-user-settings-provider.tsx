"use client";

import {
  createContext,
  type ReactNode,
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
    if (isAuthenticated || typeof window === "undefined") {
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
      message: "Saved locally in this browser.",
    });
  }, [isAuthenticated]);

  function updateSettings(patch: Partial<GlobalUserSettings>) {
    setSettings((current) => {
      const nextSettings = normalizeGlobalUserSettings({
        ...current,
        ...patch,
      });

      settingsRef.current = nextSettings;

      if (!isAuthenticated) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            GLOBAL_USER_SETTINGS_STORAGE_KEY,
            serializeGlobalUserSettings(nextSettings),
          );
        }

        setSaveState({
          status: "saved",
          updatedAt: null,
          message: "Saved locally in this browser.",
        });
        return nextSettings;
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

      return nextSettings;
    });
  }

  function retrySave() {
    if (!isAuthenticated) {
      return;
    }

    pendingSettingsRef.current =
      retrySettingsRef.current ?? settingsRef.current ?? null;
    void syncPendingSettings();
  }

  async function syncPendingSettings(): Promise<void> {
    if (
      !isAuthenticated ||
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

      const result = await persistSettingsAction(snapshot);

      if (!result.ok) {
        retrySettingsRef.current = snapshot;
        setSaveState((current) => ({
          status: "error",
          updatedAt: current.updatedAt,
          message: result.message,
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
        message: "Cloud settings saved.",
      });
    }

    isSyncingRef.current = false;

    if (pendingSettingsRef.current) {
      void syncPendingSettings();
    }
  }

  return (
    <GlobalUserSettingsContext.Provider
      value={{
        isAuthenticated,
        settings,
        saveState,
        updateSettings,
        retrySave,
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
