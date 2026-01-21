"use client";

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

type TableName = "markets" | "predictions" | "users";

interface RealtimeConfig {
  table: TableName;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
  onInsert?: (payload: unknown) => void;
  onUpdate?: (payload: unknown) => void;
  onDelete?: (payload: unknown) => void;
}

interface PostgresChangePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

/**
 * Hook for subscribing to Supabase real-time changes
 */
export function useRealtimeSubscription(config: RealtimeConfig) {
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel(`${config.table}-changes`);

    // Use type assertion for the postgres_changes subscription
    (channel as unknown as {
      on: (
        type: string,
        opts: { event: string; schema: string; table: string; filter?: string },
        callback: (payload: PostgresChangePayload) => void
      ) => typeof channel;
    }).on(
      "postgres_changes",
      {
        event: config.event ?? "*",
        schema: "public",
        table: config.table,
        filter: config.filter,
      },
      (payload: PostgresChangePayload) => {
        if (payload.eventType === "INSERT" && config.onInsert) {
          config.onInsert(payload);
        }
        if (payload.eventType === "UPDATE" && config.onUpdate) {
          config.onUpdate(payload);
        }
        if (payload.eventType === "DELETE" && config.onDelete) {
          config.onDelete(payload);
        }
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [config.table, config.event, config.filter, config.onInsert, config.onUpdate, config.onDelete, supabase]);
}

/**
 * Hook for auto-refreshing market data when predictions are made
 */
export function useMarketRealtimeUpdates(marketId?: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const invalidateMarketQueries = useCallback(() => {
    if (marketId) {
      queryClient.invalidateQueries({ queryKey: ["market", marketId] });
    }
    queryClient.invalidateQueries({ queryKey: ["markets"] });
  }, [queryClient, marketId]);

  useEffect(() => {
    const channelName = marketId
      ? `market-${marketId}-predictions`
      : "all-predictions";

    const channel = supabase.channel(channelName);

    // Subscribe to predictions changes
    (channel as unknown as {
      on: (
        type: string,
        opts: { event: string; schema: string; table: string; filter?: string },
        callback: () => void
      ) => typeof channel;
    }).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "predictions",
        ...(marketId && { filter: `market_id=eq.${marketId}` }),
      },
      () => {
        invalidateMarketQueries();
      }
    );

    // Subscribe to market updates
    (channel as unknown as {
      on: (
        type: string,
        opts: { event: string; schema: string; table: string; filter?: string },
        callback: () => void
      ) => typeof channel;
    }).on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "markets",
        ...(marketId && { filter: `id=eq.${marketId}` }),
      },
      () => {
        invalidateMarketQueries();
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [marketId, supabase, invalidateMarketQueries]);
}

/**
 * Hook for auto-refreshing leaderboard when user stats change
 */
export function useLeaderboardRealtimeUpdates() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel("leaderboard-updates");

    (channel as unknown as {
      on: (
        type: string,
        opts: { event: string; schema: string; table: string },
        callback: () => void
      ) => typeof channel;
    }).on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "users",
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);
}

/**
 * Hook for user profile real-time updates
 */
export function useUserRealtimeUpdates(userId?: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(`user-${userId}-updates`);

    (channel as unknown as {
      on: (
        type: string,
        opts: { event: string; schema: string; table: string; filter?: string },
        callback: () => void
      ) => typeof channel;
    }).on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "users",
        filter: `id=eq.${userId}`,
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      }
    );

    (channel as unknown as {
      on: (
        type: string,
        opts: { event: string; schema: string; table: string; filter?: string },
        callback: () => void
      ) => typeof channel;
    }).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "predictions",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ["predictions", userId] });
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, queryClient]);
}
