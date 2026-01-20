"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Market, MarketDisplayData, MarketStatus, OracleType } from "@/types";

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
