"use client";

import { cn } from "@/lib/utils";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface CircularProgressProps {
  value: number;
  maxValue: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  showValue?: boolean;
  suffix?: string;
  animated?: boolean;
  className?: string;
}

export function CircularProgress({
  value,
  maxValue,
  size = 120,
  strokeWidth = 8,
  label,
  sublabel,
  color = "stroke-primary",
  showValue = true,
  suffix = "",
  animated = true,
  className,
}: CircularProgressProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((value / maxValue) * 100, 100);
  const strokeDashoffset = circumference * (1 - percentage / 100);

  return (
    <div
      ref={ref}
      className={cn("relative inline-flex flex-col items-center", className)}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset }}
          animate={isInView || !animated ? { strokeDashoffset } : {}}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={cn(color)}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <motion.span
            initial={animated ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
            animate={isInView || !animated ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-2xl font-bold"
          >
            {value.toLocaleString()}
            {suffix}
          </motion.span>
        )}
        {label && (
          <span className="text-xs text-muted-foreground font-medium">
            {label}
          </span>
        )}
      </div>

      {sublabel && (
        <span className="mt-2 text-sm font-medium text-muted-foreground">
          {sublabel}
        </span>
      )}
    </div>
  );
}
