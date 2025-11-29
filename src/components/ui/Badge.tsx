"use client";

import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  color?: string; // Custom hex color
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  color,
  className = "",
}: BadgeProps) {
  const variants = {
    default: "bg-neutral-700/50 text-neutral-200 border border-neutral-600",
    primary: "bg-white/15 text-white border border-white/30",
    success:
      "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
    warning:
      "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    danger: "bg-red-500/15 text-red-300 border border-red-500/30",
    info: "bg-violet-500/15 text-violet-300 border border-violet-500/30",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  // If custom color is provided, use it
  if (color) {
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full ${sizes[size]} ${className}`}
        style={{
          backgroundColor: `${color}20`,
          color: color,
        }}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}
