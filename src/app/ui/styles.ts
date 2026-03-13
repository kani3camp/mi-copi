import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "default" | "compact";
export type NoticeTone = "info" | "warning" | "success" | "error";
export type ChipTone =
  | "neutral"
  | "brand"
  | "teal"
  | "amber"
  | "coral"
  | "blue"
  | "active"
  | "info"
  | "success"
  | "warning"
  | "error";

export function buttonClassName(
  variant: ButtonVariant = "secondary",
  options?: {
    block?: boolean;
    pending?: boolean;
    size?: ButtonSize;
    className?: string;
  },
): string {
  return cn(
    "ui-button",
    `ui-button--${variant}`,
    `ui-button--${options?.size ?? "default"}`,
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
  const mappedTone = mapLegacyChipTone(tone);

  return cn("ui-chip", `ui-chip--${mappedTone}`, className);
}

function mapLegacyChipTone(
  tone: ChipTone,
): Exclude<ChipTone, "active" | "info" | "error"> {
  if (tone === "active") {
    return "teal";
  }

  if (tone === "info") {
    return "blue";
  }

  if (
    tone === "brand" ||
    tone === "teal" ||
    tone === "amber" ||
    tone === "coral" ||
    tone === "blue" ||
    tone === "success" ||
    tone === "warning"
  ) {
    return tone;
  }

  if (tone === "error") {
    return "coral";
  }

  return "neutral";
}
