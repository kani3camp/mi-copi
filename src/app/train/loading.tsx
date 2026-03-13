import { AppShell, Notice, Surface } from "../ui/primitives";
import { TrainingProgressHeader } from "./training-page-shell";

export default function Loading() {
  return (
    <AppShell narrow className="ui-train-shell">
      <TrainingProgressHeader modeLabel="トレーニング" />
      <Surface tone="accent">
        <Notice>トレーニング画面を準備しています...</Notice>
      </Surface>
    </AppShell>
  );
}
