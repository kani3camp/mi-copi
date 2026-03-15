import assert from "node:assert/strict";
import test from "node:test";

const {
  buildNavigationCompletionToken,
  PENDING_LINK_TIMEOUT_MS,
  shouldResetPendingLink,
} = await import(new URL("./navigation-link-state.ts", import.meta.url).href);

test("buildNavigationCompletionToken includes search params in the reset key", () => {
  assert.equal(
    buildNavigationCompletionToken({
      pathname: "/settings",
      searchParams: new URLSearchParams("reset=distance"),
    }),
    "/settings?reset=distance",
  );
});

test("buildNavigationCompletionToken falls back to pathname when no query is present", () => {
  assert.equal(
    buildNavigationCompletionToken({
      pathname: "/train/distance",
      searchParams: new URLSearchParams(),
    }),
    "/train/distance",
  );
});

test("shouldResetPendingLink clears pending when the navigation token changes", () => {
  assert.equal(
    shouldResetPendingLink({
      isPending: true,
      previousToken: "/settings",
      nextToken: "/settings?reset=distance",
    }),
    true,
  );
});

test("shouldResetPendingLink keeps pending when navigation has not advanced", () => {
  assert.equal(
    shouldResetPendingLink({
      isPending: true,
      previousToken: "/train/keyboard",
      nextToken: "/train/keyboard",
    }),
    false,
  );
});

test("pending link timeout stays finite and positive", () => {
  assert.equal(PENDING_LINK_TIMEOUT_MS > 0, true);
  assert.equal(PENDING_LINK_TIMEOUT_MS, 4000);
});
