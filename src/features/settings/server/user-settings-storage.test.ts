import assert from "node:assert/strict";
import test from "node:test";

const { isRecoverableUserSettingsStorageError } = await import(
  new URL("./user-settings-storage.ts", import.meta.url).href
);

test("treats failed user_settings select queries as recoverable", () => {
  const error = new Error(
    'Failed query: select "master_volume" from "user_settings" where "user_settings"."user_id" = $1',
  );

  assert.equal(isRecoverableUserSettingsStorageError(error), true);
});

test("treats missing user_settings relation errors as recoverable", () => {
  const error = new Error('relation "user_settings" does not exist');

  assert.equal(isRecoverableUserSettingsStorageError(error), true);
});

test("ignores unrelated errors", () => {
  const error = new Error("DATABASE_URL is not set.");

  assert.equal(isRecoverableUserSettingsStorageError(error), false);
});
