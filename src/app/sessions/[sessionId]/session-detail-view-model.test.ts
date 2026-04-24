import assert from "node:assert/strict";
import test from "node:test";

import type { TrainingSessionDetail } from "../../../features/training/server/getTrainingSessionDetail.ts";

const { createSessionDetailConfigGroups, getSessionDetailEvaluation } =
  await import(new URL("./session-detail-view-model.ts", import.meta.url).href);

type DetailFixture = TrainingSessionDetail;

test("session detail config groups distance snapshots into three stable sections", () => {
  const groups: Array<{
    title: string;
    rows: Array<{ label: string; value: string }>;
  }> = createSessionDetailConfigGroups(
    createDetail({
      mode: "distance",
      intervalGranularity: "detailed",
    }),
  );

  assert.deepEqual(
    groups.map((group: { title: string }) => group.title),
    ["終了条件", "出題範囲", "回答スタイル"],
  );
  assert.deepEqual(
    groups[2].rows.map((row: { label: string; value: string }) => row),
    [
      { label: "同音を含める", value: "はい" },
      { label: "オクターブを含める", value: "いいえ" },
      { label: "音程表記の粒度", value: "増減あり" },
    ],
  );
});

test("session detail config groups keyboard snapshots without distance-only labels", () => {
  const groups: Array<{
    title: string;
    rows: Array<{ label: string; value: string }>;
  }> = createSessionDetailConfigGroups(
    createDetail({
      mode: "keyboard",
    }),
  );

  assert.deepEqual(groups[2].rows.at(-1), {
    label: "鍵盤の回答形式",
    value: "音名",
  });
});

test("session detail evaluation matches training feedback vocabulary", () => {
  assert.deepEqual(
    getSessionDetailEvaluation({ isCorrect: true, errorSemitones: 0 }),
    { tone: "success", label: "正解" },
  );
  assert.deepEqual(
    getSessionDetailEvaluation({ isCorrect: false, errorSemitones: -1 }),
    { tone: "warning", label: "惜しい" },
  );
  assert.deepEqual(
    getSessionDetailEvaluation({ isCorrect: false, errorSemitones: 3 }),
    { tone: "error", label: "不正解" },
  );
});

function createDetail(configOverrides: Record<string, unknown>): DetailFixture {
  const configSnapshot = {
    mode: configOverrides.mode,
    intervalRange: {
      minSemitone: 0,
      maxSemitone: 12,
    },
    directionMode: "mixed",
    baseNoteMode: "fixed",
    fixedBaseNote: "C",
    includeUnison: true,
    includeOctave: false,
    endCondition: {
      type: "question_count",
      questionCount: 10,
    },
    ...configOverrides,
  } as DetailFixture["configSnapshot"];

  return {
    id: "session-1",
    mode: configSnapshot.mode,
    configSnapshot,
    createdAt: "2026-04-24T00:00:00.000Z",
    endedAt: "2026-04-24T00:10:00.000Z",
    answeredQuestionCount: 10,
    correctQuestionCount: 7,
    accuracyRate: 0.7,
    avgErrorAbs: 0.5,
    avgResponseTimeMs: 1200,
    sessionScore: 82,
    results: [],
  };
}
