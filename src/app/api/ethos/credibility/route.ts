import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ethosClient, EthosClient } from "@/lib/ethos/client";
import { Database } from "@/types/database";

// Use service role for this endpoint to update user data
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    console.warn('[WARN] SUPABASE_SERVICE_ROLE_KEY not set - using anon key (RLS will apply)');
  }

  // Service role key bypasses RLS - required for user creation
  const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Extract Privy token from Authorization header
    const authHeader = request.headers.get('authorization');
    const privyToken = authHeader?.replace('Bearer ', '');

    const body = await request.json();
    const { walletAddress, twitterUsername, twitterId } = body;

    // Validate that at least one identifier is provided
    if (!walletAddress && !twitterUsername && !twitterId) {
      return NextResponse.json(
        { error: "Wallet address, Twitter username, or Twitter ID is required" },
        { status: 400 }
      );
    }

    // Create EthosClient with the Privy token if available
    const authenticatedEthosClient = privyToken ? new EthosClient(privyToken) : ethosClient;

    let ethosData: any = null;
    let userLookupQuery: any = {};

    // Determine which identifier to use and fetch credibility from Ethos
    if (walletAddress) {
      const normalizedAddress = walletAddress.toLowerCase();
      ethosData = await authenticatedEthosClient.getCredibilityByAddress(normalizedAddress);
      userLookupQuery.wallet_address = normalizedAddress;
    } else if (twitterUsername) {
      console.log('[DEBUG] fetching ethos data for twitter username', twitterUsername);
      ethosData = await authenticatedEthosClient.getCredibilityBySocialId('x.com', twitterUsername, 'username');
      userLookupQuery.twitter_username = twitterUsername;
    } else if (twitterId) {
      ethosData = await authenticatedEthosClient.getCredibilityBySocialId('x.com', twitterId, 'id');
      userLookupQuery.twitter_id = twitterId;
    }


    console.log('[DEBUG] ethos data', ethosData);
    console.log('[DEBUG] user lookup query', userLookupQuery);
    
    if (ethosData) {
      console.log('[DEBUG] Ethos API call successful, user found:', ethosData);
    } else {
      console.log('[DEBUG] Ethos API call returned null - user not found in Ethos');
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

    let { data: currentUser, error: userQueryError } = await userQuery.single();

    console.log('[DEBUG] Database query result:', { currentUser, userQueryError });

    // If user doesn't exist, create them
    if (!currentUser) {
      console.log('[DEBUG] User not found, creating new user');
      
      const newUserData: Record<string, unknown> = {
        auth_provider: twitterUsername || twitterId ? 'twitter' : 'wallet',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (walletAddress) {
        newUserData.wallet_address = walletAddress.toLowerCase();
      }
      if (twitterUsername) {
        newUserData.twitter_username = twitterUsername;
      }
      if (twitterId) {
        newUserData.twitter_id = twitterId;
      }

      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert(newUserData)
        .select()
        .single();

      if (createError) {
        // Handle race condition: if duplicate key error, user was created by concurrent request
        if (createError.code === '23505') {
          console.log('[DEBUG] Duplicate key - user was created by concurrent request, retrying lookup');
          // Rebuild query since it was already consumed
          let retryQuery = supabase.from("users").select("id, ethos_score, ethos_credibility");
          if (walletAddress) {
            retryQuery = retryQuery.eq("wallet_address", walletAddress.toLowerCase());
          } else if (twitterUsername) {
            retryQuery = retryQuery.eq("twitter_username", twitterUsername);
          } else if (twitterId) {
            retryQuery = retryQuery.eq("twitter_id", twitterId);
          }
          const { data: existingUser } = await retryQuery.single();
          if (existingUser) {
            currentUser = existingUser;
          } else {
            console.error("Error creating user (duplicate) but couldn't find existing:", createError);
            return NextResponse.json(
              { error: "Failed to create user" },
              { status: 500 }
            );
          }
        } else {
          console.error("Error creating user:", createError);
          return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
          );
        }
      } else {
        console.log('[DEBUG] Created new user:', newUser);
        // Use the newly created user for the rest of the process
        currentUser = newUser;
      }
    }

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found and could not be created" },
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
