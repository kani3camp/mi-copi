const USER_SETTINGS_IDENTIFIERS = [
  "user_settings",
  "master_volume",
  "sound_effects_enabled",
  "interval_notation_style",
  "keyboard_note_labels_visible",
  "last_distance_config",
  "last_keyboard_config",
] as const;

export function isRecoverableUserSettingsStorageError(error: unknown): boolean {
  const message = getErrorMessage(error)?.toLowerCase();

  if (!message) {
    return false;
  }

  if (message.includes('relation "user_settings" does not exist')) {
    return true;
  }

  if (message.includes("failed query:")) {
    return USER_SETTINGS_IDENTIFIERS.some((identifier) =>
      message.includes(identifier),
    );
  }

  return USER_SETTINGS_IDENTIFIERS.some((identifier) =>
    message.includes(`"${identifier}" does not exist`),
  );
}

function getErrorMessage(error: unknown): string | null {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return null;
}
