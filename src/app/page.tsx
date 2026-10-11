import { Suspense } from "react";

import { getHomeTrainingSummaryForCurrentUser } from "../features/training/server/getHomeTrainingSummary";
import {
  type CurrentUser,
  getCurrentUserOrNullCached,
} from "../lib/auth/server";
import { HomeHeader, HomeRecords, HomeTrainingEntries } from "./home-panels";
import { HomeSignOutButton } from "./home-sign-out-button";
import { AppShell } from "./ui/primitives";

export default async function HomePage() {
  const currentUser = await getCurrentUserOrNullCached();
  const isAuthenticated = currentUser !== null;

  return (
    <AppShell className="ui-home-shell">
      <HomeHeader isAuthenticated={isAuthenticated} />
      <HomeTrainingEntries isAuthenticated={isAuthenticated} />
      {currentUser ? (
        <Suspense
          fallback={
            <output className="ui-home-empty">学習の記録を読み込み中...</output>
          }
        >
          <AuthenticatedHomeContent currentUser={currentUser} />
        </Suspense>
      ) : null}
    </AppShell>
  );
}

async function AuthenticatedHomeContent(props: { currentUser: CurrentUser }) {
  const summary = await getHomeTrainingSummaryForCurrentUser({
    currentUser: props.currentUser,
  });
  return <HomeRecords summary={summary} signOut={<HomeSignOutButton />} />;
}
