import assert from "node:assert/strict";
import test from "node:test";

const {
  getDistanceTrainingPageBootstrapForCurrentUser,
  getKeyboardTrainingPageBootstrapForCurrentUser,
} = await import(
  new URL("./getTrainingPageBootstrap.ts", import.meta.url).href
);
const {
  createDefaultDistanceTrainingConfig,
  createDefaultKeyboardTrainingConfig,
} = await import(new URL("../model/config.ts", import.meta.url).href);

test("distance bootstrap forwards stored config state and warnings", async () => {
  const result = await getDistanceTrainingPageBootstrapForCurrentUser({
    getCurrentUserSettingsSnapshot: async () => ({
      isAuthenticated: true,
      settings: {
        masterVolume: 70,
        soundEffectsEnabled: false,
        intervalNotationStyle: "mixed",
        keyboardNoteLabelsVisible: false,
      },
      lastDistanceConfig: createDefaultDistanceTrainingConfig(),
      lastKeyboardConfig: null,
      updatedAt: "2026-03-14T08:00:00.000Z",
      readWarningMessage: "warn",
    }),
  });

  assert.deepEqual(result, {
    mode: "distance",
    isAuthenticated: true,
    settings: {
      masterVolume: 70,
      soundEffectsEnabled: false,
      intervalNotationStyle: "mixed",
      keyboardNoteLabelsVisible: false,
    },
    settingsUpdatedAt: "2026-03-14T08:00:00.000Z",
    config: createDefaultDistanceTrainingConfig(),
    hasStoredConfig: true,
    readWarningMessage: "warn",
  });
});

test("keyboard bootstrap forwards empty stored state without warnings", async () => {
  const result = await getKeyboardTrainingPageBootstrapForCurrentUser({
    getCurrentUserSettingsSnapshot: async () => ({
      isAuthenticated: true,
      settings: {
        masterVolume: 80,
        soundEffectsEnabled: true,
        intervalNotationStyle: "ja",
        keyboardNoteLabelsVisible: true,
      },
      lastDistanceConfig: null,
      lastKeyboardConfig: createDefaultKeyboardTrainingConfig(),
      updatedAt: null,
      readWarningMessage: null,
    }),
  });

  assert.deepEqual(result, {
    mode: "keyboard",
    isAuthenticated: true,
    settings: {
      masterVolume: 80,
      soundEffectsEnabled: true,
      intervalNotationStyle: "ja",
      keyboardNoteLabelsVisible: true,
    },
    settingsUpdatedAt: null,
    config: createDefaultKeyboardTrainingConfig(),
    hasStoredConfig: true,
    readWarningMessage: null,
  });
});
