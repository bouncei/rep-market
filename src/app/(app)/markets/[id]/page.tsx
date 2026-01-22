"use client";

import { use, useCallback } from "react";
import { useMarket, usePredictions, useMarketRealtimeUpdates } from "@/hooks";
import { ProbabilityToggle, CountdownTimer, ResolutionStatus } from "@/components/markets";
import { PredictionForm } from "@/components/predictions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Clock, TrendingUp, Users, History } from "lucide-react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

interface MarketDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  OPEN: "bg-green-500/10 text-green-500 border-green-500/20",
  LOCKED: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  RESOLVED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  SETTLED: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  CANCELLED: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function MarketDetailPage({ params }: MarketDetailPageProps) {
  const { id } = use(params);
  const { data: market, isLoading, error, refetch: refetchMarket } = useMarket(id);
  const { predictions, getMarketPredictions, refetchPredictions } = usePredictions(id);
  const queryClient = useQueryClient();

  // Subscribe to real-time updates for this market
  useMarketRealtimeUpdates(id);

  const userMarketPredictions = getMarketPredictions(id);

  const handlePredictionPlaced = useCallback(() => {
    refetchMarket();
    refetchPredictions();
    queryClient.invalidateQueries({ queryKey: ["markets"] });
  }, [refetchMarket, refetchPredictions, queryClient]);

  if (isLoading) {
    return <MarketDetailSkeleton />;
  }

  if (error || !market) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Market not found</h2>
        <Button asChild variant="outline">
          <Link href="/markets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Markets
          </Link>
        </Button>
      </div>
    );
  }

  const isOpen = market.status === "OPEN";
  const isResolved = market.status === "RESOLVED" || market.status === "SETTLED";
  const totalStake =
    (market.total_stake_yes ?? 0) + (market.total_stake_no ?? 0);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button asChild variant="ghost" size="sm">
        <Link href="/markets">
          <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-xs sm:text-sm">Back to Markets</span>
        </Link>
      </Button>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{market.title}</h1>
          <Badge
            variant="outline"
            className={`${statusColors[market.status ?? "DRAFT"]} text-xs shrink-0`}
          >
            {market.status}
          </Badge>
        </div>
        {market.description && (
          <p className="text-sm sm:text-base text-muted-foreground">{market.description}</p>
        )}
      </div>

      {/* Resolution Status for resolved/settled markets */}
      {isResolved && (
        <ResolutionStatus
          status={market.status}
          outcome={market.resolution_outcome}
          resolutionValue={market.resolution_value}
          settledAt={market.settled_at}
        />
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Main probability card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Market Probability</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-6 sm:py-8">
            <ProbabilityToggle
              rawProbability={market.raw_probability_yes ?? 0.5}
              weightedProbability={market.weighted_probability_yes ?? 0.5}
              size="lg"
            />
          </CardContent>
        </Card>

        {/* Market info sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Countdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                {isOpen ? "Locks In" : "Lock Time"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isOpen ? (
                <CountdownTimer targetDate={new Date(market.locks_at)} />
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {new Date(market.locks_at).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                Market Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-muted-foreground">Total Staked</span>
                <span className="text-sm sm:text-base font-medium">{totalStake.toFixed(0)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-muted-foreground">YES Stakes</span>
                <span className="text-sm sm:text-base font-medium text-green-500">
                  {(market.total_stake_yes ?? 0).toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-muted-foreground">NO Stakes</span>
                <span className="text-sm sm:text-base font-medium text-red-500">
                  {(market.total_stake_no ?? 0).toFixed(0)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-muted-foreground">Oracle Type</span>
                <Badge variant="secondary" className="text-xs">{market.oracle_type}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Prediction Form */}
          <PredictionForm
            marketId={id}
            marketTitle={market.title}
            currentYesProbability={market.weighted_probability_yes ?? 50}
            isMarketOpen={isOpen}
            onPredictionPlaced={handlePredictionPlaced}
          />

          {/* User's Predictions on this Market */}
          {userMarketPredictions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <History className="h-3 w-3 sm:h-4 sm:w-4" />
                  Your Predictions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userMarketPredictions.map((pred) => {
                  const isWinner = isResolved && market.resolution_outcome === pred.position;
                  const isLoser = isResolved && market.resolution_outcome && market.resolution_outcome !== pred.position && market.resolution_outcome !== "INVALID";

                  return (
                    <div
                      key={pred.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        pred.isSettled
                          ? isWinner
                            ? "bg-green-500/10 border border-green-500/20"
                            : isLoser
                            ? "bg-red-500/10 border border-red-500/20"
                            : "bg-muted/50"
                          : "bg-muted/50"
                      }`}
                    >
                      <div className="space-y-1">
                        <Badge
                          variant="outline"
                          className={
                            pred.position === "YES"
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : "bg-red-500/10 text-red-500 border-red-500/20"
                          }
                        >
                          {pred.position}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(pred.createdAt).toLocaleDateString()}
                        </p>
                        {pred.isSettled && (
                          <Badge variant="outline" className="text-xs">
                            {isWinner ? "Won" : isLoser ? "Lost" : "Refunded"}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{pred.stakeAmount}</p>
                        {pred.isSettled && pred.payoutAmount !== null ? (
                          <p className={`text-sm font-medium ${
                            pred.payoutAmount > pred.stakeAmount
                              ? "text-green-500"
                              : pred.payoutAmount < pred.stakeAmount
                              ? "text-red-500"
                              : "text-muted-foreground"
                          }`}>
                            Payout: {pred.payoutAmount.toFixed(1)}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Weighted: {pred.weightedStake.toFixed(1)}
                          </p>
                        )}
                        {pred.repScoreDelta !== null && pred.repScoreDelta !== 0 && (
                          <p className={`text-xs ${
                            pred.repScoreDelta > 0 ? "text-green-500" : "text-red-500"
                          }`}>
                            Rep: {pred.repScoreDelta > 0 ? "+" : ""}{pred.repScoreDelta}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function MarketDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-[400px] lg:col-span-2" />
        <div className="space-y-6">
          <Skeleton className="h-[150px]" />
          <Skeleton className="h-[250px]" />
        </div>
      </div>
    </div>
  );
}
