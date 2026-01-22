import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { CredibilityTier } from "@/types/user";
import { getMaxStakeForTier, getTierFromCredibility } from "@/constants/tiers";
import { z } from "zod";

// Use service role for this endpoint to update market data
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key);
}

// Request validation schema
const placePredictionSchema = z.object({
  marketId: z.string().uuid(),
  userId: z.string().uuid(),
  position: z.enum(["YES", "NO"]),
  stakeAmount: z.number().positive().max(500), // Max possible stake
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const parseResult = placePredictionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { marketId, userId, position, stakeAmount } = parseResult.data;
    const supabase = getAdminClient();

    // Fetch user to validate tier, credibility, and available RepScore
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, tier, ethos_credibility, rep_score, locked_rep_score")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Calculate tier from credibility (in case tier field isn't updated)
    const userCredibility = user.ethos_credibility ?? 0;
    const effectiveTier = (user.tier as CredibilityTier) || getTierFromCredibility(userCredibility);
    const maxStake = getMaxStakeForTier(effectiveTier);

    // Block UNTRUSTED tier from trading
    if (effectiveTier === "UNTRUSTED") {
      return NextResponse.json(
        {
          error: "Trading restricted",
          message: "Your Ethos credibility is below 800. Build your reputation on Ethos Network to unlock trading.",
          details: { tier: effectiveTier, credibility: userCredibility, requiredCredibility: 800 }
        },
        { status: 403 }
      );
    }

    // Check available RepScore (total - locked)
    const totalRepScore = user.rep_score ?? 0;
    const lockedRepScore = user.locked_rep_score ?? 0;
    const availableRepScore = totalRepScore - lockedRepScore;

    if (stakeAmount > availableRepScore) {
      return NextResponse.json(
        {
          error: "Insufficient available RepScore",
          details: {
            totalRepScore,
            lockedRepScore,
            availableRepScore,
            requestedStake: stakeAmount,
          }
        },
        { status: 400 }
      );
    }

    // Check stake cap
    if (stakeAmount > maxStake) {
      return NextResponse.json(
        {
          error: "Stake exceeds tier limit",
          details: {
            tier: effectiveTier,
            maxStake,
            requestedStake: stakeAmount,
          }
        },
        { status: 400 }
      );
    }

    // Fetch market to validate status
    const { data: market, error: marketError } = await supabase
      .from("markets")
      .select("id, status, locks_at")
      .eq("id", marketId)
      .single();

    if (marketError || !market) {
      return NextResponse.json(
        { error: "Market not found" },
        { status: 404 }
      );
    }

    // Check market is open
    if (market.status !== "OPEN") {
      return NextResponse.json(
        { error: "Market is not open for predictions", status: market.status },
        { status: 400 }
      );
    }

    // Check if market has already locked by time
    if (new Date(market.locks_at) <= new Date()) {
      return NextResponse.json(
        { error: "Market has locked" },
        { status: 400 }
      );
    }

    // Check existing predictions from this user on this market
    const { data: existingPredictions, error: existingError } = await supabase
      .from("predictions")
      .select("stake_amount")
      .eq("market_id", marketId)
      .eq("user_id", userId);

    if (existingError) {
      console.error("Error checking existing predictions:", existingError);
      return NextResponse.json(
        { error: "Failed to check existing predictions" },
        { status: 500 }
      );
    }

    // Calculate total existing stake
    const existingStake = existingPredictions?.reduce(
      (sum, p) => sum + p.stake_amount,
      0
    ) ?? 0;

    // Check if new prediction would exceed tier cap
    if (existingStake + stakeAmount > maxStake) {
      return NextResponse.json(
        {
          error: "Total stake would exceed tier limit",
          details: {
            tier: effectiveTier,
            maxStake,
            existingStake,
            requestedStake: stakeAmount,
            totalWouldBe: existingStake + stakeAmount,
          }
        },
        { status: 400 }
      );
    }

    // Calculate weighted stake
    const credibilityWeight = Math.max(1, userCredibility) / 1000; // Normalize credibility to weight
    const weightedStake = stakeAmount * (1 + credibilityWeight);

    // Create the prediction
    const { data: prediction, error: predictionError } = await supabase
      .from("predictions")
      .insert({
        market_id: marketId,
        user_id: userId,
        position: position as "YES" | "NO",
        stake_amount: stakeAmount,
        credibility_at_prediction: userCredibility,
        weighted_stake: weightedStake,
      })
      .select()
      .single();

    if (predictionError) {
      console.error("Error creating prediction:", predictionError);
      return NextResponse.json(
        { error: "Failed to create prediction" },
        { status: 500 }
      );
    }

    // Recalculate market probabilities
    await recalculateMarketProbabilities(supabase, marketId);

    // Lock the RepScore stake amount and update user stats
    // We need to fetch current values for accurate increment
    const { data: currentUser } = await supabase
      .from("users")
      .select("total_predictions, total_staked, locked_rep_score")
      .eq("id", userId)
      .single();

    await supabase
      .from("users")
      .update({
        total_predictions: (currentUser?.total_predictions ?? 0) + 1,
        total_staked: (currentUser?.total_staked ?? 0) + stakeAmount,
        locked_rep_score: (currentUser?.locked_rep_score ?? 0) + stakeAmount,
      })
      .eq("id", userId);

    // Fetch updated market data
    const { data: updatedMarket } = await supabase
      .from("markets")
      .select("raw_probability_yes, weighted_probability_yes, total_stake_yes, total_stake_no")
      .eq("id", marketId)
      .single();

    return NextResponse.json({
      success: true,
      prediction: {
        id: prediction.id,
        marketId: prediction.market_id,
        position: prediction.position,
        stakeAmount: prediction.stake_amount,
        weightedStake: prediction.weighted_stake,
        credibilityAtPrediction: prediction.credibility_at_prediction,
        createdAt: prediction.created_at,
      },
      marketUpdates: updatedMarket ? {
        rawProbabilityYes: updatedMarket.raw_probability_yes,
        weightedProbabilityYes: updatedMarket.weighted_probability_yes,
        totalStakeYes: updatedMarket.total_stake_yes,
        totalStakeNo: updatedMarket.total_stake_no,
      } : null,
    });
  } catch (error) {
    console.error("Error placing prediction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Recalculate market probabilities after a new prediction
async function recalculateMarketProbabilities(
  supabase: ReturnType<typeof getAdminClient>,
  marketId: string
) {
  // Get market virtual stakes
  const { data: marketData } = await supabase
    .from("markets")
    .select("virtual_stake_yes, virtual_stake_no")
    .eq("id", marketId)
    .single();

  const virtualYes = marketData?.virtual_stake_yes ?? 100;
  const virtualNo = marketData?.virtual_stake_no ?? 100;

  // Get all predictions for this market
  const { data: predictions, error } = await supabase
    .from("predictions")
    .select("position, stake_amount, weighted_stake")
    .eq("market_id", marketId);

  if (error || !predictions) {
    console.error("Error fetching predictions for recalculation:", error);
    return;
  }

  // Calculate raw totals
  let totalStakeYes = 0;
  let totalStakeNo = 0;
  let totalWeightedYes = 0;
  let totalWeightedNo = 0;

  for (const pred of predictions) {
    if (pred.position === "YES") {
      totalStakeYes += pred.stake_amount;
      totalWeightedYes += pred.weighted_stake;
    } else {
      totalStakeNo += pred.stake_amount;
      totalWeightedNo += pred.weighted_stake;
    }
  }

  // Include virtual liquidity in probability calculation
  const effectiveYes = totalStakeYes + virtualYes;
  const effectiveNo = totalStakeNo + virtualNo;
  const effectiveTotal = effectiveYes + effectiveNo;

  const effectiveWeightedYes = totalWeightedYes + virtualYes;
  const effectiveWeightedNo = totalWeightedNo + virtualNo;
  const effectiveWeightedTotal = effectiveWeightedYes + effectiveWeightedNo;

  // Calculate probabilities with virtual liquidity
  const rawProbabilityYes = effectiveTotal > 0
    ? effectiveYes / effectiveTotal
    : 0.5;
  const weightedProbabilityYes = effectiveWeightedTotal > 0
    ? effectiveWeightedYes / effectiveWeightedTotal
    : 0.5;

  // Update market (store actual stake totals, not effective)
  await supabase
    .from("markets")
    .update({
      total_stake_yes: totalStakeYes,
      total_stake_no: totalStakeNo,
      total_weighted_stake_yes: totalWeightedYes,
      total_weighted_stake_no: totalWeightedNo,
      raw_probability_yes: rawProbabilityYes,
      weighted_probability_yes: weightedProbabilityYes,
    })
    .eq("id", marketId);
}

// GET endpoint to fetch user's predictions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const marketId = searchParams.get("marketId");

    if (!userId && !marketId) {
      return NextResponse.json(
        { error: "userId or marketId is required" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    let query = supabase
      .from("predictions")
      .select(`
        *,
        market:markets(id, title, status, locks_at, raw_probability_yes, weighted_probability_yes)
      `)
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (marketId) {
      query = query.eq("market_id", marketId);
    }

    const { data: predictions, error } = await query;

    if (error) {
      console.error("Error fetching predictions:", error);
      return NextResponse.json(
        { error: "Failed to fetch predictions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      predictions: predictions.map((p) => ({
        id: p.id,
        marketId: p.market_id,
        position: p.position,
        stakeAmount: p.stake_amount,
        weightedStake: p.weighted_stake,
        credibilityAtPrediction: p.credibility_at_prediction,
        isSettled: p.is_settled,
        payoutAmount: p.payout_amount,
        repScoreDelta: p.rep_score_delta,
        createdAt: p.created_at,
        settledAt: p.settled_at,
        market: p.market,
      })),
    });
  } catch (error) {
    console.error("Error fetching predictions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
