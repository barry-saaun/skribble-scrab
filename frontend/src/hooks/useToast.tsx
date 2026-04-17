"use client";

import React from "react";
import { toast } from "sonner";

const InfoIcon = () => (
  <span
    style={{
      fontFamily: "var(--font-jetbrains-mono, monospace)",
      fontWeight: 700,
      fontSize: "10px",
      color: "oklch(0.42 0.16 240)",
      letterSpacing: "0.05em",
      flexShrink: 0,
    }}
  >
    {"//"}
  </span>
);

const SuccessIcon = () => (
  <span
    style={{
      fontFamily: "var(--font-jetbrains-mono, monospace)",
      fontWeight: 700,
      fontSize: "10px",
      color: "oklch(0.38 0.13 145)",
      letterSpacing: "0.05em",
      flexShrink: 0,
    }}
  >
    {"[+]"}
  </span>
);

/** Powder blue with dark steel-blue border + offset shadow. */
const INFO_STYLE: React.CSSProperties = {
  background: "oklch(0.90 0.07 235)",          // powder blue
  border: "2px solid oklch(0.42 0.16 240)",    // dark steel blue
  boxShadow: "4px 4px 0px oklch(0.42 0.16 240)",
  borderRadius: 0,
  color: "oklch(0.14 0.008 60)",               // --foreground: ink
};

/** Muted sage-green with forest-green border + offset shadow. */
const SUCCESS_STYLE: React.CSSProperties = {
  background: "oklch(0.94 0.04 145)",
  border: "2px solid oklch(0.38 0.13 145)",
  boxShadow: "4px 4px 0px oklch(0.38 0.13 145)",
  borderRadius: 0,
  color: "oklch(0.14 0.008 60)",
};

/** variants classNames, inspired by shadcn */

const INFO_CLASSNAMES = {
  toast: "!rounded-none !font-mono",
  title:
    "!font-bold !uppercase !tracking-widest !text-xs !text-[oklch(0.14_0.008_60)]",
  description:
    "!font-mono !text-xs !uppercase !tracking-wider !text-[oklch(0.42_0.16_240)]",
} as const;

const SUCCESS_CLASSNAMES = {
  toast: "!rounded-none !font-mono",
  title:
    "!font-bold !uppercase !tracking-widest !text-xs !text-[oklch(0.14_0.008_60)]",
  description:
    "!font-mono !text-xs !uppercase !tracking-wider !text-[oklch(0.38_0.13_145)]",
} as const;

export function useToast() {
  /** Warm parchment + ink — for neutral game events (player left, round end…). */
  const info = (title: string, description?: string) =>
    toast.info(title, {
      description,
      icon: <InfoIcon />,
      style: INFO_STYLE,
      classNames: INFO_CLASSNAMES,
    });

  /** Sage-green stamp — for positive outcomes (correct guess, game start…). */
  const success = (title: string, description?: string) =>
    toast.success(title, {
      description,
      icon: <SuccessIcon />,
      style: SUCCESS_STYLE,
      classNames: SUCCESS_CLASSNAMES,
    });

  /** Dark/red — for errors. Delegates to the Toaster's default error style. */
  const error = (title: string, description?: string) =>
    toast.error(title, { description });

  return { info, success, error };
}
