"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { UserProfile, toUserProfile } from "@/types";
import { useCallback, useEffect } from "react";

export function useAuth() {
  const { user, authenticated, ready, login, logout } = usePrivy();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const walletAddress = user?.wallet?.address?.toLowerCase();

  // Fetch user profile from Supabase
  const {
    data: profile,
    isLoading: isLoadingProfile,
    refetch: refetchProfile,
  } = useQuery<UserProfile | null>({
    queryKey: ["user-profile", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return null;

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("wallet_address", walletAddress)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching user profile:", error);
        return null;
      }

      if (!data) return null;

      return toUserProfile(data);
    },
    enabled: !!walletAddress && authenticated,
  });

  // Create or update user profile
  const createOrUpdateProfile = useMutation({
    mutationFn: async () => {
      if (!walletAddress) throw new Error("No wallet address");

      // Check if user exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("wallet_address", walletAddress)
        .single();

      if (existingUser) {
        // User exists, just return
        return existingUser;
      }

      // Create new user
      const { data, error } = await supabase
        .from("users")
        .insert({
          wallet_address: walletAddress,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetchProfile();
    },
  });

  // Sync credibility from Ethos
  const syncCredibility = useMutation({
    mutationFn: async () => {
      if (!walletAddress) throw new Error("No wallet address");

      const response = await fetch("/api/ethos/credibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      if (!response.ok) {
        throw new Error("Failed to sync credibility");
      }

      return response.json();
    },
    onSuccess: () => {
      refetchProfile();
    },
  });

  // Auto-create profile on login
  useEffect(() => {
    if (authenticated && walletAddress && !profile && !isLoadingProfile) {
      createOrUpdateProfile.mutate();
    }
  }, [authenticated, walletAddress, profile, isLoadingProfile]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    await logout();
    queryClient.removeQueries({ queryKey: ["user-profile"] });
  }, [logout, queryClient]);

  return {
    // Auth state
    isAuthenticated: authenticated,
    isReady: ready,
    isLoadingProfile,

    // User data
    user,
    walletAddress,
    profile,

    // Actions
    login,
    logout: handleLogout,
    syncCredibility: syncCredibility.mutate,
    isSyncingCredibility: syncCredibility.isPending,

    // Helpers
    refetchProfile,
  };
}
