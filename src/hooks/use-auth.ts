"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { UserProfile, toUserProfile } from "@/types";
import { useCallback, useEffect } from "react";

export function useAuth() {
  const { user, authenticated, ready, login, logout, getAccessToken } = usePrivy();
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
      } else if (user?.twitter?.username) {
        // Query by twitter_username since that's what the API stores
        query = query.eq("twitter_username", user.twitter.username);
      } else if (user?.twitter?.subject) {
        // Fallback to twitter_id if username not available
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

  // Create or update user profile via API (bypasses RLS)
  const createOrUpdateProfile = useMutation({
    mutationFn: async () => {
      if (!userIdentifier) throw new Error("No user identifier");

      // Check if user exists using direct field queries instead of OR
      let existingUser = null;
      
      if (user?.wallet?.address) {
        const { data } = await supabase
          .from("users")
          .select("id")
          .eq("wallet_address", user.wallet.address.toLowerCase())
          .maybeSingle();
        existingUser = data;
      } else if (user?.twitter?.username) {
        // Check by twitter_username since that's what the API stores
        const { data } = await supabase
          .from("users")
          .select("id")
          .eq("twitter_username", user.twitter.username)
          .maybeSingle();
        existingUser = data;
      } else if (user?.twitter?.subject) {
        // Fallback to twitter_id
        const { data } = await supabase
          .from("users")
          .select("id")
          .eq("twitter_id", user.twitter.subject)
          .maybeSingle();
        existingUser = data;
      } else if (user?.google?.subject) {
        const { data } = await supabase
          .from("users")
          .select("id")
          .eq("google_id", user.google.subject)
          .maybeSingle();
        existingUser = data;
      } else {
        throw new Error("No valid auth identifier");
      }

      if (existingUser) {
        // User exists, sync their credibility
        return existingUser;
      }

      // Create new user via API endpoint (which uses service role)
      const requestBody: Record<string, string> = {};

      if (user?.wallet?.address) {
        requestBody.walletAddress = user.wallet.address.toLowerCase();
      } else if (user?.twitter?.username) {
        requestBody.twitterUsername = user.twitter.username;
      } else if (user?.twitter?.subject) {
        requestBody.twitterId = user.twitter.subject;
      }

      // Get Privy access token for authentication
      const accessToken = await getAccessToken();

      const response = await fetch("/api/ethos/credibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to create user:", errorData);
        throw new Error("Failed to create user profile");
      }

      return response.json();
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

      // Get Privy access token for authentication
      const accessToken = await getAccessToken();
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch("/api/ethos/credibility", {
        method: "POST",
        headers,
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
