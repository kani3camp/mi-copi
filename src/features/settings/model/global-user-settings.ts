export type IntervalNotationStyle = "ja" | "abbr" | "mixed";

export interface GlobalUserSettings {
  masterVolume: number;
  soundEffectsEnabled: boolean;
  intervalNotationStyle: IntervalNotationStyle;
  keyboardNoteLabelsVisible: boolean;
}

export const GLOBAL_USER_SETTINGS_STORAGE_KEY = "mi-copi.global-user-settings";

export function createDefaultGlobalUserSettings(): GlobalUserSettings {
  return {
    masterVolume: 80,
    soundEffectsEnabled: true,
    intervalNotationStyle: "ja",
    keyboardNoteLabelsVisible: true,
  };
}

export function normalizeGlobalUserSettings(
  input: Partial<GlobalUserSettings> | null | undefined,
): GlobalUserSettings {
  const defaults = createDefaultGlobalUserSettings();

  return {
    masterVolume: clampMasterVolume(
      input?.masterVolume ?? defaults.masterVolume,
    ),
    soundEffectsEnabled:
      typeof input?.soundEffectsEnabled === "boolean"
        ? input.soundEffectsEnabled
        : defaults.soundEffectsEnabled,
    intervalNotationStyle: isIntervalNotationStyle(input?.intervalNotationStyle)
      ? input.intervalNotationStyle
      : defaults.intervalNotationStyle,
    keyboardNoteLabelsVisible:
      typeof input?.keyboardNoteLabelsVisible === "boolean"
        ? input.keyboardNoteLabelsVisible
        : defaults.keyboardNoteLabelsVisible,
  };
}

export function parseGlobalUserSettings(
  rawValue: string | null | undefined,
): GlobalUserSettings | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<GlobalUserSettings>;
    return normalizeGlobalUserSettings(parsed);
  } catch {
    return null;
  }
}

export function serializeGlobalUserSettings(
  settings: GlobalUserSettings,
): string {
  return JSON.stringify(normalizeGlobalUserSettings(settings));
}

export function clampMasterVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return createDefaultGlobalUserSettings().masterVolume;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function isIntervalNotationStyle(
  value: unknown,
): value is IntervalNotationStyle {
  return value === "ja" || value === "abbr" || value === "mixed";
}
