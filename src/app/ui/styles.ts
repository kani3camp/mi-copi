import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type NoticeTone = "info" | "success" | "error";
export type ChipTone = "neutral" | "active" | "info" | "success" | "error";

export function buttonClassName(
  variant: ButtonVariant = "secondary",
  options?: {
    block?: boolean;
    pending?: boolean;
    className?: string;
  },
): string {
  return cn(
    "ui-button",
    `ui-button--${variant}`,
    options?.block && "ui-button--block",
    options?.pending && "ui-button--pending",
    options?.className,
  );
}

export function noticeClassName(
  tone: NoticeTone = "info",
  className?: string,
): string {
  return cn("ui-notice", `ui-notice--${tone}`, className);
}

export function chipClassName(
  tone: ChipTone = "neutral",
  className?: string,
): string {
  return cn("ui-chip", `ui-chip--${tone}`, className);
}
