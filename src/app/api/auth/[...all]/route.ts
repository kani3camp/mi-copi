import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "../../../../lib/auth";

type AuthRouteHandler = ReturnType<typeof toNextJsHandler>["GET"];

export const GET: AuthRouteHandler = (...args) => {
  return toNextJsHandler(getAuth()).GET(...args);
};

export const POST: AuthRouteHandler = (...args) => {
  return toNextJsHandler(getAuth()).POST(...args);
};
