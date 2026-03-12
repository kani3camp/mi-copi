import Link from "next/link";

import { getCurrentUserOrNull } from "../../lib/auth/server";
import {
  cardStyle,
  navLinkStyle,
  navRowStyle,
  pageHeroStyle,
  pageShellStyle,
  pageSubtitleStyle,
  pageTitleStyle,
  sectionTitleStyle,
  subtleTextStyle,
} from "../ui/polish";
import { LoginControls } from "./login-controls";

export default async function LoginPage() {
  const currentUser = await getCurrentUserOrNull();

  return (
    <main style={pageShellStyle}>
      <header style={pageHeroStyle}>
        <h1 style={pageTitleStyle}>ログイン</h1>
        <p style={pageSubtitleStyle}>
          Google ログインまたはゲスト開始の入口です。相対音感トレーニングを
          すぐ始めつつ、必要なら保存機能にも切り替えられます。
        </p>
        <div style={navRowStyle}>
          <Link href="/" style={navLinkStyle}>
            ホームへ戻る
          </Link>
          <Link href="/train/distance" style={navLinkStyle}>
            距離モードへ
          </Link>
          <Link href="/train/keyboard" style={navLinkStyle}>
            鍵盤モードへ
          </Link>
        </div>
      </header>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>開始方法</h2>
        <p style={subtleTextStyle}>
          ミーコピ MVP ではゲスト
          でも練習できます。保存済み履歴や成長確認を使う場合だけ
          ログインしてください。
        </p>
        <LoginControls isAuthenticated={Boolean(currentUser)} />
      </section>

      {currentUser ? (
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>サインイン中のアカウント</h2>
          <p style={subtleTextStyle}>
            {currentUser.name ?? "不明"} / {currentUser.email ?? "不明"}
          </p>
        </section>
      ) : null}
    </main>
  );
}
