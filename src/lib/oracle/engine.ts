/**
 * Oracle Engine
 * Orchestrates market locking, resolution, and settlement
 */

import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import {
  resolveMarket,
  shouldLock,
  canResolve,
  OracleType,
  OracleConfig,
  ResolutionResult,
} from "./resolver";

type MarketStatus = Database["public"]["Enums"]["market_status"];
type ResolutionOutcome = Database["public"]["Enums"]["resolution_outcome"];

interface Market {
  id: string;
  title: string;
  status: MarketStatus | null;
  oracle_type: OracleType;
  oracle_config: OracleConfig;
  locks_at: string;
  resolves_at: string | null;
}

interface OracleEngineResult {
  processed: number;
  locked: string[];
  resolved: string[];
  settled: string[];
  errors: Array<{ marketId: string; error: string }>;
}

/**
 * Get Supabase admin client
 */
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key);
}

/**
 * Lock markets that have passed their lock time
 */
async function lockMarkets(supabase: ReturnType<typeof getAdminClient>): Promise<string[]> {
  const locked: string[] = [];

  // Fetch OPEN markets that should be locked
  const { data: markets, error } = await supabase
    .from("markets")
    .select("id, locks_at")
    .eq("status", "OPEN")
    .lte("locks_at", new Date().toISOString());

  if (error) {
    console.error("Error fetching markets to lock:", error);
    return locked;
  }

  for (const market of markets || []) {
    if (shouldLock(market.locks_at)) {
      const { error: updateError } = await supabase
        .from("markets")
        .update({ status: "LOCKED" as MarketStatus })
        .eq("id", market.id);

      if (updateError) {
        console.error(`Error locking market ${market.id}:`, updateError);
      } else {
        locked.push(market.id);
        console.log(`Locked market: ${market.id}`);
      }
    }
  }

  return locked;
}

/**
 * Resolve markets that have passed their resolution time
 */
