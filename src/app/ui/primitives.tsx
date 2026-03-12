import Link from "next/link";
import type {
  ComponentPropsWithoutRef,
  PropsWithChildren,
  ReactNode,
} from "react";

import { cn } from "./cn";
import { buttonClassName, chipClassName, noticeClassName } from "./styles";

export function AppShell(
  props: PropsWithChildren<{
    narrow?: boolean;
    className?: string;
  }>,
) {
  return (
    <main
      className={cn(
        "ui-shell",
        props.narrow && "ui-shell--narrow",
        props.className,
      )}
    >
      {props.children}
    </main>
  );
}

export function PageHero(
  props: PropsWithChildren<{
    title: string;
    subtitle?: ReactNode;
    eyebrow?: ReactNode;
    actions?: ReactNode;
    className?: string;
  }>,
) {
  return (
    <header className={cn("ui-hero", props.className)}>
      <div className="ui-stack-md">
        {props.eyebrow ? (
          <div className="ui-hero__eyebrow">{props.eyebrow}</div>
        ) : null}
        <div className="ui-hero__header">
          <h1 className="ui-title">{props.title}</h1>
          {props.subtitle ? (
            <p className="ui-subtitle">{props.subtitle}</p>
          ) : null}
        </div>
      </div>
      {props.children}
      {props.actions ? <div className="ui-nav-row">{props.actions}</div> : null}
    </header>
  );
}

export function Surface(
  props: PropsWithChildren<{
    as?: "section" | "div" | "article";
    tone?: "default" | "muted" | "accent";
    className?: string;
  }>,
) {
  const Tag = props.as ?? "section";

  return (
    <Tag
      className={cn(
        "ui-surface",
        props.tone === "muted" && "ui-surface--muted",
        props.tone === "accent" && "ui-surface--accent",
        props.className,
      )}
    >
      {props.children}
    </Tag>
  );
}

export function SectionHeader(props: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("ui-section-header", props.className)}>
      <div className="ui-inline-split">
        <h2 className="ui-section-title">{props.title}</h2>
        {props.actions}
      </div>
      {props.description ? (
        <p className="ui-subtitle">{props.description}</p>
      ) : null}
    </div>
  );
}

export function ButtonLink(
  props: ComponentPropsWithoutRef<typeof Link> & {
    variant?: Parameters<typeof buttonClassName>[0];
    block?: boolean;
  },
) {
  const { className, variant = "secondary", block, ...rest } = props;

  return (
    <Link
      {...rest}
      className={buttonClassName(variant, { block, className })}
    />
  );
}

export function Button(
  props: ComponentPropsWithoutRef<"button"> & {
    variant?: Parameters<typeof buttonClassName>[0];
    block?: boolean;
  },
) {
  const { className, variant = "secondary", block, ...rest } = props;

  return (
    <button
      {...rest}
      className={buttonClassName(variant, { block, className })}
    />
  );
}

export function Notice(
  props: PropsWithChildren<{
    tone?: "info" | "success" | "error";
    className?: string;
  }>,
) {
  return (
    <div className={noticeClassName(props.tone, props.className)}>
      {props.children}
    </div>
  );
}

export function Chip(
  props: PropsWithChildren<{
    tone?: "neutral" | "active" | "info" | "success" | "error";
    className?: string;
  }>,
) {
  return (
    <span className={chipClassName(props.tone, props.className)}>
      {props.children}
    </span>
  );
}

export function MetricGrid(props: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("ui-grid-metrics", props.className)}>
      {props.children}
    </div>
  );
}

export function MetricCard(props: {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  accent?: boolean;
  compactValue?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "ui-metric-card",
        props.accent && "ui-metric-card--accent",
        props.className,
      )}
    >
      <span className="ui-metric-label">{props.label}</span>
      <span
        className={cn(
          "ui-metric-value",
          props.compactValue && "ui-metric-value--compact",
        )}
      >
        {props.value}
      </span>
      {props.detail ? <span className="ui-muted">{props.detail}</span> : null}
    </div>
  );
}

export function KeyValueGrid(props: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("ui-grid-kv", props.className)}>{props.children}</div>
  );
}

export function KeyValueCard(props: {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("ui-kv-card", props.className)}>
      <span className="ui-kv-label">{props.label}</span>
      <span className="ui-kv-value">{props.value}</span>
      {props.detail ? <span className="ui-muted">{props.detail}</span> : null}
    </div>
  );
}

export function Field(
  props: PropsWithChildren<{
    label: ReactNode;
    hint?: ReactNode;
    className?: string;
  }>,
) {
  return (
    <div className={cn("ui-field", props.className)}>
      <span className="ui-field__label">{props.label}</span>
      {props.hint ? <span className="ui-field__hint">{props.hint}</span> : null}
      {props.children}
    </div>
  );
}

export function FieldGrid(props: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("ui-grid-fields", props.className)}>
      {props.children}
    </div>
  );
}

export function List(
  props: PropsWithChildren<{
    as?: "ul" | "div";
    className?: string;
  }>,
) {
  const Tag = props.as ?? "ul";

  return <Tag className={cn("ui-list", props.className)}>{props.children}</Tag>;
}

export function ListLinkCard(props: ComponentPropsWithoutRef<typeof Link>) {
  const { className, ...rest } = props;

  return <Link {...rest} className={cn("ui-list-link", className)} />;
}

export function Divider(props: { className?: string }) {
  return (
    <div className={cn("ui-divider", props.className)} aria-hidden="true" />
  );
}

export function ScreenReaderText(
  props: PropsWithChildren<{ as?: "span" | "p" }>,
) {
  const Tag = props.as ?? "span";

  return <Tag className="sr-only">{props.children}</Tag>;
}
