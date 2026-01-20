"use client";

import { cn } from "@/lib/utils";

interface RepScoreDisplayProps {
  score: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function RepScoreDisplay({
  score,
  className,
  size = "md",
  showLabel = true,
}: RepScoreDisplayProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
  };

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <span
        className={cn(
          "font-bold tabular-nums",
          sizeClasses[size]
        )}
      >
        {score.toFixed(0)}
      </span>
      {showLabel && (
        <span className="text-sm text-muted-foreground">RepScore</span>
      )}
    </div>
  );
}
