"use client";

import { useMemo } from "react";
import { getTierConfig, getTierFromCredibility, TIER_ORDER, TIER_CONFIGS } from "@/constants";
import { CredibilityTier } from "@/types";

export function useCredibility(credibility: number, tier?: CredibilityTier) {
  const tierConfig = useMemo(() => {
    const currentTier = tier ?? getTierFromCredibility(credibility);
    return getTierConfig(currentTier);
  }, [credibility, tier]);

  const progress = useMemo(() => {
    const currentIndex = TIER_ORDER.indexOf(tierConfig.name);

    if (currentIndex === TIER_ORDER.length - 1) {
      // Already at max tier (RENOWNED)
      return 100;
    }

    const nextTierName = TIER_ORDER[currentIndex + 1];
    const nextTierConfig = TIER_CONFIGS[nextTierName];
    const prevMin = tierConfig.minCredibility;
    const nextMin = nextTierConfig.minCredibility;
    const range = nextMin - prevMin;

    return Math.min(100, Math.max(0, ((credibility - prevMin) / range) * 100));
  }, [credibility, tierConfig]);

  const nextTier = useMemo(() => {
    const currentIndex = TIER_ORDER.indexOf(tierConfig.name);

    if (currentIndex === TIER_ORDER.length - 1) {
      return null;
    }

    return TIER_CONFIGS[TIER_ORDER[currentIndex + 1]];
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
