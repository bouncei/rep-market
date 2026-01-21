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
        query = query.eq("wallet_address", user.wallet.address.toLowerCase());
      } else if (user?.google) {
        query = query.eq("google_id", user.google.subject);
      } else if (user?.twitter) {
        query = query.eq("twitter_id", user.twitter.subject);
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
      const userData: Record<string, string | undefined> = {};

      if (user?.wallet?.address) {
        userData.wallet_address = walletAddress;
        userData.auth_provider = 'wallet';
      } else if (user?.google) {
        userData.google_id = user.google.subject;
        userData.google_email = user.google.email;
        userData.auth_provider = 'google';
      } else if (user?.twitter) {
        userData.twitter_id = user.twitter.subject;
        userData.twitter_username = user.twitter.username ?? undefined;
        userData.auth_provider = 'twitter';
      }

      // Check if user exists
      const googleId = user?.google?.subject || '';
      const twitterId = user?.twitter?.subject || '';

      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .or(`wallet_address.eq.${walletAddress || ''},google_id.eq.${googleId},twitter_id.eq.${twitterId}`)
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
      const requestBody: Record<string, string> = {};

      // Determine which identifier to use based on auth method
      if (walletAddress) {
        requestBody.walletAddress = walletAddress;
      } else if (user?.twitter?.username) {
        requestBody.twitterUsername = user.twitter.username;
      } else if (user?.twitter?.subject) {
        requestBody.twitterId = user.twitter.subject;
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
    if (authenticated && userIdentifier && !profile && !isLoadingProfile) {
      createOrUpdateProfile.mutate();
    }
  }, [authenticated, userIdentifier, profile, isLoadingProfile]);

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
