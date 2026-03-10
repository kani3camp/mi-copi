"use server";

import type { SaveTrainingSessionInput } from "../model/types";
import {
  getCurrentUserOrNull as resolveCurrentUserOrNull,
  type CurrentUser,
} from "../../../lib/auth/server";
import { getDb } from "../../../lib/db/client";
import {
  createSaveTrainingSessionDb,
  type SaveTrainingSessionDrizzleDb,
} from "./saveTrainingSession.drizzle";
import {
  saveTrainingSession,
  type SaveTrainingSessionResult,
} from "./saveTrainingSession";

export interface SaveTrainingSessionEntryDependencies {
  db?: SaveTrainingSessionDrizzleDb | null;
  getCurrentUser?: () => Promise<CurrentUser | null>;
}

export async function saveTrainingSessionForCurrentUser(
  input: SaveTrainingSessionInput,
  deps: SaveTrainingSessionEntryDependencies = {},
): Promise<SaveTrainingSessionResult> {
  let currentUser: CurrentUser | null;

  try {
    currentUser = await (deps.getCurrentUser ?? resolveCurrentUserOrNull)();
  } catch {
    return {
      ok: false,
      code: "SAVE_FAILED",
      message: "Current user resolver is not configured yet.",
    };
  }

  if (!currentUser) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "Authenticated user is required to save a training session.",
    };
  }

  let db: SaveTrainingSessionDrizzleDb;

  try {
    db = deps.db ?? getDb();
  } catch {
    return {
      ok: false,
      code: "SAVE_FAILED",
      message: "Drizzle DB is not configured yet.",
    };
  }

  return saveTrainingSession(currentUser.id, input, {
    db: createSaveTrainingSessionDb(db),
  });
}
