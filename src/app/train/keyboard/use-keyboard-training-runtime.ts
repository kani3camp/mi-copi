"use client";

import { useCallback, useEffect, useRef } from "react";

import { createKeyboardTrainingSessionAdapter } from "../../../features/training/model/modes/keyboard-session-adapter.ts";

type KeyboardTrainRuntimeModule = typeof import("./keyboard-train-runtime");

export function useKeyboardTrainingRuntime() {
  const runtimePromiseRef = useRef<Promise<KeyboardTrainRuntimeModule> | null>(
    null,
  );
  const adapterRef = useRef<ReturnType<
    typeof createKeyboardTrainingSessionAdapter
  > | null>(null);

  const ensureReadyForStart = useCallback(() => {
    if (!runtimePromiseRef.current) {
      runtimePromiseRef.current = import("./keyboard-train-runtime").then(
        (runtime) => {
          adapterRef.current = createKeyboardTrainingSessionAdapter(runtime);
          return runtime;
        },
      );
    }

    return runtimePromiseRef.current;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const warmUp = () => {
      void ensureReadyForStart();
      void import("./keyboard-train-panels");
    };

    if ("requestIdleCallback" in window) {
      const idleCallbackId = window.requestIdleCallback(warmUp, {
        timeout: 1500,
      });

      return () => {
        window.cancelIdleCallback(idleCallbackId);
      };
    }

    const timeoutId = globalThis.setTimeout(warmUp, 0);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [ensureReadyForStart]);

  return {
    adapterRef,
    ensureReadyForStart,
  };
}
