"use client";

import { use, useCallback, useMemo } from "react";
import { useMarket, usePredictions, useMarketRealtimeUpdates } from "@/hooks";
import { ProbabilityToggle, CountdownTimer, ResolutionStatus } from "@/components/markets";
import { PredictionForm } from "@/components/predictions";
import { ProbabilityHistoryChart } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  History,
  Zap,
  Target,
  BarChart3,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MarketDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusConfig: Record<string, { color: string; icon: typeof Zap }> = {
  DRAFT: { color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: Clock },
  OPEN: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: Zap },
  LOCKED: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
  RESOLVED: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Target },
  SETTLED: { color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Target },
  CANCELLED: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertCircle },
};

const oracleTypeLabels: Record<string, string> = {
  price_close: "Price Oracle",
  metric_threshold: "TVL Oracle",
  count_threshold: "Count Oracle",
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

  // Generate sample probability history data (in production, this would come from the API)
  const probabilityHistory = useMemo(() => {
    if (!market) return [];
    // For now, return empty array - in production this would be fetched from predictions history
    return [];
  }, [market]);

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
  const totalStake = (market.total_stake_yes ?? 0) + (market.total_stake_no ?? 0);
  const yesProbability = Math.round((market.weighted_probability_yes ?? 0.5) * 100);
  const noProbability = 100 - yesProbability;
  const StatusIcon = statusConfig[market.status ?? "DRAFT"].icon;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href="/markets">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Markets</span>
        </Link>
      </Button>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-background border"
      >
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

        <div className="relative p-6 sm:p-8">
          {/* Status and Oracle badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge
              variant="outline"
              className={cn("gap-1.5", statusConfig[market.status ?? "DRAFT"].color)}
            >
              <StatusIcon className="h-3 w-3" />
              {market.status}
            </Badge>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              <Sparkles className="h-3 w-3 mr-1" />
              {oracleTypeLabels[market.oracle_type] || market.oracle_type}
            </Badge>
            {market.category && (
              <Badge variant="secondary">{market.category}</Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
            {market.title}
          </h1>

          {market.description && (
            <p className="text-muted-foreground text-sm sm:text-base max-w-3xl mb-6">
              {market.description}
            </p>
          )}

          {/* Quick Stats Row */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Total Staked</p>
                <p className="font-semibold">{totalStake.toFixed(0)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">YES Stakes</p>
                <p className="font-semibold text-emerald-500">{(market.total_stake_yes ?? 0).toFixed(0)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-rose-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">NO Stakes</p>
                <p className="font-semibold text-rose-500">{(market.total_stake_no ?? 0).toFixed(0)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{isOpen ? "Locks In" : "Locked At"}</p>
                {isOpen ? (
                  <CountdownTimer targetDate={new Date(market.locks_at)} compact className="font-semibold" />
                ) : (
                  <p className="font-semibold text-xs">
                    {new Date(market.locks_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Resolution Status for resolved/settled markets */}
      {isResolved && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ResolutionStatus
            status={market.status}
            outcome={market.resolution_outcome}
            resolutionValue={market.resolution_value}
            settledAt={market.settled_at}
          />
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Charts and Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Large Probability Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                {/* Probability Bar */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-4xl sm:text-5xl font-bold text-emerald-500">{yesProbability}%</p>
                      <p className="text-sm text-muted-foreground">YES Probability</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-4xl sm:text-5xl font-bold text-rose-500">{noProbability}%</p>
                      <p className="text-sm text-muted-foreground">NO Probability</p>
                    </div>
                  </div>

                  {/* Large Progress Bar */}
                  <div className="relative h-6 bg-rose-500/20 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${yesProbability}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                    {/* Divider */}
                    <div
                      className="absolute top-0 h-full w-1.5 bg-background transform -skew-x-12"
                      style={{ left: `calc(${yesProbability}% - 3px)` }}
                    />
                  </div>

                  {/* YES/NO Buttons */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Button
                      size="lg"
                      className="relative overflow-hidden bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 rounded-xl border border-emerald-400/30 hover:border-emerald-300/50 transition-all group"
                    >
                      <span className="relative z-10 text-lg">BET YES</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </Button>
                    <Button
                      size="lg"
                      className="relative overflow-hidden bg-rose-600 hover:bg-rose-700 text-white font-semibold py-6 rounded-xl border border-rose-400/30 hover:border-rose-300/50 transition-all group"
                    >
                      <span className="relative z-10 text-lg">BET NO</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-300/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </Button>
                  </div>

                  {/* Raw vs Weighted Toggle */}
                  <div className="flex justify-center pt-4 border-t">
                    <ProbabilityToggle
                      rawProbability={market.raw_probability_yes ?? 0.5}
                      weightedProbability={market.weighted_probability_yes ?? 0.5}
                      size="sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Probability History Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ProbabilityHistoryChart
              data={probabilityHistory}
              currentRawProbability={market.raw_probability_yes ?? 0.5}
              currentWeightedProbability={market.weighted_probability_yes ?? 0.5}
            />
          </motion.div>

          {/* Market Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Market Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Total Pool</p>
                    <p className="text-xl font-bold">{totalStake.toFixed(0)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-emerald-500/10">
                    <p className="text-xs text-muted-foreground mb-1">YES Pool</p>
                    <p className="text-xl font-bold text-emerald-500">
                      {(market.total_stake_yes ?? 0).toFixed(0)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-rose-500/10">
                    <p className="text-xs text-muted-foreground mb-1">NO Pool</p>
                    <p className="text-xl font-bold text-rose-500">
                      {(market.total_stake_no ?? 0).toFixed(0)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Weighted YES</p>
                    <p className="text-xl font-bold">
                      {(market.total_weighted_stake_yes ?? 0).toFixed(1)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Prediction Form and User Predictions */}
        <div className="space-y-6">
          {/* Countdown Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  {isOpen ? "Market Closes In" : "Market Status"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isOpen ? (
                  <CountdownTimer targetDate={new Date(market.locks_at)} />
                ) : (
                  <div className="text-center py-4">
                    <Badge
                      variant="outline"
                      className={cn("text-lg px-4 py-2", statusConfig[market.status ?? "DRAFT"].color)}
                    >
                      {market.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(market.locks_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Prediction Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PredictionForm
              marketId={id}
              marketTitle={market.title}
              currentYesProbability={market.weighted_probability_yes ?? 50}
              isMarketOpen={isOpen}
              onPredictionPlaced={handlePredictionPlaced}
            />
          </motion.div>

          {/* User's Predictions on this Market */}
          {userMarketPredictions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <History className="h-4 w-4" />
                    Your Predictions ({userMarketPredictions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {userMarketPredictions.map((pred) => {
                    const isWinner = isResolved && market.resolution_outcome === pred.position;
                    const isLoser = isResolved && market.resolution_outcome && market.resolution_outcome !== pred.position && market.resolution_outcome !== "INVALID";

                    return (
                      <div
                        key={pred.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-all",
                          pred.isSettled
                            ? isWinner
                              ? "bg-emerald-500/10 border-emerald-500/30"
                              : isLoser
                              ? "bg-rose-500/10 border-rose-500/30"
                              : "bg-muted/50 border-border"
                            : "bg-muted/30 border-border hover:bg-muted/50"
                        )}
                      >
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              pred.position === "YES"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            )}
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
                          <p className="font-semibold">{pred.stakeAmount}</p>
                          {pred.isSettled && pred.payoutAmount !== null ? (
                            <p className={cn(
                              "text-sm font-medium",
                              pred.payoutAmount > pred.stakeAmount
                                ? "text-emerald-500"
                                : pred.payoutAmount < pred.stakeAmount
                                ? "text-rose-500"
                                : "text-muted-foreground"
                            )}>
                              Payout: {pred.payoutAmount.toFixed(1)}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Weighted: {pred.weightedStake.toFixed(1)}
                            </p>
                          )}
                          {pred.repScoreDelta !== null && pred.repScoreDelta !== 0 && (
                            <p className={cn(
                              "text-xs",
                              pred.repScoreDelta > 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                              Rep: {pred.repScoreDelta > 0 ? "+" : ""}{pred.repScoreDelta}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
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
      <Skeleton className="h-[200px] w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[400px]" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    </div>
  );
}