async function resolveMarkets(
  supabase: ReturnType<typeof getAdminClient>
): Promise<{ resolved: string[]; errors: Array<{ marketId: string; error: string }> }> {
  const resolved: string[] = [];
  const errors: Array<{ marketId: string; error: string }> = [];

  // Fetch LOCKED markets that should be resolved
  const { data: markets, error } = await supabase
    .from("markets")
    .select("id, title, status, oracle_type, oracle_config, locks_at, resolves_at")
    .eq("status", "LOCKED")
    .not("resolves_at", "is", null)
    .lte("resolves_at", new Date().toISOString());

  if (error) {
    console.error("Error fetching markets to resolve:", error);
    return { resolved, errors };
  }

  for (const market of (markets as unknown as Market[]) || []) {
    if (!market.resolves_at || !canResolve(market.resolves_at)) {
      continue;
    }

    try {
      console.log(`Resolving market: ${market.id} - ${market.title}`);

      // Get the oracle config
      const oracleConfig = market.oracle_config as unknown as OracleConfig;

      // Resolve the market
      const result: ResolutionResult = await resolveMarket(
        market.oracle_type as OracleType,
        oracleConfig
      );

      // Store evidence log
      const { data: evidenceLog, error: evidenceError } = await supabase
        .from("evidence_logs")
        .insert({
          market_id: market.id,
          oracle_type: market.oracle_type,
          sources_queried: JSON.parse(JSON.stringify(result.evidence.sources)),
          extracted_value: String(result.evidence.extractedValue),
          decision: result.outcome as ResolutionOutcome,
          evidence_hash: result.evidenceHash,
          fetched_at: result.evidence.timestamp,
        })
        .select("id")
        .single();

      if (evidenceError) {
        console.error(`Error storing evidence for market ${market.id}:`, evidenceError);
        errors.push({ marketId: market.id, error: evidenceError.message });
        continue;
      }

      // Update market with resolution
      const { error: updateError } = await supabase
        .from("markets")
        .update({
          status: "RESOLVED" as MarketStatus,
          resolution_outcome: result.outcome as ResolutionOutcome,
          resolution_value: String(result.evidence.extractedValue),
          resolution_evidence_id: evidenceLog?.id,
        })
        .eq("id", market.id);

      if (updateError) {
        console.error(`Error updating market ${market.id}:`, updateError);
        errors.push({ marketId: market.id, error: updateError.message });
        continue;
      }

      resolved.push(market.id);
      console.log(`Resolved market ${market.id}: ${result.outcome}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(`Error resolving market ${market.id}:`, err);
      errors.push({ marketId: market.id, error: errorMsg });
    }
  }

  return { resolved, errors };
}

/**
 * Settle resolved markets - process payouts and RepScore updates
 */
async function settleMarkets(
  supabase: ReturnType<typeof getAdminClient>
): Promise<{ settled: string[]; errors: Array<{ marketId: string; error: string }> }> {
  const settled: string[] = [];
  const errors: Array<{ marketId: string; error: string }> = [];

  // Fetch RESOLVED markets that need settlement
  const { data: markets, error } = await supabase
    .from("markets")
    .select(`
      id,
      title,
      resolution_outcome,
      resolution_evidence_id,
      total_stake_yes,
      total_stake_no
    `)
    .eq("status", "RESOLVED");

  if (error) {
    console.error("Error fetching markets to settle:", error);
    return { settled, errors };
  }

  for (const market of markets || []) {
    if (!market.resolution_outcome || market.resolution_outcome === "INVALID") {
      // Handle INVALID resolution - refund all predictions
      try {
        await processInvalidSettlement(supabase, market.id);
        settled.push(market.id);
      } catch (err) {
        errors.push({
          marketId: market.id,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
      continue;
    }

    try {
      console.log(`Settling market: ${market.id} - ${market.title}`);

      // Get all predictions for this market
      const { data: predictions, error: predError } = await supabase
        .from("predictions")
        .select("id, user_id, position, stake_amount, weighted_stake, credibility_at_prediction")
        .eq("market_id", market.id)
        .eq("is_settled", false);

      if (predError) {
        errors.push({ marketId: market.id, error: predError.message });
        continue;
      }

      if (!predictions || predictions.length === 0) {
        // No predictions to settle
        await supabase
          .from("markets")
          .update({ status: "SETTLED" as MarketStatus, settled_at: new Date().toISOString() })
          .eq("id", market.id);
        settled.push(market.id);
        continue;
      }

      const winningPosition = market.resolution_outcome as "YES" | "NO";
      const totalPool = (market.total_stake_yes ?? 0) + (market.total_stake_no ?? 0);
      const winnersPool =
        winningPosition === "YES" ? (market.total_stake_yes ?? 0) : (market.total_stake_no ?? 0);
      const losersPool =
        winningPosition === "YES" ? (market.total_stake_no ?? 0) : (market.total_stake_yes ?? 0);

      // Calculate payouts
      const winners = predictions.filter((p) => p.position === winningPosition);
      const losers = predictions.filter((p) => p.position !== winningPosition);

      // Process each prediction
      for (const prediction of predictions) {
        const isWinner = prediction.position === winningPosition;

        let payoutAmount = 0;
        let repScoreDelta = 0;

        if (isWinner && winnersPool > 0) {
          // Winner gets their stake back plus proportional share of losers pool
          const shareOfWinnings = (prediction.stake_amount / winnersPool) * losersPool;
          payoutAmount = prediction.stake_amount + shareOfWinnings;

          // RepScore boost for winners (based on credibility at prediction)
          const credibilityMultiplier = Math.max(1, prediction.credibility_at_prediction / 1000);
          repScoreDelta = Math.round(5 * credibilityMultiplier);
        } else {
          // Loser loses their stake
          payoutAmount = 0;

          // RepScore penalty for losers
          repScoreDelta = -3;
        }

        // Update prediction
        await supabase
          .from("predictions")
          .update({
            is_settled: true,
            settled_at: new Date().toISOString(),
            payout_amount: payoutAmount,
            rep_score_delta: repScoreDelta,
          })
          .eq("id", prediction.id);

        // Update user's RepScore
        const { data: user } = await supabase
          .from("users")
          .select("rep_score, correct_predictions, total_won")
          .eq("id", prediction.user_id)
          .single();

        if (user) {
          const newRepScore = Math.max(0, (user.rep_score ?? 0) + repScoreDelta);
          const newCorrectPredictions = isWinner
            ? (user.correct_predictions ?? 0) + 1
            : (user.correct_predictions ?? 0);
          const newTotalWon = (user.total_won ?? 0) + payoutAmount;

          await supabase
            .from("users")
            .update({
              rep_score: newRepScore,
              correct_predictions: newCorrectPredictions,
              total_won: newTotalWon,
            })
            .eq("id", prediction.user_id);
        }
      }

      // Create settlement record
      await supabase.from("settlements").insert({
        market_id: market.id,
        outcome: market.resolution_outcome as ResolutionOutcome,
        total_pool: totalPool,
        winners_pool: winnersPool,
        losers_pool: losersPool,
        total_predictions: predictions.length,
        winning_predictions: winners.length,
        evidence_log_id: market.resolution_evidence_id,
      });

      // Update market to SETTLED
      await supabase
        .from("markets")
        .update({
          status: "SETTLED" as MarketStatus,
          settled_at: new Date().toISOString(),
        })
        .eq("id", market.id);

      settled.push(market.id);
      console.log(`Settled market ${market.id}: ${winners.length} winners, ${losers.length} losers`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(`Error settling market ${market.id}:`, err);
      errors.push({ marketId: market.id, error: errorMsg });
    }
  }

  return { settled, errors };
}

/**
 * Handle INVALID market settlement - refund all stakes
 */
async function processInvalidSettlement(
  supabase: ReturnType<typeof getAdminClient>,
  marketId: string
): Promise<void> {
  // Refund all predictions
  const { data: predictions } = await supabase
    .from("predictions")
    .select("id, user_id, stake_amount")
    .eq("market_id", marketId)
    .eq("is_settled", false);

  for (const prediction of predictions || []) {
    await supabase
      .from("predictions")
      .update({
        is_settled: true,
        settled_at: new Date().toISOString(),
        payout_amount: prediction.stake_amount, // Full refund
        rep_score_delta: 0, // No rep change for invalid markets
      })
      .eq("id", prediction.id);
  }

  // Update market to CANCELLED (since it couldn't be resolved)
  await supabase
    .from("markets")
    .update({
      status: "CANCELLED" as MarketStatus,
      settled_at: new Date().toISOString(),
    })
    .eq("id", marketId);

  console.log(`Refunded ${predictions?.length ?? 0} predictions for invalid market ${marketId}`);
}

/**
 * Main oracle engine run - processes all pending markets
 */
export async function runOracleEngine(): Promise<OracleEngineResult> {
  console.log("Oracle Engine starting...");

  const supabase = getAdminClient();
  const result: OracleEngineResult = {
    processed: 0,
    locked: [],
    resolved: [],
    settled: [],
    errors: [],
  };

  try {
    // Step 1: Lock markets
    result.locked = await lockMarkets(supabase);
    result.processed += result.locked.length;

    // Step 2: Resolve markets
    const resolveResult = await resolveMarkets(supabase);
    result.resolved = resolveResult.resolved;
    result.errors.push(...resolveResult.errors);
    result.processed += result.resolved.length;

    // Step 3: Settle markets
    const settleResult = await settleMarkets(supabase);
    result.settled = settleResult.settled;
    result.errors.push(...settleResult.errors);
    result.processed += result.settled.length;

    console.log(
      `Oracle Engine complete: ${result.locked.length} locked, ${result.resolved.length} resolved, ${result.settled.length} settled`
    );
  } catch (error) {
    console.error("Oracle Engine error:", error);
    result.errors.push({
      marketId: "engine",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return result;
}

/**
 * Get pending markets summary
 */
export async function getOracleStatus(): Promise<{
  openMarkets: number;
  lockedMarkets: number;
  resolvedMarkets: number;
  pendingLock: number;
  pendingResolve: number;
}> {
  const supabase = getAdminClient();
  const now = new Date().toISOString();

  const [open, locked, resolved, pendingLock, pendingResolve] = await Promise.all([
    supabase.from("markets").select("id", { count: "exact", head: true }).eq("status", "OPEN"),
    supabase.from("markets").select("id", { count: "exact", head: true }).eq("status", "LOCKED"),
    supabase.from("markets").select("id", { count: "exact", head: true }).eq("status", "RESOLVED"),
    supabase
      .from("markets")
      .select("id", { count: "exact", head: true })
      .eq("status", "OPEN")
      .lte("locks_at", now),
    supabase
      .from("markets")
      .select("id", { count: "exact", head: true })
      .eq("status", "LOCKED")
      .lte("resolves_at", now),
  ]);

  return {
    openMarkets: open.count ?? 0,
    lockedMarkets: locked.count ?? 0,
    resolvedMarkets: resolved.count ?? 0,
    pendingLock: pendingLock.count ?? 0,
    pendingResolve: pendingResolve.count ?? 0,
  };
}
