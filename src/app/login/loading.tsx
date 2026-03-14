import { AppShell, Notice, PageHeader, Surface } from "../ui/primitives";

export default function Loading() {
  return (
    <AppShell narrow>
      <PageHeader
        title="ログイン"
        eyebrow="アカウント"
        subtitle="ログイン導線とアカウント状態を準備しています。"
      />
      <Surface tone="accent">
        <Notice>ログイン画面を準備しています...</Notice>
      </Surface>
    </AppShell>
  );
}
