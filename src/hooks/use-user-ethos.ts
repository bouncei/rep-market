"use client";

import { useQuery } from "@tanstack/react-query";
import { CredibilityTier } from "@/types/user";

export interface UserEthosData {
  userId: string;
  ethosProfileId: number | null;
  ethosScore: number;
  ethosCredibility: number;
  tier: CredibilityTier;
  lastSyncedAt: string | null;
  cached: boolean;
  ethosNotFound?: boolean;
}

/**
 * Hook to fetch Ethos data for any user
 * Data is cached for 5 minutes on the backend
 */
export function useUserEthos(userId: string | null | undefined) {
  return useQuery<UserEthosData>({
    queryKey: ["user-ethos", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      const response = await fetch(`/api/users/${userId}/ethos`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch user Ethos data");
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!userId,
    // Client-side cache for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Keep in cache for 10 minutes
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch Ethos data for multiple users in parallel
 * Useful for leaderboards and user lists
 */
export function useMultipleUserEthos(userIds: string[]) {
  return useQuery<Map<string, UserEthosData>>({
    queryKey: ["user-ethos-batch", userIds.sort().join(",")],
    queryFn: async () => {
      if (!userIds.length) return new Map();

      // Fetch all users in parallel
      const results = await Promise.allSettled(
        userIds.map(async (userId) => {
          const response = await fetch(`/api/users/${userId}/ethos`);
          if (!response.ok) {
            throw new Error("Failed to fetch");
          }
          const data = await response.json();
          return { userId, data: data.data as UserEthosData };
        })
      );

      // Build result map
      const resultMap = new Map<string, UserEthosData>();
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          resultMap.set(result.value.userId, result.value.data);
        }
      });

      return resultMap;
    },
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
