import { AppShell, Notice, PageHeader, Surface } from "./ui/primitives";

export default function Loading() {
  return (
    <AppShell narrow>
      <PageHeader
        title="画面を開いています..."
        eyebrow="Loading"
        subtitle="押下した操作を受け付けました。表示を準備しています。"
        className="ui-loading-hero"
      />
      <Surface tone="accent" className="ui-loading-surface">
        <Notice>ページ遷移中です。少しだけお待ちください。</Notice>
      </Surface>
    </AppShell>
  );
}
