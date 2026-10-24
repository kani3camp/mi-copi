type GoogleLoginRequest = {
  provider: "google";
  callbackURL: "/";
};

export type GoogleLoginStarter = (
  request: GoogleLoginRequest,
) => Promise<unknown>;

export function startGoogleLogin(signInSocial: GoogleLoginStarter) {
  return signInSocial({
    provider: "google",
    callbackURL: "/",
  });
}
