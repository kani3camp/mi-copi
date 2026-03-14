export function shouldStartQuestionPlayback(params: {
  phase: string;
  activePlayNonce: number | null;
  inFlightPlayNonce: number | null;
}): boolean {
  return (
    params.phase === "playing" &&
    params.activePlayNonce !== null &&
    params.inFlightPlayNonce !== params.activePlayNonce
  );
}

export function shouldStartAnsweringTransition(params: {
  phase: string;
  activePlayNonce: number | null;
  targetPlayNonce: number;
  handledPlayNonce: number | null;
}): boolean {
  return (
    params.phase === "playing" &&
    params.activePlayNonce === params.targetPlayNonce &&
    params.handledPlayNonce !== params.targetPlayNonce
  );
}
