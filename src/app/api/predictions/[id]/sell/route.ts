import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { z } from "zod";
import {
  calculateSellValue,
  calculateRepScoreDelta,
  calculateUpdatedProbabilities,
} from "@/lib/amm/pricing";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key);
}

const sellSchema = z.object({
  userId: z.string().uuid(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: predictionId } = await params;
    const body = await request.json();

    const parseResult = sellSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { userId } = parseResult.data;
    const supabase = getAdminClient();

    // Fetch the prediction with market data
    const { data: prediction, error: predictionError } = await supabase
      .from("predictions")
      .select(`
        *,
        market:markets(
          id, status, locks_at,
          raw_probability_yes, weighted_probability_yes,
          total_stake_yes, total_stake_no,
          total_weighted_stake_yes, total_weighted_stake_no,
          virtual_stake_yes, virtual_stake_no
        )
      `)
      .eq("id", predictionId)
      .single();

    if (predictionError || !prediction) {
      return NextResponse.json(
        { error: "Prediction not found" },
        { status: 404 }
      );
    }

    // Validate ownership
    if (prediction.user_id !== userId) {
      return NextResponse.json(
        { error: "You do not own this prediction" },
        { status: 403 }
      );
    }

    // Check if already settled
    if (prediction.is_settled) {
      return NextResponse.json(
        { error: "This prediction has already been settled" },
        { status: 400 }
      );
    }

    const market = prediction.market as any;
    if (!market) {
      return NextResponse.json(
        { error: "Market not found" },
        { status: 404 }
      );
    }

    // Only allow selling in OPEN markets
    if (market.status !== "OPEN") {
      return NextResponse.json(
        {
          error: "Cannot sell position in closed market",
          details: { status: market.status }
        },
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

    // Calculate sell value using AMM pricing
    const virtualYes = market.virtual_stake_yes ?? 1000;
    const virtualNo = market.virtual_stake_no ?? 1000;
    const totalLiquidity =
      (market.total_stake_yes ?? 0) +
      (market.total_stake_no ?? 0);
    const virtualLiquidity = virtualYes + virtualNo;

    const currentProbYes = market.raw_probability_yes ?? 0.5;

    const sellResult = calculateSellValue({
      position: prediction.position as "YES" | "NO",
      stake: prediction.stake_amount,
      currentProbYes,
      totalLiquidity,
      virtualLiquidity,
      fee: 0.005, // 0.5% exit fee
    });

    const repScoreDelta = calculateRepScoreDelta(
      prediction.stake_amount,
      sellResult.netValue
    );

    // Calculate updated market probabilities
    const updatedProbs = calculateUpdatedProbabilities(
      market.total_stake_yes ?? 0,
      market.total_stake_no ?? 0,
      market.total_weighted_stake_yes ?? 0,
      market.total_weighted_stake_no ?? 0,
      prediction.position as "YES" | "NO",
      prediction.stake_amount,
      prediction.weighted_stake,
      virtualYes,
      virtualNo
    );

    // Start transaction-like updates
    // 1. Mark prediction as settled
    const { error: updatePredictionError } = await supabase
      .from("predictions")
      .update({
        is_settled: true,
        settled_at: new Date().toISOString(),
        payout_amount: sellResult.netValue,
        rep_score_delta: repScoreDelta,
      })
      .eq("id", predictionId);

    if (updatePredictionError) {
      console.error("Error updating prediction:", updatePredictionError);
      return NextResponse.json(
        { error: "Failed to process sale" },
        { status: 500 }
      );
    }

    // 2. Update user's rep_score and locked_rep_score
    const { data: currentUser } = await supabase
      .from("users")
      .select("rep_score, locked_rep_score")
      .eq("id", userId)
      .single();

    if (currentUser) {
      const newRepScore = Math.max(
        0,
        (currentUser.rep_score ?? 0) + repScoreDelta
      );
      const newLockedRepScore = Math.max(
        0,
        (currentUser.locked_rep_score ?? 0) - prediction.stake_amount
      );

      await supabase
        .from("users")
        .update({
          rep_score: newRepScore,
          locked_rep_score: newLockedRepScore,
        })
        .eq("id", userId);
    }

    // 3. Update market probabilities and stake totals
    const newStakeYes =
      prediction.position === "YES"
        ? Math.max(0, (market.total_stake_yes ?? 0) - prediction.stake_amount)
        : market.total_stake_yes ?? 0;
    const newStakeNo =
      prediction.position === "NO"
        ? Math.max(0, (market.total_stake_no ?? 0) - prediction.stake_amount)
        : market.total_stake_no ?? 0;
    const newWeightedStakeYes =
      prediction.position === "YES"
        ? Math.max(0, (market.total_weighted_stake_yes ?? 0) - prediction.weighted_stake)
        : market.total_weighted_stake_yes ?? 0;
    const newWeightedStakeNo =
      prediction.position === "NO"
        ? Math.max(0, (market.total_weighted_stake_no ?? 0) - prediction.weighted_stake)
        : market.total_weighted_stake_no ?? 0;

    await supabase
      .from("markets")
      .update({
        total_stake_yes: newStakeYes,
        total_stake_no: newStakeNo,
        total_weighted_stake_yes: newWeightedStakeYes,
        total_weighted_stake_no: newWeightedStakeNo,
        raw_probability_yes: updatedProbs.rawProbYes,
        weighted_probability_yes: updatedProbs.weightedProbYes,
      })
      .eq("id", market.id);

    return NextResponse.json({
      success: true,
      sale: {
        predictionId,
        originalStake: prediction.stake_amount,
        position: prediction.position,
        sellValue: {
          baseValue: sellResult.baseValue,
          priceImpact: sellResult.priceImpact,
          fee: sellResult.fee,
          netValue: sellResult.netValue,
          effectiveSlippagePercent: sellResult.effectiveSlippagePercent,
        },
        profitLoss: {
          amount: sellResult.profitLoss,
          percent: sellResult.profitLossPercent,
        },
        repScoreDelta,
      },
      marketUpdates: {
        rawProbabilityYes: updatedProbs.rawProbYes,
        weightedProbabilityYes: updatedProbs.weightedProbYes,
        totalStakeYes: newStakeYes,
        totalStakeNo: newStakeNo,
      },
    });
  } catch (error) {
    console.error("Error processing sale:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to preview sell value without executing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: predictionId } = await params;
    const supabase = getAdminClient();

    // Fetch the prediction with market data
    const { data: prediction, error: predictionError } = await supabase
      .from("predictions")
      .select(`
        *,
        market:markets(
          id, status,
          raw_probability_yes,
          total_stake_yes, total_stake_no,
          virtual_stake_yes, virtual_stake_no
        )
      `)
      .eq("id", predictionId)
      .single();

    if (predictionError || !prediction) {
      return NextResponse.json(
        { error: "Prediction not found" },
        { status: 404 }
      );
    }

    if (prediction.is_settled) {
      return NextResponse.json(
        { error: "This prediction has already been settled" },
        { status: 400 }
      );
    }

    const market = prediction.market as any;

    // Calculate sell value preview
    const virtualYes = market.virtual_stake_yes ?? 1000;
    const virtualNo = market.virtual_stake_no ?? 1000;
    const totalLiquidity =
      (market.total_stake_yes ?? 0) +
      (market.total_stake_no ?? 0);
    const virtualLiquidity = virtualYes + virtualNo;

    const currentProbYes = market.raw_probability_yes ?? 0.5;

    const sellResult = calculateSellValue({
      position: prediction.position as "YES" | "NO",
      stake: prediction.stake_amount,
      currentProbYes,
      totalLiquidity,
      virtualLiquidity,
      fee: 0.005, // 0.5% exit fee
    });

    const canSell = market.status === "OPEN";

    return NextResponse.json({
      success: true,
      preview: {
        predictionId,
        position: prediction.position,
        originalStake: prediction.stake_amount,
        currentProbability: prediction.position === "YES" ? currentProbYes : 1 - currentProbYes,
        sellValue: {
          baseValue: sellResult.baseValue,
          priceImpact: sellResult.priceImpact,
          fee: sellResult.fee,
          netValue: sellResult.netValue,
          effectiveSlippagePercent: sellResult.effectiveSlippagePercent,
        },
        profitLoss: {
          amount: sellResult.profitLoss,
          percent: sellResult.profitLossPercent,
        },
        canSell,
        marketStatus: market.status,
        warning: sellResult.effectiveSlippagePercent > 2 
          ? `High slippage warning: This trade will incur ${sellResult.effectiveSlippagePercent.toFixed(1)}% in fees and price impact due to low market liquidity.`
          : null,
      },
    });
  } catch (error) {
    console.error("Error previewing sale:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
