import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ethosClient } from "@/lib/ethos/client";
import { Database } from "@/types/database";
import { getTierFromCredibility } from "@/constants/tiers";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key);
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION_MS = 5 * 60 * 1000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const supabase = getAdminClient();

    // Fetch user from database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, wallet_address, twitter_username, twitter_id, ethos_score, ethos_credibility, ethos_profile_id, ethos_last_synced_at, tier")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if we have recent cached data (within 5 minutes)
    const lastSynced = user.ethos_last_synced_at ? new Date(user.ethos_last_synced_at) : null;
    const isStale = !lastSynced || (Date.now() - lastSynced.getTime() > CACHE_DURATION_MS);

    // If data is fresh, return cached data
    if (!isStale && user.ethos_score !== null) {
      return NextResponse.json({
        success: true,
        data: {
          userId: user.id,
          ethosProfileId: user.ethos_profile_id,
          ethosScore: user.ethos_score,
          ethosCredibility: user.ethos_credibility,
          tier: user.tier || getTierFromCredibility(user.ethos_credibility ?? 0),
          lastSyncedAt: user.ethos_last_synced_at,
          cached: true,
        },
      });
    }

    // Need to fetch fresh data from Ethos
    let ethosData = null;

    // Try wallet address first, then twitter username, then twitter id
    if (user.wallet_address) {
      ethosData = await ethosClient.getCredibilityByAddress(user.wallet_address);
    }

    if (!ethosData && user.twitter_username) {
      ethosData = await ethosClient.getCredibilityBySocialId('x.com', user.twitter_username, 'username');
    }

    if (!ethosData && user.twitter_id) {
      ethosData = await ethosClient.getCredibilityBySocialId('x.com', user.twitter_id, 'id');
    }

    // If no Ethos data found, return existing data or defaults
    if (!ethosData) {
      return NextResponse.json({
        success: true,
        data: {
          userId: user.id,
          ethosProfileId: user.ethos_profile_id,
          ethosScore: user.ethos_score ?? 0,
          ethosCredibility: user.ethos_credibility ?? 0,
          tier: user.tier || getTierFromCredibility(user.ethos_credibility ?? 0),
          lastSyncedAt: user.ethos_last_synced_at,
          cached: true,
          ethosNotFound: true,
        },
      });
    }

    // Update user with fresh Ethos data
    const newTier = getTierFromCredibility(ethosData.credibility);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        ethos_profile_id: ethosData.profileId,
        ethos_score: ethosData.score,
        ethos_credibility: ethosData.credibility,
        tier: newTier,
        ethos_last_synced_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating user Ethos data:", updateError);
      // Return fetched data even if update fails
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        ethosProfileId: ethosData.profileId,
        ethosScore: ethosData.score,
        ethosCredibility: ethosData.credibility,
        tier: newTier,
        lastSyncedAt: new Date().toISOString(),
        cached: false,
      },
    });
  } catch (error) {
    console.error("Error fetching user Ethos data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
