import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Types
interface OracleConfig {
  asset?: string;
  targetPrice?: number;
  comparison?: "above" | "below";
  protocol?: string;
  chain?: string;
  targetValue?: number;
  metric?: "tvl";
  source?: "ethos";
  countType?: "profiles";
  targetCount?: number;
}

interface Market {
  id: string;
  title: string;
  oracle_type: string;
  oracle_config: OracleConfig;
  status: string;
  locks_at: string;
  resolves_at: string | null;
}

interface ResolutionResult {
  outcome: "YES" | "NO" | "INVALID";
  value: string;
  evidence: {
    timestamp: string;
    sources: { source: string; value: number | string }[];
    extractedValue: number | string;
    decision: string;
  };
}

// CoinGecko price fetching
const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  AVAX: "avalanche-2",
};

async function fetchCoinGeckoPrice(symbol: string): Promise<number | null> {
  const coinId = COINGECKO_IDS[symbol.toUpperCase()];
  if (!coinId) return null;

  try {
    const apiKey = Deno.env.get("COINGECKO_API_KEY");
    const apiKeyParam = apiKey ? `&x_cg_demo_api_key=${apiKey}` : "";

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd${apiKeyParam}`
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data[coinId]?.usd ?? null;
  } catch {
    return null;
  }
}

// DeFiLlama TVL fetching
const DEFILLAMA_PROTOCOLS: Record<string, string> = {
  EIGENLAYER: "eigenlayer",
  LIDO: "lido",
  AAVE: "aave",
  UNISWAP: "uniswap",
  MAKERDAO: "makerdao",
};

async function fetchDefiLlamaTVL(protocol: string): Promise<number | null> {
  const slug = DEFILLAMA_PROTOCOLS[protocol.toUpperCase()];
  if (!slug) return null;

  try {
    const response = await fetch(`https://api.llama.fi/tvl/${slug}`);
    if (!response.ok) return null;
    const tvl = await response.json();
    return typeof tvl === "number" ? tvl : null;
  } catch {
    return null;
  }
}

