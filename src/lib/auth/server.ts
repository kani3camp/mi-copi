import { cache } from "react";

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

export const getCurrentUserOrNullCached = cache(
  async (): Promise<CurrentUser | null> => {
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
