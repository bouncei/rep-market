import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key);
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Fetch user data
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("rep_score, ethos_credibility, accuracy_rate, total_predictions, total_won, correct_predictions, created_at")
      .eq("id", userId)
      .single();

    if (userError) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Calculate total_lost from predictions and wins
    const totalLost = (user.total_predictions ?? 0) - (user.correct_predictions ?? 0);

    // Fetch settled predictions for historical data
    const { data: predictions, error: predictionsError } = await supabase
      .from("predictions")
      .select(`
        id,
        created_at,
        is_settled,
        payout_amount,
        stake_amount,
        rep_score_delta,
        position,
        market:markets(resolution_outcome)
      `)
      .eq("user_id", userId)
      .eq("is_settled", true)
      .order("created_at", { ascending: true });

    if (predictionsError) {
      console.error("Error fetching predictions:", predictionsError);
      return NextResponse.json(
        { error: "Failed to fetch predictions" },
        { status: 500 }
      );
    }

    // Generate RepScore history points
    const repScoreHistory = generateRepScoreHistory(
      user.rep_score ?? 500,
      predictions || [],
      user.created_at
    );

    // Generate accuracy by period (monthly)
    const accuracyByPeriod = generateAccuracyByPeriod(predictions || []);

    return NextResponse.json({
      user: {
        repScore: user.rep_score,
        ethosCredibility: user.ethos_credibility,
        accuracyRate: user.accuracy_rate,
        totalPredictions: user.total_predictions,
        totalWon: user.total_won,
        totalLost: totalLost,
      },
      repScoreHistory,
      accuracyByPeriod,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

interface PredictionWithMarket {
  id: string;
  created_at: string | null;
  is_settled: boolean | null;
  payout_amount: number | null;
  stake_amount: number;
  rep_score_delta: number | null;
  position: string;
  market: { resolution_outcome: string | null } | null;
}

function generateRepScoreHistory(
  currentScore: number,
  predictions: PredictionWithMarket[],
  userCreatedAt: string | null
): { date: string; value: number }[] {
  const history: { date: string; value: number }[] = [];
  const initialScore = 500;
  const startDate = userCreatedAt ?? new Date().toISOString();

  // Start with account creation
  history.push({
    date: startDate,
    value: initialScore,
  });

  // Calculate running score from predictions
  let runningScore = initialScore;

  for (const pred of predictions) {
    if (pred.rep_score_delta && pred.created_at) {
      runningScore += pred.rep_score_delta;
      history.push({
        date: pred.created_at,
        value: runningScore,
      });
    }
  }

  // If no predictions, add current date with current score
  if (history.length === 1) {
    history.push({
      date: new Date().toISOString(),
      value: currentScore,
    });
  }

  return history;
}

function generateAccuracyByPeriod(
  predictions: PredictionWithMarket[]
): { period: string; wins: number; losses: number; total: number; accuracy: number }[] {
  const periodMap = new Map<
    string,
    { wins: number; losses: number; total: number }
  >();

  for (const pred of predictions) {
    if (!pred.created_at) continue;

    const date = new Date(pred.created_at);
    const periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, { wins: 0, losses: 0, total: 0 });
    }

    const period = periodMap.get(periodKey)!;
    period.total++;

    // Determine if win or loss
    const marketOutcome = pred.market?.resolution_outcome;
    if (marketOutcome === pred.position) {
      period.wins++;
    } else if (marketOutcome && marketOutcome !== "INVALID") {
      period.losses++;
    }
    // INVALID outcomes don't count as win or loss
  }

  // Convert to array and sort by period
  const result = Array.from(periodMap.entries())
    .map(([period, data]) => ({
      period: formatPeriod(period),
      wins: data.wins,
      losses: data.losses,
      total: data.total,
      accuracy: data.total > 0 ? data.wins / data.total : 0,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  // Only return last 6 months
  return result.slice(-6);
}

function formatPeriod(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}
