"use client";

import { Badge } from "@/components/ui/badge";
import { useCredibility } from "@/hooks";
import { CredibilityTier } from "@/types";
import { cn } from "@/lib/utils";
import {
  Shield,
  AlertTriangle,
  CircleDot,
  User,
  Briefcase,
  Star,
  Award,
  Medal,
  Crown,
  Gem,
} from "lucide-react";

interface CredibilityBadgeProps {
  credibility: number;
  tier?: CredibilityTier;
  showProgress?: boolean;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Icons for the new 10-tier system
const tierIcons: Record<CredibilityTier, React.ElementType> = {
  UNTRUSTED: Shield,
  QUESTIONABLE: AlertTriangle,
  NEUTRAL: CircleDot,
  KNOWN: User,
  ESTABLISHED: Briefcase,
  REPUTABLE: Star,
  EXEMPLARY: Award,
  DISTINGUISHED: Medal,
  REVERED: Crown,
  RENOWNED: Gem,
};

export function CredibilityBadge({
  credibility,
  tier: providedTier,
  showProgress = false,
  showIcon = true,
  size = "md",
  className,
}: CredibilityBadgeProps) {
  const {
    tier,
    progress,
    nextTier,
    credibilityToNextTier,
  } = useCredibility(credibility, providedTier);

  const Icon = tierIcons[tier.name];

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Badge
        variant="outline"
        className={cn(
          tier.bgColor,
          tier.color,
          tier.borderColor,
          sizeClasses[size],
          "inline-flex items-center gap-1.5"
        )}
      >
        {showIcon && <Icon className={iconSizes[size]} />}
        <span className="font-semibold">{tier.displayName}</span>
      </Badge>

      {showProgress && nextTier && (
        <div className="flex flex-col gap-1">
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all duration-500", tier.bgColor.replace("/10", ""))}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {credibilityToNextTier.toFixed(0)} more to {nextTier.displayName}
          </p>
        </div>
      )}
    </div>
  );
}
