"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ProbabilityToggleProps {
  rawProbability: number;
  weightedProbability: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ProbabilityToggle({
  rawProbability,
  weightedProbability,
  className,
  size = "md",
}: ProbabilityToggleProps) {
  const [showWeighted, setShowWeighted] = useState(true);

  const displayProbability = showWeighted ? weightedProbability : rawProbability;
  const probabilityPercent = Math.round(displayProbability * 100);

  // Calculate the difference to show the "wow" moment
  const difference = Math.round((weightedProbability - rawProbability) * 100);
  const differenceSign = difference >= 0 ? "+" : "";

  // Color based on probability
  const getColor = (prob: number) => {
    if (prob >= 0.7) return "text-green-500";
    if (prob >= 0.5) return "text-yellow-500";
    return "text-red-500";
  };

  const sizeClasses = {
    sm: {
      probability: "text-2xl sm:text-3xl",
      label: "text-xs",
    },
    md: {
      probability: "text-4xl sm:text-5xl",
      label: "text-sm",
    },
    lg: {
      probability: "text-5xl sm:text-7xl",
      label: "text-base",
    },
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Probability Display */}
      <div className="relative">
        <span
          className={cn(
            "font-bold tabular-nums transition-all duration-300",
            sizeClasses[size].probability,
            getColor(displayProbability)
          )}
        >
          {probabilityPercent}%
        </span>

        {/* Difference indicator (shows when toggling) */}
        {difference !== 0 && (
          <span
            className={cn(
              "absolute -right-8 sm:-right-12 top-0 sm:top-1 text-xs sm:text-sm font-medium transition-opacity duration-300",
              showWeighted ? "opacity-100" : "opacity-0",
              difference > 0 ? "text-green-400" : "text-red-400"
            )}
          >
            {differenceSign}{difference}%
          </span>
        )}
      </div>

      {/* YES label */}
      <span className="text-muted-foreground text-sm font-medium">YES</span>

      {/* Toggle */}
      <div className="flex items-center gap-2 mt-2">
        <Label
          htmlFor="probability-mode"
          className={cn(
            sizeClasses[size].label,
            !showWeighted ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Raw
        </Label>
        <Switch
          id="probability-mode"
          checked={showWeighted}
          onCheckedChange={setShowWeighted}
        />
        <Label
          htmlFor="probability-mode"
          className={cn(
            sizeClasses[size].label,
            showWeighted ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Weighted
        </Label>
      </div>

      {/* Sub-label explaining the mode */}
      <p className="text-xs text-muted-foreground text-center max-w-[200px]">
        {showWeighted
          ? "Weighted by Ethos credibility scores"
          : "Unweighted aggregate of all predictions"}
      </p>
    </div>
  );
}
