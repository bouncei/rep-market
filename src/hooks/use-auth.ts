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

  // Get wallet address if available, or use a derived identifier for social auth
  const walletAddress = user?.wallet?.address?.toLowerCase();
  const userIdentifier = walletAddress || user?.google?.email || user?.twitter?.username || user?.id;

  // Fetch user profile from Supabase
  const {
    data: profile,
    isLoading: isLoadingProfile,
    refetch: refetchProfile,
  } = useQuery<UserProfile | null>({
    queryKey: ["user-profile", userIdentifier],
    queryFn: async () => {
      if (!userIdentifier) return null;

      let query = supabase.from("users").select("*");

      // Build query based on auth method
      if (user?.wallet?.address) {
        query = query.eq("wallet_address", walletAddress);
      } else if (user?.google) {
        query = query.eq("google_id", user.google.sub || user.google.id);
      } else if (user?.twitter) {
        query = query.eq("twitter_id", user.twitter.sub || user.twitter.id);
      } else {
        return null;
      }

      const { data, error } = await query.single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching user profile:", error);
        return null;
      }

      if (!data) return null;

      return toUserProfile(data);
    },
    enabled: !!userIdentifier && authenticated,
  });

  // Create or update user profile
  const createOrUpdateProfile = useMutation({
    mutationFn: async () => {
      if (!userIdentifier) throw new Error("No user identifier");

      // Prepare user data based on auth method
      const userData: any = {};

      if (user?.wallet?.address) {
        userData.wallet_address = walletAddress;
        userData.auth_provider = 'wallet';
      } else if (user?.google) {
        userData.google_id = user.google.sub || user.google.id;
        userData.google_email = user.google.email;
        userData.auth_provider = 'google';
      } else if (user?.twitter) {
        userData.twitter_id = user.twitter.sub || user.twitter.id;
        userData.twitter_username = user.twitter.username;
        userData.auth_provider = 'twitter';
      }

      // Check if user exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .or(`wallet_address.eq.${walletAddress || ''},google_id.eq.${user?.google?.sub || user?.google?.id || ''},twitter_id.eq.${user?.twitter?.sub || user?.twitter?.id || ''}`)
        .single();

      if (existingUser) {
        // User exists, just return
        return existingUser;
      }

      // Create new user
      const { data, error } = await supabase
        .from("users")
        .insert(userData)
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
      let requestBody: any = {};

      // Determine which identifier to use based on auth method
      if (walletAddress) {
        requestBody.walletAddress = walletAddress;
      } else if (user?.twitter?.username) {
        requestBody.twitterUsername = user.twitter.username;
      } else if (user?.twitter?.id || user?.twitter?.sub) {
        requestBody.twitterId = user.twitter.id || user.twitter.sub;
      } else {
        throw new Error("No valid identifier for credibility sync");
      }

      const response = await fetch("/api/ethos/credibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
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
