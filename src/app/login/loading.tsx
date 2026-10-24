import { Notice, Surface } from "../ui/primitives";
import { LoginPageLayout } from "./login-panels";

export default function Loading() {
  return (
    <LoginPageLayout isAuthenticated={false}>
      <Surface className="ui-login-loading-surface">
        <Notice>ログイン画面を準備しています...</Notice>
      </Surface>
    </LoginPageLayout>
  );
}
