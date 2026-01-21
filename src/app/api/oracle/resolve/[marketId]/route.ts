import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { resolveMarket, OracleType, OracleConfig, ResolutionResult } from "@/lib/oracle";

type ResolutionOutcome = Database["public"]["Enums"]["resolution_outcome"];
type MarketStatus = Database["public"]["Enums"]["market_status"];

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key);
}

interface RouteParams {
  params: Promise<{ marketId: string }>;
}

/**
 * Manual Market Resolution Endpoint
 * POST /api/oracle/resolve/[marketId]
 *
 * Manually triggers resolution for a specific market
 * Useful for testing or admin override
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { marketId } = await params;
    const supabase = getAdminClient();

    // Fetch market
    const { data: market, error: fetchError } = await supabase
      .from("markets")
      .select("id, title, status, oracle_type, oracle_config, locks_at, resolves_at")
      .eq("id", marketId)
      .single();

    if (fetchError || !market) {
      return NextResponse.json(
        { error: "Market not found" },
        { status: 404 }
      );
    }

    // Check if market can be resolved
    if (market.status !== "LOCKED" && market.status !== "OPEN") {
      return NextResponse.json(
        {
          error: `Market cannot be resolved - current status: ${market.status}`,
          market: {
            id: market.id,
            title: market.title,
            status: market.status,
          },
        },
        { status: 400 }
      );
    }

    console.log(`Manually resolving market: ${market.id} - ${market.title}`);

    // Resolve the market
    const oracleConfig = market.oracle_config as unknown as OracleConfig;
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
      return NextResponse.json(
        { error: "Failed to store evidence", details: evidenceError.message },
        { status: 500 }
      );
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
      return NextResponse.json(
        { error: "Failed to update market", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      market: {
        id: market.id,
        title: market.title,
      },
      resolution: {
        outcome: result.outcome,
        extractedValue: result.evidence.extractedValue,
        evidenceHash: result.evidenceHash,
        timestamp: result.evidence.timestamp,
        sources: result.evidence.sources.map((s) => ({
          source: s.source,
          value: s.value,
          error: s.error,
        })),
      },
    });
  } catch (error) {
    console.error("Manual resolution error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Get resolution preview (dry run)
 * GET /api/oracle/resolve/[marketId]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { marketId } = await params;
    const supabase = getAdminClient();

    // Fetch market
    const { data: market, error: fetchError } = await supabase
      .from("markets")
      .select("id, title, status, oracle_type, oracle_config, locks_at, resolves_at")
      .eq("id", marketId)
      .single();

    if (fetchError || !market) {
      return NextResponse.json(
        { error: "Market not found" },
        { status: 404 }
      );
    }

    // Resolve the market (dry run - don't save)
    const oracleConfig = market.oracle_config as unknown as OracleConfig;
    const result: ResolutionResult = await resolveMarket(
      market.oracle_type as OracleType,
      oracleConfig
    );

    return NextResponse.json({
      success: true,
      preview: true,
      market: {
        id: market.id,
        title: market.title,
        status: market.status,
        locksAt: market.locks_at,
        resolvesAt: market.resolves_at,
      },
      resolution: {
        outcome: result.outcome,
        extractedValue: result.evidence.extractedValue,
        evidenceHash: result.evidenceHash,
        timestamp: result.evidence.timestamp,
        sources: result.evidence.sources.map((s) => ({
          source: s.source,
          value: s.value,
          timestamp: s.timestamp,
          error: s.error,
        })),
        config: result.evidence.config,
      },
    });
  } catch (error) {
    console.error("Resolution preview error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
