import assert from "node:assert/strict";
import test from "node:test";

const { startGoogleLogin } = await import(
  new URL("./login-auth-action.ts", import.meta.url).href
);

test("startGoogleLogin forwards the Google provider and home callback", async () => {
  const requests: unknown[] = [];

  await startGoogleLogin(async (request: unknown) => {
    requests.push(request);
  });

  assert.deepEqual(requests, [
    {
      provider: "google",
      callbackURL: "/",
    },
  ]);
});
