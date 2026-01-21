"use client";

import { useQuery } from "@tanstack/react-query";

interface RepScoreDataPoint {
  date: string;
  value: number;
}

interface AccuracyDataPoint {
  period: string;
  wins: number;
  losses: number;
  total: number;
  accuracy: number;
}

interface UserStats {
  repScore: number | null;
  ethosCredibility: number | null;
  accuracyRate: number | null;
  totalPredictions: number | null;
  totalWon: number | null;
  totalLost: number | null;
}

interface AnalyticsData {
  user: UserStats;
  repScoreHistory: RepScoreDataPoint[];
  accuracyByPeriod: AccuracyDataPoint[];
}

async function fetchAnalytics(userId: string): Promise<AnalyticsData> {
  const response = await fetch(`/api/analytics?userId=${userId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch analytics");
  }

  return response.json();
}

export function useAnalytics(userId?: string) {
  return useQuery({
    queryKey: ["analytics", userId],
    queryFn: () => fetchAnalytics(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export type { RepScoreDataPoint, AccuracyDataPoint, UserStats, AnalyticsData };
