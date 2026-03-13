import type {
  ComponentPropsWithoutRef,
  PropsWithChildren,
  ReactNode,
} from "react";

import { cn } from "./cn";
import {
  type ButtonSize,
  type ButtonVariant,
  buttonClassName,
  chipClassName,
  noticeClassName,
} from "./styles";

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

interface BaseHeaderProps {
  title: string;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  supporting?: ReactNode;
  className?: string;
}

export function PageHeader(props: BaseHeaderProps) {
  return (
    <header className={cn("ui-page-header", props.className)}>
      <div className="ui-page-header__main">
        {props.eyebrow ? (
          <div className="ui-page-header__eyebrow">{props.eyebrow}</div>
        ) : null}
        <div className="ui-page-header__copy">
          <h1 className="ui-title">{props.title}</h1>
          {props.subtitle ? (
            <p className="ui-subtitle ui-page-header__subtitle">
              {props.subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {props.actions ? (
        <div className="ui-page-header__actions">{props.actions}</div>
      ) : null}
      {props.supporting ? (
        <div className="ui-page-header__supporting">{props.supporting}</div>
      ) : null}
    </header>
  );
}

export function PageHero(props: PropsWithChildren<BaseHeaderProps>) {
  return (
    <PageHeader
      title={props.title}
      subtitle={props.subtitle}
      eyebrow={props.eyebrow}
      actions={props.actions}
      supporting={props.children}
      className={cn("ui-page-header--hero", props.className)}
    />
  );
}

export function Surface(
  props: PropsWithChildren<{
    as?: "section" | "div" | "article";
    tone?: "default" | "muted" | "accent" | "elevated";
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
        props.tone === "elevated" && "ui-surface--elevated",
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
  eyebrow?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("ui-section-header", props.className)}>
      <div className="ui-inline-split">
        <div className="ui-section-header__copy">
          {props.eyebrow ? (
            <div className="ui-section-header__eyebrow">{props.eyebrow}</div>
          ) : null}
          <h2 className="ui-section-title">{props.title}</h2>
        </div>
        {props.actions ? (
          <div className="ui-section-header__actions">{props.actions}</div>
        ) : null}
      </div>
      {props.description ? (
        <p className="ui-subtitle">{props.description}</p>
      ) : null}
    </div>
  );
}

export function Button(
  props: ComponentPropsWithoutRef<"button"> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    block?: boolean;
    pending?: boolean;
  },
) {
  const {
    className,
    variant = "secondary",
    size = "default",
    block,
    pending = false,
    ...rest
  } = props;

  return (
    <button
      {...rest}
      className={buttonClassName(variant, {
        block,
        pending,
        size,
        className,
      })}
      data-pending={pending ? "true" : undefined}
      aria-busy={pending || undefined}
    />
  );
}

export function Notice(
  props: PropsWithChildren<{
    tone?: "info" | "warning" | "success" | "error";
    className?: string;
  }>,
) {
  const tone = props.tone ?? "info";
  const role = tone === "error" ? "alert" : "status";
  const ariaLive = tone === "error" ? "assertive" : "polite";

  return (
    <div
      className={noticeClassName(tone, props.className)}
      role={role}
      aria-live={ariaLive}
    >
      {props.children}
    </div>
  );
}

export function Chip(
  props: PropsWithChildren<{
    tone?:
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

export function SummaryBlock(
  props: PropsWithChildren<{
    className?: string;
  }>,
) {
  return (
    <div className={cn("ui-summary-block", props.className)}>
      {props.children}
    </div>
  );
}

export function SummaryStat(props: {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  emphasis?: "primary" | "default";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "ui-summary-stat",
        props.emphasis === "primary" && "ui-summary-stat--primary",
        props.className,
      )}
    >
      <span className="ui-summary-stat__label">{props.label}</span>
      <strong className="ui-summary-stat__value">{props.value}</strong>
      {props.detail ? (
        <span className="ui-summary-stat__detail">{props.detail}</span>
      ) : null}
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

export function GraphCard(
  props: PropsWithChildren<{
    title: ReactNode;
    subtitle?: ReactNode;
    className?: string;
    actions?: ReactNode;
  }>,
) {
  return (
    <section className={cn("ui-graph-card", props.className)}>
      <div className="ui-graph-card__header">
        <div className="ui-stack-sm">
          <strong className="ui-graph-card__title">{props.title}</strong>
          {props.subtitle ? (
            <span className="ui-muted">{props.subtitle}</span>
          ) : null}
        </div>
        {props.actions ? <div>{props.actions}</div> : null}
      </div>
      {props.children}
    </section>
  );
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
