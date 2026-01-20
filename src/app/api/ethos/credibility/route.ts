import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ethosClient } from "@/lib/ethos/client";
import { Database } from "@/types/database";

// Use service role for this endpoint to update user data
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // If no service key, use anon key (development fallback)
  const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient<Database>(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, twitterUsername, twitterId } = body;

    // Validate that at least one identifier is provided
    if (!walletAddress && !twitterUsername && !twitterId) {
      return NextResponse.json(
        { error: "Wallet address, Twitter username, or Twitter ID is required" },
        { status: 400 }
      );
    }

    let ethosData: any = null;
    let userLookupQuery: any = {};

    // Determine which identifier to use and fetch credibility from Ethos
    if (walletAddress) {
      const normalizedAddress = walletAddress.toLowerCase();
      ethosData = await ethosClient.getCredibilityByAddress(normalizedAddress);
      userLookupQuery.wallet_address = normalizedAddress;
    } else if (twitterUsername) {
      ethosData = await ethosClient.getCredibilityBySocialId('x.com', twitterUsername, 'username');
      userLookupQuery.twitter_username = twitterUsername;
    } else if (twitterId) {
      ethosData = await ethosClient.getCredibilityBySocialId('x.com', twitterId, 'id');
      userLookupQuery.twitter_id = twitterId;
    }

    const supabase = getAdminClient();

    // Get current user data for sync log
    let userQuery = supabase.from("users").select("id, ethos_score, ethos_credibility");
    
    // Apply the appropriate filter based on the identifier used
    if (walletAddress) {
      userQuery = userQuery.eq("wallet_address", walletAddress.toLowerCase());
    } else if (twitterUsername) {
      userQuery = userQuery.eq("twitter_username", twitterUsername);
    } else if (twitterId) {
      userQuery = userQuery.eq("twitter_id", twitterId);
    }

    const { data: currentUser } = await userQuery.single();

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update user with Ethos data
    const updateData: Record<string, unknown> = {
      ethos_last_synced_at: new Date().toISOString(),
    };

    if (ethosData) {
      updateData.ethos_profile_id = ethosData.profileId;
      updateData.ethos_score = ethosData.score;
      updateData.ethos_credibility = ethosData.credibility;

      // Initialize RepScore from Ethos score if this is first sync
      if (!currentUser.ethos_score || currentUser.ethos_score === 0) {
        updateData.rep_score = ethosData.score;
      }
    }

    // Update the user with the same filter criteria
    let updateQuery = supabase.from("users").update(updateData);
    
    if (walletAddress) {
      updateQuery = updateQuery.eq("wallet_address", walletAddress.toLowerCase());
    } else if (twitterUsername) {
      updateQuery = updateQuery.eq("twitter_username", twitterUsername);
    } else if (twitterId) {
      updateQuery = updateQuery.eq("twitter_id", twitterId);
    }

    const { data: updatedUser, error: updateError } = await updateQuery
      .select()
      .single();

    if (updateError) {
      console.error("Error updating user:", updateError);
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    // Log the sync
    if (ethosData) {
      await supabase.from("credibility_sync_logs").insert({
        user_id: currentUser.id,
        previous_ethos_score: currentUser.ethos_score,
        new_ethos_score: ethosData.score,
        previous_credibility: currentUser.ethos_credibility,
        new_credibility: ethosData.credibility,
        sync_source: "api_call",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ethosProfileId: updatedUser.ethos_profile_id,
        ethosScore: updatedUser.ethos_score,
        ethosCredibility: updatedUser.ethos_credibility,
        repScore: updatedUser.rep_score,
        tier: updatedUser.tier,
      },
    });
  } catch (error) {
    console.error("Error syncing credibility:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
