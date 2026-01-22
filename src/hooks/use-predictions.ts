"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./use-auth";

export interface Prediction {
  id: string;
  marketId: string;
  position: "YES" | "NO";
  stakeAmount: number;
  weightedStake: number;
  credibilityAtPrediction: number;
  isSettled: boolean;
  payoutAmount: number | null;
  repScoreDelta: number | null;
  createdAt: string;
  settledAt: string | null;
  market?: {
    id: string;
    title: string;
    status: string;
    locks_at: string;
    raw_probability_yes: number;
    weighted_probability_yes: number;
  };
}

interface PlacePredictionInput {
  marketId: string;
  position: "YES" | "NO";
  stakeAmount: number;
}

interface PlacePredictionResult {
  success: boolean;
  prediction: Prediction;
  marketUpdates?: {
    rawProbabilityYes: number;
    weightedProbabilityYes: number;
    totalStakeYes: number;
    totalStakeNo: number;
  };
}

interface SellPredictionResult {
  success: boolean;
  sale: {
    predictionId: string;
    originalStake: number;
    position: "YES" | "NO";
    sellValue: {
      baseValue: number;
      priceImpact: number;
      fee: number;
      netValue: number;
      effectiveSlippagePercent?: number;
    };
    profitLoss: {
      amount: number;
      percent: number;
    };
    repScoreDelta: number;
  };
  marketUpdates?: {
    rawProbabilityYes: number;
    weightedProbabilityYes: number;
    totalStakeYes: number;
    totalStakeNo: number;
  };
}

export interface SellPreview {
  predictionId: string;
  position: "YES" | "NO";
  originalStake: number;
  currentProbability: number;
  sellValue: {
    baseValue: number;
    priceImpact: number;
    fee: number;
    netValue: number;
    effectiveSlippagePercent?: number;
  };
  profitLoss: {
    amount: number;
    percent: number;
  };
  canSell: boolean;
  marketStatus: string;
  warning?: string | null;
}

export function usePredictions(marketId?: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's predictions
  const {
    data: predictions,
    isLoading,
    error,
    refetch: refetchPredictions,
  } = useQuery<Prediction[]>({
    queryKey: ["predictions", profile?.id, marketId],
    queryFn: async () => {
      if (!profile?.id) return [];

      const params = new URLSearchParams();
      params.append("userId", profile.id);
      if (marketId) {
        params.append("marketId", marketId);
      }

      const response = await fetch(`/api/predictions?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch predictions");
      }

      const data = await response.json();
      return data.predictions;
    },
    enabled: !!profile?.id,
  });

  // Get sell preview for a prediction
  const getSellPreview = async (predictionId: string): Promise<SellPreview> => {
    const response = await fetch(`/api/predictions/${predictionId}/sell`);
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to get sell preview");
    }
    const data = await response.json();
    return data.preview;
  };

  // Sell a prediction
  const sellPrediction = useMutation<SellPredictionResult, Error, string>({
    mutationFn: async (predictionId: string) => {
      if (!profile?.id) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(`/api/predictions/${predictionId}/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sell prediction");
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate predictions query to refetch
      queryClient.invalidateQueries({
        queryKey: ["predictions", profile?.id],
      });

      // Invalidate user profile to update rep_score
      queryClient.invalidateQueries({
        queryKey: ["user-profile"],
      });

      // Update markets list
      queryClient.invalidateQueries({ queryKey: ["markets"] });
    },
  });

  // Place a new prediction
  const placePrediction = useMutation<PlacePredictionResult, Error, PlacePredictionInput>({
    mutationFn: async ({ marketId, position, stakeAmount }) => {
      if (!profile?.id) {
        throw new Error("User not authenticated");
      }

      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId,
          userId: profile.id,
          position,
          stakeAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to place prediction");
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate predictions query to refetch
      queryClient.invalidateQueries({
        queryKey: ["predictions", profile?.id],
      });

      // Update market cache with new probabilities
      if (data.marketUpdates) {
        queryClient.setQueryData(["market", variables.marketId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            raw_probability_yes: data.marketUpdates!.rawProbabilityYes,
            weighted_probability_yes: data.marketUpdates!.weightedProbabilityYes,
            total_stake_yes: data.marketUpdates!.totalStakeYes,
            total_stake_no: data.marketUpdates!.totalStakeNo,
          };
        });

        // Also invalidate markets list
        queryClient.invalidateQueries({ queryKey: ["markets"] });
      }
    },
  });

  // Calculate total stake for a specific market
  const getMarketStake = (targetMarketId: string): number => {
    if (!predictions) return 0;
    return predictions
      .filter((p) => p.marketId === targetMarketId)
      .reduce((sum, p) => sum + p.stakeAmount, 0);
  };

  // Get predictions for a specific market
  const getMarketPredictions = (targetMarketId: string): Prediction[] => {
    if (!predictions) return [];
    return predictions.filter((p) => p.marketId === targetMarketId);
  };

  // Calculate portfolio stats
  const portfolioStats = predictions ? {
    totalPredictions: predictions.length,
    activePredictions: predictions.filter((p) => !p.isSettled).length,
    settledPredictions: predictions.filter((p) => p.isSettled).length,
    totalStaked: predictions.reduce((sum, p) => sum + p.stakeAmount, 0),
    totalWeightedStake: predictions.reduce((sum, p) => sum + p.weightedStake, 0),
    totalWon: predictions
      .filter((p) => p.isSettled && p.payoutAmount !== null && p.payoutAmount > 0)
      .reduce((sum, p) => sum + (p.payoutAmount ?? 0), 0),
    netRepScoreDelta: predictions
      .filter((p) => p.isSettled)
      .reduce((sum, p) => sum + (p.repScoreDelta ?? 0), 0),
  } : null;

  return {
    predictions,
    isLoading,
    error,
    refetchPredictions,
    placePrediction,
    sellPrediction,
    getSellPreview,
    getMarketStake,
    getMarketPredictions,
    portfolioStats,
    isPlacingPrediction: placePrediction.isPending,
    isSellingPrediction: sellPrediction.isPending,
  };
}

// Hook for fetching all predictions on a specific market (not just user's)
export function useMarketPredictions(marketId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["market-predictions", marketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predictions")
        .select(`
          id,
          position,
          stake_amount,
          weighted_stake,
          created_at,
          user:users(id, wallet_address, tier, twitter_username)
        `)
        .eq("market_id", marketId)
        .order("weighted_stake", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!marketId,
  });
}
