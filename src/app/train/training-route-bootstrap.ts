"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import type { GlobalUserSettings } from "../../features/settings/model/global-user-settings.ts";
import {
  getResolvedTrainingBootstrapConfigDecision,
  isTrainingBootstrapReady,
  shouldHydrateResolvedTrainingBootstrap,
} from "../../features/training/model/bootstrap.ts";
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
  const [resolvedBootstrap, setResolvedBootstrap] = useState<TBootstrap | null>(
    null,
  );
  const [isBootstrapPending, startBootstrapTransition] = useTransition();
  const bootstrapPromiseRef = useRef<Promise<TBootstrap> | null>(null);
  const hasEditedConfigRef = useRef(false);
  const hasResolvedBootstrapMetaRef = useRef(false);
  const hasHydratedSettingsRef = useRef(false);
  const hasHandledStoredConfigRef = useRef(false);

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
        setBootstrapErrorMessage(null);
        const nextBootstrap = await bootstrapPromise;

        if (cancelled) {
          return;
        }
        setResolvedBootstrap(nextBootstrap);
      } catch {
        if (!cancelled) {
          setResolvedBootstrap(null);
          setBootstrapNotice(null);
          setBootstrapErrorMessage(readErrorMessage);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadBootstrapAction, readErrorMessage]);

  useEffect(() => {
    if (!resolvedBootstrap) {
      return;
    }

    if (!hasResolvedBootstrapMetaRef.current) {
      hasResolvedBootstrapMetaRef.current = true;
      onBootstrapResolved({
        hasStoredConfig: resolvedBootstrap.hasStoredConfig,
        isAuthenticated: resolvedBootstrap.isAuthenticated,
      });
      setBootstrapErrorMessage(resolvedBootstrap.readWarningMessage);
    }

    if (
      shouldHydrateResolvedTrainingBootstrap({
        hasResolvedBootstrap: true,
        hasHydratedSettings: hasHydratedSettingsRef.current,
      })
    ) {
      hasHydratedSettingsRef.current = true;
      onHydrateSettings({
        isAuthenticated: resolvedBootstrap.isAuthenticated,
        settings: resolvedBootstrap.settings,
        updatedAt: resolvedBootstrap.settingsUpdatedAt,
      });
    }

    const configDecision = getResolvedTrainingBootstrapConfigDecision({
      hasResolvedBootstrap: true,
      hasStoredConfig: resolvedBootstrap.config !== null,
      hasHandledStoredConfig: hasHandledStoredConfigRef.current,
      hasEditedConfig: hasEditedConfigRef.current,
      phase,
      startedAt,
    });

    if (configDecision === "apply" && resolvedBootstrap.config) {
      hasHandledStoredConfigRef.current = true;
      onApplyConfig(resolvedBootstrap.config);
      setBootstrapNotice("前回設定を読み込み済みです。");
      return;
    }

    if (configDecision === "skip") {
      hasHandledStoredConfigRef.current = true;
      setBootstrapNotice(null);
    }
  }, [
    onApplyConfig,
    onBootstrapResolved,
    onHydrateSettings,
    phase,
    resolvedBootstrap,
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
    isBootstrapReady: isTrainingBootstrapReady({
      bootstrapErrorMessage,
      hasResolvedBootstrap: resolvedBootstrap !== null,
      loadBootstrapAction: Boolean(loadBootstrapAction),
    }),
    isBootstrapPending,
  };
}