// Hash function for evidence
async function hashEvidence(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Oracle resolution logic
async function resolveMarket(
  oracleType: string,
  oracleConfig: OracleConfig
): Promise<ResolutionResult> {
  const timestamp = new Date().toISOString();
  const sources: { source: string; value: number | string }[] = [];

  if (oracleType === "price_close") {
    const { asset, targetPrice, comparison } = oracleConfig;
    if (!asset || targetPrice === undefined || !comparison) {
      return {
        outcome: "INVALID",
        value: "Missing configuration",
        evidence: { timestamp, sources: [], extractedValue: 0, decision: "INVALID - missing config" },
      };
    }

    const price = await fetchCoinGeckoPrice(asset);
    if (price === null) {
      return {
        outcome: "INVALID",
        value: "Failed to fetch price",
        evidence: { timestamp, sources: [], extractedValue: 0, decision: "INVALID - fetch failed" },
      };
    }

    sources.push({ source: "coingecko", value: price });

    const outcome =
      comparison === "above"
        ? price >= targetPrice
          ? "YES"
          : "NO"
        : price < targetPrice
        ? "YES"
        : "NO";

    return {
      outcome,
      value: price.toString(),
      evidence: {
        timestamp,
        sources,
        extractedValue: price,
        decision: `${asset} price $${price} is ${comparison === "above" ? (price >= targetPrice ? "above" : "below") : price < targetPrice ? "below" : "above"} $${targetPrice}`,
      },
    };
  }

  if (oracleType === "metric_threshold") {
    const { protocol, targetValue } = oracleConfig;
    if (!protocol || targetValue === undefined) {
      return {
        outcome: "INVALID",
        value: "Missing configuration",
        evidence: { timestamp, sources: [], extractedValue: 0, decision: "INVALID - missing config" },
      };
    }

    const tvl = await fetchDefiLlamaTVL(protocol);
    if (tvl === null) {
      return {
        outcome: "INVALID",
        value: "Failed to fetch TVL",
        evidence: { timestamp, sources: [], extractedValue: 0, decision: "INVALID - fetch failed" },
      };
    }

    sources.push({ source: "defillama", value: tvl });
    const outcome = tvl >= targetValue ? "YES" : "NO";

    return {
      outcome,
      value: tvl.toString(),
      evidence: {
        timestamp,
        sources,
        extractedValue: tvl,
        decision: `${protocol} TVL $${(tvl / 1e9).toFixed(2)}B is ${tvl >= targetValue ? "above" : "below"} $${(targetValue / 1e9).toFixed(2)}B`,
      },
    };
  }

  if (oracleType === "count_threshold") {
    const { targetCount } = oracleConfig;
    if (targetCount === undefined) {
      return {
        outcome: "INVALID",
        value: "Missing configuration",
        evidence: { timestamp, sources: [], extractedValue: 0, decision: "INVALID - missing config" },
      };
    }

    // For Ethos count, we'd need API access - for now return placeholder
    // In production, integrate with Ethos API
    const mockCount = 50000;
    sources.push({ source: "ethos", value: mockCount });
    const outcome = mockCount >= targetCount ? "YES" : "NO";

    return {
      outcome,
      value: mockCount.toString(),
      evidence: {
        timestamp,
        sources,
        extractedValue: mockCount,
        decision: `Ethos profiles ${mockCount} is ${mockCount >= targetCount ? "above" : "below"} ${targetCount}`,
      },
    };
  }

  return {
    outcome: "INVALID",
    value: "Unknown oracle type",
    evidence: { timestamp, sources: [], extractedValue: 0, decision: "INVALID - unknown type" },
  };
}

// Main handler
Deno.serve(async (req: Request) => {
  try {
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const results = {
      locked: 0,
      resolved: 0,
      settled: 0,
      errors: [] as string[],
    };

    // 1. Lock markets that have passed their lock time
    const { data: marketsToLock } = await supabase
      .from("markets")
      .select("id, title")
      .eq("status", "OPEN")
      .lte("locks_at", now.toISOString());

    if (marketsToLock && marketsToLock.length > 0) {
      for (const market of marketsToLock) {
        const { error } = await supabase
          .from("markets")
          .update({ status: "LOCKED", updated_at: now.toISOString() })
          .eq("id", market.id);

        if (error) {
          results.errors.push(`Lock failed for ${market.id}: ${error.message}`);
        } else {
          results.locked++;
        }
      }
    }

    // 2. Resolve markets that have passed their resolution time
    const { data: marketsToResolve } = await supabase
      .from("markets")
      .select("id, title, oracle_type, oracle_config, resolves_at")
      .eq("status", "LOCKED")
      .lte("resolves_at", now.toISOString());

    if (marketsToResolve && marketsToResolve.length > 0) {
      for (const market of marketsToResolve as Market[]) {
        try {
          const result = await resolveMarket(
            market.oracle_type,
            market.oracle_config
          );

          // Create evidence hash
          const evidenceHash = await hashEvidence(
            JSON.stringify(result.evidence)
          );

          // Insert evidence log
          const { data: evidenceLog, error: evidenceError } = await supabase
            .from("evidence_logs")
            .insert({
              market_id: market.id,
              oracle_type: market.oracle_type,
              sources_queried: JSON.parse(JSON.stringify(result.evidence.sources)),
              extracted_value: result.value,
              decision: result.outcome,
              evidence_hash: evidenceHash,
              fetched_at: result.evidence.timestamp,
            })
            .select()
            .single();

          if (evidenceError) {
            results.errors.push(`Evidence log failed for ${market.id}: ${evidenceError.message}`);
            continue;
          }

          // Update market
          const { error: updateError } = await supabase
            .from("markets")
            .update({
              status: "RESOLVED",
              resolution_outcome: result.outcome,
              resolution_value: result.value,
              resolution_evidence_id: evidenceLog.id,
              updated_at: now.toISOString(),
            })
            .eq("id", market.id);

          if (updateError) {
            results.errors.push(`Resolution update failed for ${market.id}: ${updateError.message}`);
          } else {
            results.resolved++;
          }
        } catch (err) {
          results.errors.push(`Resolution error for ${market.id}: ${err}`);
        }
      }
    }

    // 3. Settle resolved markets
    const { data: marketsToSettle } = await supabase
      .from("markets")
      .select("id, title, resolution_outcome, resolution_evidence_id")
      .eq("status", "RESOLVED");

    if (marketsToSettle && marketsToSettle.length > 0) {
      for (const market of marketsToSettle) {
        try {
          const outcome = market.resolution_outcome;

          // Get all predictions for this market
          const { data: predictions } = await supabase
            .from("predictions")
            .select("*")
            .eq("market_id", market.id)
            .eq("is_settled", false);

          if (!predictions || predictions.length === 0) {
            // No predictions to settle, just mark as settled
            await supabase
              .from("markets")
              .update({ status: "SETTLED", settled_at: now.toISOString() })
              .eq("id", market.id);
            results.settled++;
            continue;
          }

          // Calculate pools
          const winners = predictions.filter((p) => p.position === outcome);
          const losers = predictions.filter((p) => p.position !== outcome && outcome !== "INVALID");

          const winnersPool = winners.reduce((sum, p) => sum + p.stake_amount, 0);
          const losersPool = losers.reduce((sum, p) => sum + p.stake_amount, 0);
          const totalPool = winnersPool + losersPool;

          // Process each prediction
          for (const pred of predictions) {
            let payoutAmount = 0;
            let repScoreDelta = 0;

            if (outcome === "INVALID") {
              // Full refund
              payoutAmount = pred.stake_amount;
              repScoreDelta = 0;
            } else if (pred.position === outcome) {
              // Winner: stake + proportional share of losers pool
              const share = winnersPool > 0 ? pred.weighted_stake / winners.reduce((s, w) => s + w.weighted_stake, 0) : 0;
              payoutAmount = pred.stake_amount + losersPool * share;
              repScoreDelta = Math.round(5 * (pred.credibility_at_prediction / 100));
            } else {
              // Loser: loses stake
              payoutAmount = 0;
              repScoreDelta = -3;
            }

            // Update prediction
            await supabase
              .from("predictions")
              .update({
                is_settled: true,
                payout_amount: payoutAmount,
                rep_score_delta: repScoreDelta,
                settled_at: now.toISOString(),
              })
              .eq("id", pred.id);

            // Update user's rep score and stats
            await supabase.rpc("update_user_stats_after_settlement", {
              p_user_id: pred.user_id,
              p_rep_delta: repScoreDelta,
              p_won: pred.position === outcome && outcome !== "INVALID",
              p_payout: payoutAmount,
            });
          }

          // Create settlement record
          await supabase.from("settlements").insert({
            market_id: market.id,
            outcome: outcome,
            total_pool: totalPool,
            winners_pool: winnersPool,
            losers_pool: losersPool,
            total_predictions: predictions.length,
            winning_predictions: winners.length,
            evidence_log_id: market.resolution_evidence_id,
          });

          // Mark market as settled
          await supabase
            .from("markets")
            .update({ status: "SETTLED", settled_at: now.toISOString() })
            .eq("id", market.id);

          results.settled++;
        } catch (err) {
          results.errors.push(`Settlement error for ${market.id}: ${err}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: now.toISOString(),
        results,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
