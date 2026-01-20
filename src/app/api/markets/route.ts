import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";

type MarketStatus = Database["public"]["Enums"]["market_status"];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const supabase = await createClient();

    let query = supabase.from("markets").select("*").order("locks_at", { ascending: true });

    if (status) {
      const statuses = status.split(",") as MarketStatus[];
      if (statuses.length > 1) {
        query = query.in("status", statuses);
      } else {
        query = query.eq("status", statuses[0]);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching markets:", error);
      return NextResponse.json(
        { error: "Failed to fetch markets" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in markets API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
