"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import type { GlobalUserSettings } from "../../features/settings/model/global-user-settings.ts";
import { shouldApplyDeferredTrainingBootstrap } from "../../features/training/model/bootstrap.ts";
import type { SessionPhase } from "../../features/training/model/types.ts";

interface TrainingRouteBootstrapPayload<TConfig> {
  config: TConfig | null;
  hasStoredConfig: boolean;
  isAuthenticated: boolean;
  readWarningMessage: string | null;
  settings: GlobalUserSettings;
  settingsUpdatedAt: string | null;
}

interface UseTrainingRouteBootstrapOptions<
  TConfig,
  TBootstrap extends TrainingRouteBootstrapPayload<TConfig>,
> {
  loadBootstrapAction?: () => Promise<TBootstrap>;
  onApplyConfig: (config: TConfig) => void;
  onBootstrapResolved: (payload: {
    hasStoredConfig: boolean;
    isAuthenticated: boolean;
  }) => void;
  onHydrateSettings: (payload: {
    isAuthenticated: boolean;
    settings: GlobalUserSettings;
    updatedAt: string | null;
  }) => void;
  phase: SessionPhase;
  readErrorMessage: string;
  startedAt: string | null;
}

export function useTrainingRouteBootstrap<
  TConfig,
  TBootstrap extends TrainingRouteBootstrapPayload<TConfig>,
>({
  loadBootstrapAction,
  onApplyConfig,
  onBootstrapResolved,
  onHydrateSettings,
  phase,
  readErrorMessage,
  startedAt,
}: UseTrainingRouteBootstrapOptions<TConfig, TBootstrap>) {
  const [bootstrapNotice, setBootstrapNotice] = useState<string | null>(null);
  const [bootstrapErrorMessage, setBootstrapErrorMessage] = useState<
    string | null
  >(null);
  const [isBootstrapPending, startBootstrapTransition] = useTransition();
  const bootstrapPromiseRef = useRef<Promise<TBootstrap> | null>(null);
  const hasEditedConfigRef = useRef(false);

  useEffect(() => {
    if (!loadBootstrapAction) {
      return;
    }

    if (!bootstrapPromiseRef.current) {
      bootstrapPromiseRef.current = loadBootstrapAction();
    }

    const bootstrapPromise = bootstrapPromiseRef.current;

    if (!bootstrapPromise) {
      return;
    }

    let cancelled = false;

    startBootstrapTransition(async () => {
      try {
        const bootstrap = await bootstrapPromise;

        if (cancelled) {
          return;
        }

        onBootstrapResolved({
          hasStoredConfig: bootstrap.hasStoredConfig,
          isAuthenticated: bootstrap.isAuthenticated,
        });
        setBootstrapErrorMessage(bootstrap.readWarningMessage);
        onHydrateSettings({
          isAuthenticated: bootstrap.isAuthenticated,
          settings: bootstrap.settings,
          updatedAt: bootstrap.settingsUpdatedAt,
        });

        if (
          bootstrap.config &&
          shouldApplyDeferredTrainingBootstrap({
            hasEditedConfig: hasEditedConfigRef.current,
            phase,
            startedAt,
          })
        ) {
          onApplyConfig(bootstrap.config);
          setBootstrapNotice("前回設定を読み込み済みです。");
          return;
        }

        setBootstrapNotice(null);
      } catch {
        if (!cancelled) {
          setBootstrapNotice(null);
          setBootstrapErrorMessage(readErrorMessage);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    loadBootstrapAction,
    onApplyConfig,
    onBootstrapResolved,
    onHydrateSettings,
    phase,
    readErrorMessage,
    startedAt,
  ]);

  function handleConfigEdit() {
    hasEditedConfigRef.current = true;
    setBootstrapNotice(null);
  }

  return {
    bootstrapErrorMessage,
    bootstrapNotice,
    handleConfigEdit,
    isBootstrapPending,
  };
}
