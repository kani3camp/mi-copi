import assert from "node:assert/strict";
import test from "node:test";

const { shouldApplyDeferredTrainingBootstrap } = await import(
  new URL("./bootstrap.ts", import.meta.url).href
);

test("shouldApplyDeferredTrainingBootstrap allows applying before the session starts", () => {
  assert.equal(
    shouldApplyDeferredTrainingBootstrap({
      phase: "config",
      startedAt: null,
      hasEditedConfig: false,
    }),
    true,
  );
});

test("shouldApplyDeferredTrainingBootstrap blocks applying after manual edits", () => {
  assert.equal(
    shouldApplyDeferredTrainingBootstrap({
      phase: "config",
      startedAt: null,
      hasEditedConfig: true,
    }),
    false,
  );
});

test("shouldApplyDeferredTrainingBootstrap blocks applying after the session starts", () => {
  assert.equal(
    shouldApplyDeferredTrainingBootstrap({
      phase: "playing",
      startedAt: "2026-03-13T00:00:00.000Z",
      hasEditedConfig: false,
    }),
    false,
  );
});
