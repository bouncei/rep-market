import { Tables } from "./database";

export type Prediction = Tables<"predictions">;

export type PredictionPosition = "YES" | "NO";

// Prediction with user and market info for display
export interface PredictionWithDetails extends Prediction {
  market?: {
    title: string;
    status: string | null;
    locksAt: string;
    resolutionOutcome: string | null;
  };
  user?: {
    walletAddress: string;
    tier: string | null;
  };
}

// User's prediction summary for a market
export interface UserMarketPrediction {
  marketId: string;
  position: PredictionPosition;
  stakeAmount: number;
  weightedStake: number;
  isSettled: boolean;
  payoutAmount: number | null;
  repScoreDelta: number | null;
  createdAt: Date;
}
