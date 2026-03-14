import assert from "node:assert/strict";
import test from "node:test";

const {
  createTrainingResultSaveFailureResult,
  getGlobalUserSettingsSaveErrorMessage,
  getStoredSettingsReadErrorMessage,
  getTrainingConfigPersistErrorMessage,
  getTrainingResultSaveErrorMessage,
} = await import(new URL("./async-action-errors.ts", import.meta.url).href);

test("shared async action errors expose the expected user-facing copy", () => {
  assert.equal(
    getStoredSettingsReadErrorMessage(),
    "保存済み設定の読み込みに失敗しました。初期値のまま続行できます。",
  );
  assert.equal(
    getTrainingConfigPersistErrorMessage(),
    "今回の設定を保存できませんでした。練習はそのまま続けられます。",
  );
  assert.equal(
    getGlobalUserSettingsSaveErrorMessage({
      ok: false,
      code: "UNAUTHORIZED",
      message: "ignored",
    }),
    "ログイン状態を確認できなかったため、設定を保存できませんでした。",
  );
  assert.equal(
    getTrainingResultSaveErrorMessage({
      ok: false,
      code: "INVALID_INPUT",
      message: "ignored",
    }),
    "セッション情報が不足しているため、この結果は保存できませんでした。",
  );
});

test("createTrainingResultSaveFailureResult normalizes throw paths into retryable save failures", () => {
  assert.deepEqual(createTrainingResultSaveFailureResult(), {
    ok: false,
    code: "SAVE_FAILED",
    message: "結果を保存できませんでした。結果画面のまま再試行できます。",
  });
});
