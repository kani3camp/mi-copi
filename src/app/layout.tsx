import type { ReactNode } from "react";

import { GlobalUserSettingsProvider } from "../features/settings/client/global-user-settings-provider";
import type { GlobalUserSettings } from "../features/settings/model/global-user-settings";
import {
  getGlobalUserSettingsForCurrentUser,
  updateGlobalUserSettingsForCurrentUser,
} from "../features/settings/server/global-user-settings";
import "./globals.css";

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
      <body>
        <GlobalUserSettingsProvider
          initialSettings={initialGlobalSettings.settings}
          initialUpdatedAt={initialGlobalSettings.updatedAt}
          isAuthenticated={initialGlobalSettings.isAuthenticated}
          persistSettingsAction={persistGlobalUserSettingsAction}
        >
          <div className="app-root">{children}</div>
        </GlobalUserSettingsProvider>
      </body>
    </html>
  );
}
