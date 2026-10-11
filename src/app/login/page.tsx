import { getCurrentUserOrNullCached } from "../../lib/auth/server";
import { LoginControls } from "./login-controls";
import { LoginPageLayout, LoginSignedInPanel } from "./login-panels";

export default async function LoginPage() {
  const currentUser = await getCurrentUserOrNullCached();
  return (
    <LoginPageLayout isAuthenticated={Boolean(currentUser)}>
      {currentUser ? (
        <LoginSignedInPanel name={currentUser.name} email={currentUser.email} />
      ) : (
        <LoginControls />
      )}
    </LoginPageLayout>
  );
}
