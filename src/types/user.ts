import { Tables } from "./database";

export type User = Tables<"users">;

export type CredibilityTier =
  | "UNTRUSTED"
  | "QUESTIONABLE"
  | "NEUTRAL"
  | "KNOWN"
  | "ESTABLISHED"
  | "REPUTABLE"
  | "EXEMPLARY"
  | "DISTINGUISHED"
  | "REVERED"
  | "RENOWNED";

// Auth provider type
export type AuthProvider = "wallet" | "twitter" | "google";

// User profile with display data
export interface UserProfile {
  id: string;
  walletAddress: string | null;
  authProvider: AuthProvider;
  twitterId: string | null;
  twitterUsername: string | null;
  googleId: string | null;
  googleEmail: string | null;
  ethosProfileId: number | null;
  ethosScore: number;
  ethosCredibility: number;
  repScore: number;
  lockedRepScore: number;
  availableRepScore: number;
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
  const repScore = user.rep_score ?? 0;
  const lockedRepScore = user.locked_rep_score ?? 0;

  return {
    id: user.id,
    walletAddress: user.wallet_address,
    authProvider: (user.auth_provider as AuthProvider) ?? "wallet",
    twitterId: user.twitter_id,
    twitterUsername: user.twitter_username,
    googleId: user.google_id,
    googleEmail: user.google_email,
    ethosProfileId: user.ethos_profile_id,
    ethosScore: user.ethos_score ?? 0,
    ethosCredibility: user.ethos_credibility ?? 0,
    repScore,
    lockedRepScore,
    availableRepScore: repScore - lockedRepScore,
    tier: (user.tier as CredibilityTier) ?? "UNTRUSTED",
    stats: {
      totalPredictions: user.total_predictions ?? 0,
      correctPredictions: user.correct_predictions ?? 0,
      accuracyRate: user.accuracy_rate ?? 0,
      totalStaked: user.total_staked ?? 0,
      totalWon: user.total_won ?? 0,
    },
  };
}
