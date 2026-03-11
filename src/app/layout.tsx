import type { ReactNode } from "react";

import { GlobalUserSettingsProvider } from "../features/settings/client/global-user-settings-provider";
import type { GlobalUserSettings } from "../features/settings/model/global-user-settings";
import {
  getGlobalUserSettingsForCurrentUser,
  updateGlobalUserSettingsForCurrentUser,
} from "../features/settings/server/global-user-settings";

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const initialGlobalSettings = await getGlobalUserSettingsForCurrentUser();

  async function persistGlobalUserSettingsAction(settings: GlobalUserSettings) {
    "use server";

    return updateGlobalUserSettingsForCurrentUser(settings);
  }

  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top, #fff8e8 0%, #f5f1e8 38%, #efe7d7 100%)",
          color: "#1f2937",
          fontFamily:
            '"Hiragino Sans", "Yu Gothic", "Noto Sans JP", system-ui, sans-serif',
        }}
      >
        <GlobalUserSettingsProvider
          initialSettings={initialGlobalSettings.settings}
          initialUpdatedAt={initialGlobalSettings.updatedAt}
          isAuthenticated={initialGlobalSettings.isAuthenticated}
          persistSettingsAction={persistGlobalUserSettingsAction}
        >
          <div
            style={{
              minHeight: "100vh",
              padding: "24px 0 48px",
            }}
          >
            {children}
          </div>
        </GlobalUserSettingsProvider>
      </body>
    </html>
  );
}
