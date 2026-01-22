import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { getTierFromCredibility } from "@/constants/tiers";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key);
}

type SortBy = "rep_score" | "accuracy_rate" | "ethos_credibility" | "total_won";
type TimeFrame = "all" | "week" | "month";

interface LeaderboardUser {
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = (searchParams.get("sortBy") as SortBy) || "rep_score";
    const timeFrame = (searchParams.get("timeFrame") as TimeFrame) || "all";
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
    const userId = searchParams.get("userId"); // To highlight current user

    const supabase = getClient();

    // Build the query
    let query = supabase
      .from("users")
      .select(
        "id, wallet_address, twitter_username, rep_score, ethos_credibility, tier, total_predictions, correct_predictions, accuracy_rate, total_staked, total_won, created_at"
      )
      .gt("total_predictions", 0);

    // Apply time filter based on user creation (for "new users this period")
    // Note: For true time-based stats, we'd need to aggregate from predictions table
    if (timeFrame === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      // For now, just filter users active in last week
      // In production, aggregate from predictions
    } else if (timeFrame === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
    }

    // Sort and limit
    const validSortFields: SortBy[] = ["rep_score", "accuracy_rate", "ethos_credibility", "total_won"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "rep_score";

    const { data: users, error } = await query
      .order(sortField, { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Leaderboard query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch leaderboard" },
        { status: 500 }
      );
    }

    // Add ranks and format response
    const rankedUsers: LeaderboardUser[] = (users || []).map((user, index) => ({
      id: user.id,
      wallet_address: user.wallet_address,
      twitter_username: user.twitter_username,
      rep_score: user.rep_score ?? 0,
      ethos_credibility: user.ethos_credibility ?? 0,
      tier: user.tier ?? getTierFromCredibility(user.ethos_credibility ?? 0),
      total_predictions: user.total_predictions ?? 0,
      correct_predictions: user.correct_predictions ?? 0,
      accuracy_rate: user.accuracy_rate ?? 0,
      total_staked: user.total_staked ?? 0,
      total_won: user.total_won ?? 0,
      rank: index + 1,
    }));

    // Find current user's rank if provided
    let userRank: LeaderboardUser | null = null;
    if (userId) {
      const userInList = rankedUsers.find((u) => u.id === userId);
      if (userInList) {
        userRank = userInList;
      } else {
        // User not in top list, fetch their data separately
        const { data: userData } = await supabase
          .from("users")
          .select(
            "id, wallet_address, twitter_username, rep_score, ethos_credibility, tier, total_predictions, correct_predictions, accuracy_rate, total_staked, total_won"
          )
          .eq("id", userId)
          .single();

        if (userData && (userData.total_predictions ?? 0) > 0) {
          // Count users with higher score to determine rank
          const { count } = await supabase
            .from("users")
            .select("id", { count: "exact", head: true })
            .gt("total_predictions", 0)
            .gt(sortField, userData[sortField] ?? 0);

          userRank = {
            id: userData.id,
            wallet_address: userData.wallet_address,
            twitter_username: userData.twitter_username,
            rep_score: userData.rep_score ?? 0,
            ethos_credibility: userData.ethos_credibility ?? 0,
            tier: userData.tier ?? getTierFromCredibility(userData.ethos_credibility ?? 0),
            total_predictions: userData.total_predictions ?? 0,
            correct_predictions: userData.correct_predictions ?? 0,
            accuracy_rate: userData.accuracy_rate ?? 0,
            total_staked: userData.total_staked ?? 0,
            total_won: userData.total_won ?? 0,
            rank: (count ?? 0) + 1,
          };
        }
      }
    }

    // Calculate global stats
    const { count: totalUsers } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .gt("total_predictions", 0);

    return NextResponse.json({
      success: true,
      leaderboard: rankedUsers,
      userRank,
      stats: {
        totalRankedUsers: totalUsers ?? 0,
        sortBy: sortField,
        timeFrame,
      },
    });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
