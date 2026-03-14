import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "../../../../lib/auth";

type AuthRouteHandler = ReturnType<typeof toNextJsHandler>["GET"];
type AuthRoutePostHandler = ReturnType<typeof toNextJsHandler>["POST"];

export const GET: AuthRouteHandler = (...args) => {
  return toNextJsHandler(getAuth()).GET(...args);
};

export const POST: AuthRoutePostHandler = (...args) => {
  return toNextJsHandler(getAuth()).POST(...args);
};
