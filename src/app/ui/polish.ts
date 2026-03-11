import type { CSSProperties } from "react";

const palette = {
  page: "#f5f1e8",
  card: "#fffdf8",
  cardMuted: "#f8f5ee",
  border: "#ddd3c2",
  text: "#1f2937",
  muted: "#5f6b7a",
  accent: "#0f766e",
  accentSoft: "#ccfbf1",
  accentText: "#115e59",
  successBg: "#ecfdf5",
  successBorder: "#86efac",
  successText: "#166534",
  errorBg: "#fef2f2",
  errorBorder: "#fca5a5",
  errorText: "#991b1b",
  warningBg: "#fff7ed",
  warningBorder: "#fdba74",
  warningText: "#9a3412",
};

export const pageShellStyle: CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto",
  padding: "40px 20px 64px",
  display: "grid",
  gap: "20px",
  color: palette.text,
};

export const pageHeroStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "24px",
  background: `linear-gradient(135deg, ${palette.card} 0%, ${palette.cardMuted} 100%)`,
  border: `1px solid ${palette.border}`,
  borderRadius: "20px",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
};

export const pageTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "42px",
  lineHeight: 1.05,
  letterSpacing: "-0.04em",
};

export const pageSubtitleStyle: CSSProperties = {
  margin: 0,
  color: palette.muted,
  lineHeight: 1.6,
};

export const cardStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  padding: "18px",
  background: palette.card,
  border: `1px solid ${palette.border}`,
  borderRadius: "18px",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
};

export const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "22px",
  lineHeight: 1.2,
  letterSpacing: "-0.02em",
};

export const navRowStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

export const navLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: "999px",
  border: `1px solid ${palette.border}`,
  background: palette.card,
  color: palette.text,
  textDecoration: "none",
  fontWeight: 600,
};

export const metricsGridStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
};

export const metricCardStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  padding: "14px",
  borderRadius: "14px",
  border: `1px solid ${palette.border}`,
  background: palette.cardMuted,
};

export const metricLabelStyle: CSSProperties = {
  color: palette.muted,
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

export const metricValueStyle: CSSProperties = {
  fontSize: "28px",
  lineHeight: 1.1,
  fontWeight: 700,
  letterSpacing: "-0.03em",
};

export const listStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: "none",
  display: "grid",
  gap: "10px",
};

export const listLinkStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  padding: "14px 16px",
  borderRadius: "14px",
  border: `1px solid ${palette.border}`,
  background: palette.cardMuted,
  color: palette.text,
  textDecoration: "none",
};

export const subtleTextStyle: CSSProperties = {
  margin: 0,
  color: palette.muted,
  lineHeight: 1.6,
};

export const keyValueGridStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
};

export const keyValueCardStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  padding: "12px 14px",
  borderRadius: "12px",
  background: palette.cardMuted,
  border: `1px solid ${palette.border}`,
};

export function buttonStyle(
  kind: "primary" | "secondary" = "secondary",
  disabled = false,
): CSSProperties {
  if (kind === "primary") {
    return {
      padding: "11px 16px",
      borderRadius: "12px",
      border: `1px solid ${palette.accent}`,
      background: disabled ? "#9ca3af" : palette.accent,
      color: "#ffffff",
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.7 : 1,
    };
  }

  return {
    padding: "11px 16px",
    borderRadius: "12px",
    border: `1px solid ${palette.border}`,
    background: disabled ? "#e5e7eb" : palette.card,
    color: palette.text,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.7 : 1,
  };
}

export function noticeStyle(
  kind: "info" | "success" | "error" = "info",
): CSSProperties {
  if (kind === "success") {
    return {
      padding: "12px 14px",
      borderRadius: "14px",
      border: `1px solid ${palette.successBorder}`,
      background: palette.successBg,
      color: palette.successText,
    };
  }

  if (kind === "error") {
    return {
      padding: "12px 14px",
      borderRadius: "14px",
      border: `1px solid ${palette.errorBorder}`,
      background: palette.errorBg,
      color: palette.errorText,
    };
  }

  return {
    padding: "12px 14px",
    borderRadius: "14px",
    border: `1px solid ${palette.warningBorder}`,
    background: palette.warningBg,
    color: palette.warningText,
  };
}

export function phaseBadgeStyle(phase: string): CSSProperties {
  const isActive =
    phase === "answering" || phase === "playing" || phase === "feedback";

  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    background: isActive ? palette.accentSoft : palette.cardMuted,
    color: isActive ? palette.accentText : palette.muted,
    fontWeight: 700,
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  };
}
