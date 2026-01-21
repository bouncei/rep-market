import { NextResponse } from "next/server";
import { getOracleStatus } from "@/lib/oracle";

/**
 * Oracle Status Endpoint
 * GET /api/oracle/status
 *
 * Returns the current state of markets in the oracle pipeline
 */
export async function GET() {
  try {
    const status = await getOracleStatus();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      status: {
        markets: {
          open: status.openMarkets,
          locked: status.lockedMarkets,
          resolved: status.resolvedMarkets,
        },
        pending: {
          toLock: status.pendingLock,
          toResolve: status.pendingResolve,
        },
        needsProcessing: status.pendingLock > 0 || status.pendingResolve > 0,
      },
    });
  } catch (error) {
    console.error("Oracle status API error:", error);
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
