import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { z } from "zod";

type MarketStatus = Database["public"]["Enums"]["market_status"];
type OracleType = Database["public"]["Enums"]["oracle_type"];

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key);
}

// Request validation schema
const createMarketSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().max(1000).optional(),
  oracleType: z.enum(["price_close", "metric_threshold", "count_threshold"]),
  oracleConfig: z.object({
    asset: z.string().optional(),
    targetPrice: z.number().optional(),
    comparison: z.enum(["above", "below"]).optional(),
    protocol: z.string().optional(),
    chain: z.string().optional(),
    targetValue: z.number().optional(),
    metric: z.enum(["tvl"]).optional(),
    source: z.enum(["ethos"]).optional(),
    countType: z.enum(["profiles"]).optional(),
    targetCount: z.number().optional(),
  }),
  locksAt: z.string().datetime(),
  resolvesAt: z.string().datetime(),
  category: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const parseResult = createMarketSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const supabase = getAdminClient();

    // Validate dates
    const locksAt = new Date(data.locksAt);
    const resolvesAt = new Date(data.resolvesAt);
    const now = new Date();

    if (locksAt <= now) {
      return NextResponse.json(
        { error: "Lock time must be in the future" },
        { status: 400 }
      );
    }

    if (resolvesAt <= locksAt) {
      return NextResponse.json(
        { error: "Resolution time must be after lock time" },
        { status: 400 }
      );
    }

    // Create the market
    const { data: market, error } = await supabase
      .from("markets")
      .insert({
        title: data.title,
        description: data.description,
        oracle_type: data.oracleType as OracleType,
        oracle_config: data.oracleConfig,
        locks_at: data.locksAt,
        resolves_at: data.resolvesAt,
        category: data.category,
        status: "OPEN" as MarketStatus,
        raw_probability_yes: 50,
        weighted_probability_yes: 50,
        total_stake_yes: 0,
        total_stake_no: 0,
        total_weighted_stake_yes: 0,
        total_weighted_stake_no: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating market:", error);
      return NextResponse.json(
        { error: "Failed to create market", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      market: {
        id: market.id,
        title: market.title,
        status: market.status,
        locksAt: market.locks_at,
        resolvesAt: market.resolves_at,
      },
    });
  } catch (error) {
    console.error("Market creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
