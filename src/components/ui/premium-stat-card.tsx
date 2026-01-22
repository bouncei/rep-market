"use client";

import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface PremiumStatCardProps {
  title: string;
  value: string | number;
  delta?: number;
  lastPeriodValue?: string;
  prefix?: string;
  suffix?: string;
  icon?: LucideIcon;
  variant?: "dark" | "emerald" | "blue" | "amber" | "violet" | "rose";
  className?: string;
}

const variantStyles = {
  dark: "bg-zinc-900 dark:bg-zinc-950",
  emerald: "bg-gradient-to-br from-emerald-600 to-emerald-700",
  blue: "bg-gradient-to-br from-blue-600 to-blue-700",
  amber: "bg-gradient-to-br from-amber-500 to-amber-600",
  violet: "bg-gradient-to-br from-violet-600 to-violet-700",
  rose: "bg-gradient-to-br from-rose-500 to-rose-600",
};

export function PremiumStatCard({
  title,
  value,
  delta,
  lastPeriodValue,
  prefix = "",
  suffix = "",
  icon: Icon,
  variant = "dark",
  className,
}: PremiumStatCardProps) {
  const isPositive = delta !== undefined && delta >= 0;
  const showDelta = delta !== undefined && delta !== 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-xl p-5 text-white h-full",
          variantStyles[variant],
          className
        )}
      >
        {/* Decorative background shapes */}
        <svg
          className="absolute right-0 top-0 h-full w-2/3 pointer-events-none"
          viewBox="0 0 300 200"
          fill="none"
        >
          <circle cx="220" cy="100" r="90" fill="#fff" fillOpacity="0.08" />
          <circle cx="260" cy="60" r="60" fill="#fff" fillOpacity="0.10" />
          <circle cx="200" cy="160" r="50" fill="#fff" fillOpacity="0.07" />
        </svg>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <span className="text-sm font-medium text-white/80">{title}</span>
          {Icon && (
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-white/80" />
            </div>
          )}
        </div>

        {/* Value and Delta */}
        <div className="flex items-center gap-3 relative z-10">
          <span className="text-3xl font-bold tracking-tight">
            {prefix}
            {typeof value === "number" ? value.toLocaleString() : value}
            {suffix}
          </span>
          {showDelta && (
            <Badge
              className={cn(
                "font-semibold border",
                isPositive
                  ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/30"
                  : "bg-red-500/20 text-red-200 border-red-500/30"
              )}
            >
              {isPositive ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(delta)}%
            </Badge>
          )}
        </div>

        {/* Comparison */}
        {lastPeriodValue && (
          <div className="text-xs text-white/60 mt-3 pt-3 border-t border-white/20 relative z-10">
            Vs last period:{" "}
            <span className="font-medium text-white">{lastPeriodValue}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
