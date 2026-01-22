"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export type SortBy = "rep_score" | "accuracy_rate" | "ethos_credibility" | "total_won";
export type TimeFrame = "all" | "week" | "month";

export interface LeaderboardUser {
  id: string;
  wallet_address: string | null;
  twitter_username: string | null;
  rep_score: number;
  ethos_credibility: number;
  tier: string;
  total_predictions: number;
  correct_predictions: number;
  accuracy_rate: number;
  total_staked: number;
  total_won: number;
  rank: number;
}

interface LeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardUser[];
  userRank: LeaderboardUser | null;
  stats: {
    totalRankedUsers: number;
    sortBy: SortBy;
    timeFrame: TimeFrame;
  };
}

export function useLeaderboard(sortBy: SortBy = "rep_score", timeFrame: TimeFrame = "all") {
  const { profile } = useAuth();

  return useQuery<LeaderboardResponse>({
    queryKey: ["leaderboard", sortBy, timeFrame, profile?.id],
    queryFn: async () => {
      const params = new URLSearchParams({
        sortBy,
        timeFrame,
        limit: "50",
      });

      if (profile?.id) {
        params.append("userId", profile.id);
      }

      const response = await fetch(`/api/leaderboard?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });
}

// Get display name for a leaderboard user
export function getDisplayName(user: LeaderboardUser): string {
  if (user.twitter_username) {
    return `@${user.twitter_username}`;
  }
  if (user.wallet_address) {
    return `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`;
  }
  return "Anonymous";
}

// Get initials for avatar
export function getInitials(user: LeaderboardUser): string {
  if (user.twitter_username) {
    return user.twitter_username.slice(0, 2).toUpperCase();
  }
  if (user.wallet_address) {
    return user.wallet_address.slice(2, 4).toUpperCase();
  }
  return "??";
}
