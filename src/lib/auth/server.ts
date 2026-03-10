import { headers } from "next/headers";

import { getAuth } from "./index";

export interface CurrentUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export async function getCurrentUserOrNull(): Promise<CurrentUser | null> {
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
}
