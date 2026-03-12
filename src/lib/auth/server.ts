import { getSessionCookie } from "better-auth/cookies";
import { cache } from "react";

import { withRequestTiming } from "../server/request-timing.ts";

export interface CurrentUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface CurrentUserResolverDependencies {
  currentUser?: CurrentUser | null;
  getCurrentUser?: () => Promise<CurrentUser | null>;
}

export function hasSessionTokenCookie(requestHeaders: Headers): boolean {
  return Boolean(getSessionCookie(new Headers(requestHeaders)));
}

export const hasSessionTokenCookieCached = cache(async (): Promise<boolean> => {
  const { headers } = await import("next/headers");

  return hasSessionTokenCookie(await headers());
});

export const getCurrentUserOrNullCached = cache(
  async (): Promise<CurrentUser | null> => {
    return withRequestTiming("auth.getCurrentUserOrNullCached", async () => {
      const [{ getAuth }, { headers }] = await Promise.all([
        import("./index"),
        import("next/headers"),
      ]);
      const auth = getAuth();
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session?.user) {
        return null;
      }

      return {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image:
          "image" in session.user && typeof session.user.image === "string"
            ? session.user.image
            : null,
      };
    });
  },
);

export async function getCurrentUserOrNull(): Promise<CurrentUser | null> {
  return getCurrentUserOrNullCached();
}

export async function resolveCurrentUserOrNull(
  deps: CurrentUserResolverDependencies = {},
): Promise<CurrentUser | null> {
  if ("currentUser" in deps) {
    return deps.currentUser ?? null;
  }

  return (deps.getCurrentUser ?? getCurrentUserOrNullCached)();
}
