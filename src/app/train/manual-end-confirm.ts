export const MANUAL_SESSION_END_CONFIRM_MESSAGE =
  "本当にここで終了しますか？ここまでの回答を集計して結果画面へ進みます。";

type ConfirmFn = (message: string) => boolean;

export function confirmManualSessionEnd(
  confirmFn: ConfirmFn = (message) => window.confirm(message),
): boolean {
  return confirmFn(MANUAL_SESSION_END_CONFIRM_MESSAGE);
}
