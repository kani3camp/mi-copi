import assert from "node:assert/strict";
import test from "node:test";

const { hasSessionTokenCookie } = await import(
  new URL("./server.ts", import.meta.url).href
);

test("hasSessionTokenCookie returns true when a Better Auth session cookie exists", () => {
  const requestHeaders = new Headers({
    cookie: "better-auth.session_token=test-token; theme=light",
  });

  assert.equal(hasSessionTokenCookie(requestHeaders), true);
});

test("hasSessionTokenCookie returns false when no Better Auth session cookie exists", () => {
  const requestHeaders = new Headers({
    cookie: "theme=light; locale=ja",
  });

  assert.equal(hasSessionTokenCookie(requestHeaders), false);
});
