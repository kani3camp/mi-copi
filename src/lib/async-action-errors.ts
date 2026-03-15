import type { GlobalUserSettingsSaveResult } from "../features/settings/server/global-user-settings";
import type {
  SaveTrainingSessionErrorCode,
  SaveTrainingSessionResult,
} from "../features/training/server/saveTrainingSession";

export function getStoredSettingsReadErrorMessage(): string {
  return "保存済み設定の読み込みに失敗しました。初期値のまま続行できます。";
}

export function getTrainingConfigPersistErrorMessage(): string {
  return "今回の設定を保存できませんでした。練習はそのまま続けられます。";
}

export function getLoginStartErrorMessage(): string {
  return "Google ログインを開始できませんでした。もう一度お試しください。";
}

export function getGlobalUserSettingsSaveErrorMessage(
  result?: Extract<GlobalUserSettingsSaveResult, { ok: false }> | null,
): string {
  if (result?.code === "UNAUTHORIZED") {
    return "ログイン状態を確認できなかったため、設定を保存できませんでした。";
  }

  return "設定を保存できませんでした。もう一度お試しください。";
}

export function getTrainingResultSaveErrorMessage(
  result?: Extract<SaveTrainingSessionResult, { ok: false }> | null,
): string {
  if (result?.code === "UNAUTHORIZED") {
    return "ログイン状態を確認できませんでした。再度ログインしてからお試しください。";
  }

  if (result?.code === "INVALID_INPUT") {
    return "セッション情報が不足しているため、この結果は保存できませんでした。";
  }

  return "結果を保存できませんでした。結果画面のまま再試行できます。";
}

export function createTrainingResultSaveFailureResult(
  code: SaveTrainingSessionErrorCode = "SAVE_FAILED",
): Extract<SaveTrainingSessionResult, { ok: false }> {
  return {
    ok: false,
    code,
    message: getTrainingResultSaveErrorMessage(
      code === "SAVE_FAILED"
        ? null
        : ({
            ok: false,
            code,
            message: "",
          } as Extract<SaveTrainingSessionResult, { ok: false }>),
    ),
  };
}
