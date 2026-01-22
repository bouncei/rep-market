import { CredibilityTier } from "@/types";

export interface TierConfig {
  name: CredibilityTier;
  displayName: string;
  minCredibility: number;
  maxStakePerMarket: number;
  color: string;
  bgColor: string;
  borderColor: string;
  hexColor: string;
}

// New 10-tier system with colors and stake caps from the spec
export const TIER_CONFIGS: Record<CredibilityTier, TierConfig> = {
  UNTRUSTED: {
    name: "UNTRUSTED",
    displayName: "Untrusted",
    minCredibility: 0,
    maxStakePerMarket: 10,
    color: "text-red-600",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    hexColor: "#B0303A",
  },
  QUESTIONABLE: {
    name: "QUESTIONABLE",
    displayName: "Questionable",
    minCredibility: 800,
    maxStakePerMarket: 20,
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    hexColor: "#D4A21A",
  },
  NEUTRAL: {
    name: "NEUTRAL",
    displayName: "Neutral",
    minCredibility: 1200,
    maxStakePerMarket: 40,
    color: "text-stone-500",
    bgColor: "bg-stone-400/10",
    borderColor: "border-stone-400/20",
    hexColor: "#E6E1D6",
  },
  KNOWN: {
    name: "KNOWN",
    displayName: "Known",
    minCredibility: 1400,
    maxStakePerMarket: 70,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/20",
    hexColor: "#9FB6D9",
  },
  ESTABLISHED: {
    name: "ESTABLISHED",
    displayName: "Established",
    minCredibility: 1600,
    maxStakePerMarket: 100,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    hexColor: "#5FA0D8",
  },
  REPUTABLE: {
    name: "REPUTABLE",
    displayName: "Reputable",
    minCredibility: 1800,
    maxStakePerMarket: 150,
    color: "text-teal-600",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
    hexColor: "#4F8F8B",
  },
  EXEMPLARY: {
    name: "EXEMPLARY",
    displayName: "Exemplary",
    minCredibility: 2000,
    maxStakePerMarket: 200,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    hexColor: "#4E8F5A",
  },
  DISTINGUISHED: {
    name: "DISTINGUISHED",
    displayName: "Distinguished",
    minCredibility: 2200,
    maxStakePerMarket: 300,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    hexColor: "#2FA34A",
  },
  REVERED: {
    name: "REVERED",
    displayName: "Revered",
    minCredibility: 2400,
    maxStakePerMarket: 400,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400/20",
    hexColor: "#9A8CCB",
  },
  RENOWNED: {
    name: "RENOWNED",
    displayName: "Renowned",
    minCredibility: 2600,
    maxStakePerMarket: 500,
    color: "text-purple-600",
    bgColor: "bg-purple-600/10",
    borderColor: "border-purple-600/20",
    hexColor: "#7B5AA6",
  },
};

// Ordered list of tiers for progression calculation
export const TIER_ORDER: CredibilityTier[] = [
  "UNTRUSTED",
  "QUESTIONABLE",
  "NEUTRAL",
  "KNOWN",
  "ESTABLISHED",
  "REPUTABLE",
  "EXEMPLARY",
  "DISTINGUISHED",
  "REVERED",
  "RENOWNED",
];

export function getTierFromCredibility(credibility: number): CredibilityTier {
  if (credibility >= 2600) return "RENOWNED";
  if (credibility >= 2400) return "REVERED";
  if (credibility >= 2200) return "DISTINGUISHED";
  if (credibility >= 2000) return "EXEMPLARY";
  if (credibility >= 1800) return "REPUTABLE";
  if (credibility >= 1600) return "ESTABLISHED";
  if (credibility >= 1400) return "KNOWN";
  if (credibility >= 1200) return "NEUTRAL";
  if (credibility >= 800) return "QUESTIONABLE";
  return "UNTRUSTED";
}

export function getTierConfig(tier: CredibilityTier): TierConfig {
  return TIER_CONFIGS[tier];
}

export function getMaxStakeForTier(tier: CredibilityTier): number {
  return TIER_CONFIGS[tier].maxStakePerMarket;
}

export function getNextTier(tier: CredibilityTier): TierConfig | null {
  const currentIndex = TIER_ORDER.indexOf(tier);
  if (currentIndex === -1 || currentIndex === TIER_ORDER.length - 1) {
    return null;
  }
  return TIER_CONFIGS[TIER_ORDER[currentIndex + 1]];
}
