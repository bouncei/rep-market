"use client";

import { useMemo } from "react";
import { getTierConfig, TIER_CONFIGS } from "@/constants";
import { CredibilityTier } from "@/types";

export function useCredibility(credibility: number, tier?: CredibilityTier) {
  const tierConfig = useMemo(() => {
    const currentTier = tier ?? getTierFromCredibility(credibility);
    return getTierConfig(currentTier);
  }, [credibility, tier]);

  const progress = useMemo(() => {
    const tiers = Object.values(TIER_CONFIGS);
    const currentIndex = tiers.findIndex((t) => t.name === tierConfig.name);

    if (currentIndex === tiers.length - 1) {
      // Already at max tier
      return 100;
    }

    const nextTier = tiers[currentIndex + 1];
    const prevMin = tierConfig.minCredibility;
    const nextMin = nextTier.minCredibility;
    const range = nextMin - prevMin;

    return Math.min(100, ((credibility - prevMin) / range) * 100);
  }, [credibility, tierConfig]);

  const nextTier = useMemo(() => {
    const tiers = Object.values(TIER_CONFIGS);
    const currentIndex = tiers.findIndex((t) => t.name === tierConfig.name);

    if (currentIndex === tiers.length - 1) {
      return null;
    }

    return tiers[currentIndex + 1];
  }, [tierConfig]);

  const credibilityToNextTier = useMemo(() => {
    if (!nextTier) return 0;
    return Math.max(0, nextTier.minCredibility - credibility);
  }, [credibility, nextTier]);

  return {
    tier: tierConfig,
    progress,
    nextTier,
    credibilityToNextTier,
    maxStake: tierConfig.maxStakePerMarket,
  };
}

function getTierFromCredibility(credibility: number): CredibilityTier {
  if (credibility >= 2000) return "PLATINUM";
  if (credibility >= 1500) return "GOLD";
  if (credibility >= 1000) return "SILVER";
  if (credibility >= 500) return "BRONZE";
  return "UNVERIFIED";
}
