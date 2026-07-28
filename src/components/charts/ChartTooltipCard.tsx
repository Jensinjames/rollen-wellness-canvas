import React from "react";

/**
 * Shared, themed tooltip shell used by every chart so hover states
 * look and behave consistently across the app.
 */
interface ChartTooltipCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  color?: string;
  children?: React.ReactNode;
}

export const ChartTooltipCard: React.FC<ChartTooltipCardProps> = ({
  title,
  subtitle,
  color,
  children,
}) => (
  <div className="min-w-[10rem] rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-lg">
    <div className="flex items-center gap-2">
      {color && (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="text-sm font-medium leading-none">{title}</span>
    </div>
    {subtitle && (
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    )}
    {children && <div className="mt-2 space-y-1">{children}</div>}
  </div>
);

interface TooltipRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  color?: string;
  emphasis?: boolean;
}

export const TooltipRow: React.FC<TooltipRowProps> = ({
  label,
  value,
  color,
  emphasis,
}) => (
  <div className="flex items-center justify-between gap-4 text-xs">
    <span className="flex items-center gap-1.5 text-muted-foreground">
      {color && (
        <span
          className="h-2 w-2 shrink-0 rounded-[2px]"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </span>
    <span
      className={
        emphasis
          ? "font-semibold tabular-nums"
          : "font-medium tabular-nums text-foreground"
      }
    >
      {value}
    </span>
  </div>
);

/** Formats a minute count as "2h 15m" / "45m". */
export const formatMinutes = (minutes: number): string => {
  const rounded = Math.round(minutes);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

/** Formats decimal hours as "2h 15m". */
export const formatHours = (hours: number): string =>
  formatMinutes(hours * 60);
