"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from "react";
import { useEffect, useState } from "react";

import { cn } from "./cn";
import { type ButtonSize, type ButtonVariant, buttonClassName } from "./styles";

interface BasePendingLinkProps {
  pendingLabel?: ReactNode;
}

type PendingLinkProps = ComponentPropsWithoutRef<typeof Link> &
  BasePendingLinkProps;

export function ButtonLink(
  props: PendingLinkProps & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    block?: boolean;
  },
) {
  const {
    className,
    variant = "secondary",
    size = "default",
    block,
    pendingLabel = "移動中...",
    children,
    ...rest
  } = props;

  return (
    <PendingLink
      {...rest}
      pendingLabel={pendingLabel}
      className={buttonClassName(variant, { block, size, className })}
    >
      {children}
    </PendingLink>
  );
}

export function ListLinkCard(props: PendingLinkProps) {
  const { className, pendingLabel = "画面を開いています...", ...rest } = props;

  return (
    <PendingLink
      {...rest}
      pendingLabel={pendingLabel}
      className={cn("ui-list-link", className)}
    />
  );
}

function PendingLink(props: PendingLinkProps) {
  const { children, className, href, onClick, pendingLabel, ...rest } = props;
  const pathname = usePathname();
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!pathname) {
      return;
    }
    setIsPending(false);
  }, [pathname]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      isPending ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      rest.target === "_blank"
    ) {
      if (isPending) {
        event.preventDefault();
      }
      return;
    }

    setIsPending(true);
  }

  return (
    <Link
      {...rest}
      href={href}
      onClick={handleClick}
      className={className}
      aria-disabled={isPending || undefined}
      aria-busy={isPending || undefined}
      data-pending={isPending ? "true" : undefined}
    >
      {isPending ? pendingLabel : children}
    </Link>
  );
}
