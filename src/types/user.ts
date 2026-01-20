import { Tables } from "./database";

export type User = Tables<"users">;

export type CredibilityTier =
  | "UNVERIFIED"
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM";

// User profile with display data
export interface UserProfile {
  id: string;
  walletAddress: string;
  ethosProfileId: number | null;
  ethosScore: number;
  ethosCredibility: number;
  repScore: number;
  tier: CredibilityTier;
  stats: {
    totalPredictions: number;
    correctPredictions: number;
    accuracyRate: number;
    totalStaked: number;
    totalWon: number;
  };
}

// Transform database user to profile
export function toUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    walletAddress: user.wallet_address,
    ethosProfileId: user.ethos_profile_id,
    ethosScore: user.ethos_score ?? 0,
    ethosCredibility: user.ethos_credibility ?? 0,
    repScore: user.rep_score ?? 0,
    tier: (user.tier as CredibilityTier) ?? "UNVERIFIED",
    stats: {
      totalPredictions: user.total_predictions ?? 0,
      correctPredictions: user.correct_predictions ?? 0,
      accuracyRate: user.accuracy_rate ?? 0,
      totalStaked: user.total_staked ?? 0,
      totalWon: user.total_won ?? 0,
    },
  };
}
