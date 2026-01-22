"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Market, MarketDisplayData, MarketStatus, OracleType } from "@/types";
import { MarketFilters } from "@/components/markets/market-filters";

// Transform market to display data
function toMarketDisplayData(market: Market): MarketDisplayData {
  return {
    id: market.id,
    title: market.title,
    description: market.description,
    category: market.category,
    status: market.status as MarketStatus | null,
    locksAt: new Date(market.locks_at),
    rawProbabilityYes: market.raw_probability_yes ?? 0.5,
    weightedProbabilityYes: market.weighted_probability_yes ?? 0.5,
    totalStake: (market.total_stake_yes ?? 0) + (market.total_stake_no ?? 0),
    oracleType: market.oracle_type as OracleType,
  };
}

export function useMarkets(status?: MarketStatus | MarketStatus[]) {
  const supabase = createClient();

  return useQuery<MarketDisplayData[]>({
    queryKey: ["markets", status],
    queryFn: async () => {
      let query = supabase.from("markets").select("*").order("locks_at", { ascending: true });

      if (status) {
        if (Array.isArray(status)) {
          query = query.in("status", status);
        } else {
          query = query.eq("status", status);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching markets:", error);
        throw error;
      }

      return (data ?? []).map(toMarketDisplayData);
    },
  });
}

export function useMarket(id: string) {
  const supabase = createClient();

  return useQuery<Market | null>({
    queryKey: ["market", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("markets")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        console.error("Error fetching market:", error);
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });
}

export function useActiveMarkets() {
  return useMarkets(["OPEN", "LOCKED"]);
}

// Helper function to filter markets based on filters
function filterMarkets(markets: MarketDisplayData[], filters: MarketFilters): MarketDisplayData[] {
  return markets.filter(market => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!market.title.toLowerCase().includes(searchLower) && 
          !market.description?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Category filter
    if (filters.categories.length > 0) {
      const marketCategory = market.category?.toLowerCase() || 'crypto';
      if (!filters.categories.includes(marketCategory)) {
        return false;
      }
    }

    // Oracle type filter
    if (filters.oracleTypes.length > 0) {
      if (!filters.oracleTypes.includes(market.oracleType)) {
        return false;
      }
    }

    // Time filter
    if (filters.timeframe !== 'all') {
      const now = new Date();
      const timeDiff = market.locksAt.getTime() - now.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      switch (filters.timeframe) {
        case '24h':
          if (daysDiff > 1) return false;
          break;
        case '7d':
          if (daysDiff > 7) return false;
          break;
        case '30d':
          if (daysDiff > 30) return false;
          break;
        case '90d':
          if (daysDiff > 90) return false;
          break;
      }
    }

    // Stake range filter
    if (filters.stakeRange !== 'all') {
      switch (filters.stakeRange) {
        case 'low':
          if (market.totalStake >= 1000) return false;
          break;
        case 'medium':
          if (market.totalStake < 1000 || market.totalStake >= 5000) return false;
          break;
        case 'high':
          if (market.totalStake < 5000 || market.totalStake >= 10000) return false;
          break;
        case 'whale':
          if (market.totalStake < 10000) return false;
          break;
      }
    }

    // Probability range filter
    if (filters.probabilityRange !== 'all') {
      const probability = market.weightedProbabilityYes * 100;
      switch (filters.probabilityRange) {
        case 'low':
          if (probability >= 25) return false;
          break;
        case 'medium-low':
          if (probability < 25 || probability >= 45) return false;
          break;
        case 'uncertain':
          if (probability < 45 || probability >= 55) return false;
          break;
        case 'medium-high':
          if (probability < 55 || probability >= 75) return false;
          break;
        case 'high':
          if (probability < 75) return false;
          break;
      }
    }

    return true;
  });
}

// Helper function to sort markets
function sortMarkets(markets: MarketDisplayData[], sortBy: string): MarketDisplayData[] {
  const sorted = [...markets];
  
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => b.locksAt.getTime() - a.locksAt.getTime());
    case 'ending-soon':
      return sorted.sort((a, b) => a.locksAt.getTime() - b.locksAt.getTime());
    case 'highest-stake':
      return sorted.sort((a, b) => b.totalStake - a.totalStake);
    case 'most-confident':
      return sorted.sort((a, b) => {
        const aConfidence = Math.abs(a.weightedProbabilityYes - 0.5);
        const bConfidence = Math.abs(b.weightedProbabilityYes - 0.5);
        return bConfidence - aConfidence;
      });
    case 'least-confident':
      return sorted.sort((a, b) => {
        const aConfidence = Math.abs(a.weightedProbabilityYes - 0.5);
        const bConfidence = Math.abs(b.weightedProbabilityYes - 0.5);
        return aConfidence - bConfidence;
      });
    default:
      return sorted;
  }
}

// Enhanced hook for filtered markets
export function useFilteredMarkets(filters: MarketFilters, status?: MarketStatus | MarketStatus[]) {
  const { data: allMarkets, isLoading, error } = useMarkets(status);

  const filteredAndSortedMarkets = allMarkets ? 
    sortMarkets(filterMarkets(allMarkets, filters), filters.sortBy) : 
    [];

  return {
    data: filteredAndSortedMarkets,
    totalCount: allMarkets?.length || 0,
    filteredCount: filteredAndSortedMarkets.length,
    isLoading,
    error
  };
}
