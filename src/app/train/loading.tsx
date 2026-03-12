import { AppShell, Notice, Surface } from "../ui/primitives";
import { TrainingPageHero } from "./training-page-shell";

export default function Loading() {
  return (
    <AppShell narrow className="ui-train-shell">
      <TrainingPageHero
        title="トレーニング"
        subtitle="画面の骨組みを先に表示し、設定とセッション状態を準備しています。"
        phase="config"
        phaseLabel="設定"
      />
      <Surface tone="accent">
        <Notice>トレーニング画面を準備しています...</Notice>
      </Surface>
    </AppShell>
  );
}
