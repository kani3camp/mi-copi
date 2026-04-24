import assert from "node:assert/strict";
import test from "node:test";

const {
  createScoreTrendOptions,
  formatCompactDateLabel,
  getCompactIntervalChartLabel,
} = await import(new URL("./stats-view-model.ts", import.meta.url).href);

test("score trend options expose overall, distance, and keyboard in display order", () => {
  const options = createScoreTrendOptions({
    overall: [{ date: "2026-03-01", averageScore: 72.5, questionCount: 10 }],
    distance: [{ date: "2026-03-02", averageScore: 80, questionCount: 8 }],
    keyboard: [{ date: "2026-03-03", averageScore: 68, questionCount: 6 }],
  });

  assert.deepEqual(
    options.map((option: { id: string; label: string; tone: string }) => ({
      id: option.id,
      label: option.label,
      tone: option.tone,
    })),
    [
      { id: "overall", label: "全体", tone: "brand" },
      { id: "distance", label: "距離", tone: "teal" },
      { id: "keyboard", label: "鍵盤", tone: "blue" },
    ],
  );
  assert.equal(options[0].points[0].label, "03/01");
  assert.match(options[0].points[0].assistiveLabel, /全体 平均スコア/);
});

test("stats compact labels keep chart labels short and stable", () => {
  assert.equal(formatCompactDateLabel("2026-04-24"), "04/24");
  assert.equal(formatCompactDateLabel("invalid"), "invalid");
  assert.equal(getCompactIntervalChartLabel(7), "完5");
  assert.equal(getCompactIntervalChartLabel(13), "13半");
});
