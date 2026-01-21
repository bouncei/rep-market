"use client";

import { cn } from "@/lib/utils";
import { Lock, TrendingUp } from "lucide-react";

interface RepScoreDisplayProps {
  score: number;
  lockedScore?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showBreakdown?: boolean;
}

export function RepScoreDisplay({
  score,
  lockedScore = 0,
  className,
  size = "md",
  showLabel = true,
  showBreakdown = false,
}: RepScoreDisplayProps) {
  const availableScore = score - lockedScore;
  const availablePercentage = score > 0 ? (availableScore / score) * 100 : 100;

  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Main score display */}
      <div className="flex items-baseline gap-2">
        <span className={cn("font-bold tabular-nums", sizeClasses[size])}>
          {showBreakdown ? availableScore.toFixed(0) : score.toFixed(0)}
        </span>
        {showLabel && (
          <span className="text-xs text-muted-foreground">
            {showBreakdown ? "available" : "RepScore"}
          </span>
        )}
      </div>

      {/* Breakdown section */}
      {showBreakdown && lockedScore > 0 && (
        <div className="mt-3 space-y-2">
          {/* Visual progress bar showing available portion */}
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${availablePercentage}%` }}
            />
          </div>

          {/* Locked and Total stats */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-orange-500">
              <Lock className="h-3 w-3" />
              <span>Locked</span>
            </div>
            <span className="font-medium text-orange-500">{lockedScore.toFixed(0)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" />
              <span>Total</span>
            </div>
            <span className="font-medium">{score.toFixed(0)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
