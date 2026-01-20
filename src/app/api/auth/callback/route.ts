import { NextRequest, NextResponse } from "next/server";

// Placeholder for auth callback if needed
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirectUrl = searchParams.get("redirect") || "/markets";

  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
