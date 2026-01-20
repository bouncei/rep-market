import { CredibilityTier } from "@/types";

export interface TierConfig {
  name: CredibilityTier;
  displayName: string;
  minCredibility: number;
  maxStakePerMarket: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const TIER_CONFIGS: Record<CredibilityTier, TierConfig> = {
  UNVERIFIED: {
    name: "UNVERIFIED",
    displayName: "Unverified",
    minCredibility: 0,
    maxStakePerMarket: 10,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20",
  },
  BRONZE: {
    name: "BRONZE",
    displayName: "Bronze",
    minCredibility: 500,
    maxStakePerMarket: 50,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  SILVER: {
    name: "SILVER",
    displayName: "Silver",
    minCredibility: 1000,
    maxStakePerMarket: 100,
    color: "text-slate-400",
    bgColor: "bg-slate-400/10",
    borderColor: "border-slate-400/20",
  },
  GOLD: {
    name: "GOLD",
    displayName: "Gold",
    minCredibility: 1500,
    maxStakePerMarket: 250,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
  },
  PLATINUM: {
    name: "PLATINUM",
    displayName: "Platinum",
    minCredibility: 2000,
    maxStakePerMarket: 500,
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
    borderColor: "border-cyan-400/20",
  },
};

export function getTierFromCredibility(credibility: number): CredibilityTier {
  if (credibility >= 2000) return "PLATINUM";
  if (credibility >= 1500) return "GOLD";
  if (credibility >= 1000) return "SILVER";
  if (credibility >= 500) return "BRONZE";
  return "UNVERIFIED";
}

export function getTierConfig(tier: CredibilityTier): TierConfig {
  return TIER_CONFIGS[tier];
}

export function getMaxStakeForTier(tier: CredibilityTier): number {
  return TIER_CONFIGS[tier].maxStakePerMarket;
}
