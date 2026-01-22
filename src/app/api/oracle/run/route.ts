import { NextRequest, NextResponse } from "next/server";
import { runOracleEngine } from "@/lib/oracle";

/**
 * Oracle Engine Run Endpoint
 * POST /api/oracle/run
 *
 * Triggers the oracle engine to process markets:
 * 1. Lock markets past their lock time
 * 2. Resolve markets past their resolution time
 * 3. Settle resolved markets
 *
 * This endpoint can be called by:
 * - Vercel Cron jobs (recommended for production)
 * - Supabase scheduled functions
 * - Manual triggers for testing
 *
 * Security: In production, add authentication (API key or secret)
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify cron secret for production security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // In development, allow without auth
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    console.log("Oracle engine triggered via API");

    const result = await runOracleEngine();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result: {
        processed: result.processed,
        locked: result.locked.length,
        resolved: result.resolved.length,
        settled: result.settled.length,
        errors: result.errors.length,
      },
      details: {
        lockedMarkets: result.locked,
        resolvedMarkets: result.resolved,
        settledMarkets: result.settled,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error("Oracle engine API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support GET for easy testing in browser
export async function GET(request: NextRequest) {
  return POST(request);
}
