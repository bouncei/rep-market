"use client";

import { useAuth, useCredibility, usePredictions, useAnalytics } from "@/hooks";
import { AuthGuard } from "@/components/auth";
import { RepScoreDisplay, CredibilityBadge } from "@/components/portfolio";
import { RepScoreChart, AccuracyChart } from "@/components/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Target,
  Wallet,
  Trophy,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Prediction } from "@/hooks/use-predictions";

export default function PortfolioPage() {
  return (
    <AuthGuard>
      <PortfolioContent />
    </AuthGuard>
  );
}

function PortfolioContent() {
  const { profile, isLoadingProfile, syncCredibility, isSyncingCredibility } =
    useAuth();
  const { tier, maxStake } = useCredibility(
    profile?.ethosCredibility ?? 0,
    profile?.tier
  );
  const { predictions, portfolioStats, isLoading: isLoadingPredictions } = usePredictions();
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useAnalytics(profile?.id);

  if (isLoadingProfile) {
    return <PortfolioSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-muted-foreground">Unable to load profile</p>
      </div>
    );
  }

  const activePredictions = predictions?.filter(p => !p.isSettled) ?? [];
  const settledPredictions = predictions?.filter(p => p.isSettled) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Portfolio</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Your prediction performance and reputation
          </p>
        </div>
        <Button
          onClick={() => syncCredibility()}
          disabled={isSyncingCredibility}
          variant="outline"
          size="sm"
          className="sm:size-default"
        >
          <RefreshCw
            className={`mr-2 h-3 w-3 sm:h-4 sm:w-4 ${isSyncingCredibility ? "animate-spin" : ""}`}
          />
          <span className="text-xs sm:text-sm">Sync Credibility</span>
        </Button>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">RepScore</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <RepScoreDisplay
                score={profile.repScore}
                size="md"
                showLabel={false}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Tier</CardTitle>
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CredibilityBadge
                credibility={profile.ethosCredibility}
                tier={profile.tier}
                showProgress
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Accuracy</CardTitle>
              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">
                {(profile.stats.accuracyRate * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {profile.stats.correctPredictions} / {profile.stats.totalPredictions} correct
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Won</CardTitle>
              <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">
                {profile.stats.totalWon.toFixed(0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {profile.stats.totalStaked.toFixed(0)} total staked
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <RepScoreChart
            data={analyticsData?.repScoreHistory ?? []}
            isLoading={isLoadingAnalytics}
            currentScore={profile.repScore}
            initialScore={500}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <AccuracyChart
            data={analyticsData?.accuracyByPeriod ?? []}
            isLoading={isLoadingAnalytics}
            overallAccuracy={profile.stats.accuracyRate}
            totalPredictions={portfolioStats?.settledPredictions ?? profile.stats.totalPredictions}
          />
        </motion.div>
      </div>

      {/* Predictions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                Your Predictions
              </CardTitle>
              {portfolioStats && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{portfolioStats.activePredictions} active</span>
                  <span>{portfolioStats.settledPredictions} settled</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingPredictions ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : !predictions || predictions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  You haven't made any predictions yet
                </p>
                <Button asChild>
                  <Link href="/markets">
                    Browse Markets
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="active" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Active ({activePredictions.length})
                  </TabsTrigger>
                  <TabsTrigger value="settled" className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Settled ({settledPredictions.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-4 space-y-3">
                  {activePredictions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No active predictions
                    </div>
                  ) : (
                    activePredictions.map((prediction) => (
                      <PredictionCard key={prediction.id} prediction={prediction} />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="settled" className="mt-4 space-y-3">
                  {settledPredictions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No settled predictions yet
                    </div>
                  ) : (
                    settledPredictions.map((prediction) => (
                      <PredictionCard key={prediction.id} prediction={prediction} />
                    ))
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed Info */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Ethos Credibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-muted-foreground">Ethos Score</span>
                <span className="text-sm sm:text-base font-semibold">{profile.ethosScore}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-muted-foreground">Credibility</span>
                <span className="text-sm sm:text-base font-semibold">
                  {profile.ethosCredibility.toFixed(0)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-muted-foreground">Max Stake per Market</span>
                <span className="text-sm sm:text-base font-semibold">{maxStake}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Ethos Profile</span>
                {profile.ethosProfileId ? (
                  <a
                    href={`https://ethos.network/profile/${profile.ethosProfileId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-primary underline hover:text-primary/80 transition-colors"
                  >
                    View Profile
                  </a>
                ) : (
                  <span className="text-xs sm:text-sm text-muted-foreground">Not linked</span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Performance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-muted-foreground">Total Predictions</span>
                <span className="text-sm sm:text-base font-semibold">
                  {portfolioStats?.totalPredictions ?? profile.stats.totalPredictions}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-muted-foreground">Total Staked</span>
                <span className="text-sm sm:text-base font-semibold">
                  {portfolioStats?.totalStaked.toFixed(0) ?? profile.stats.totalStaked.toFixed(0)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-muted-foreground">Total Weighted Stake</span>
                <span className="text-sm sm:text-base font-semibold">
                  {portfolioStats?.totalWeightedStake.toFixed(1) ?? "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-muted-foreground">Net Rep Change</span>
                <span className={`text-sm sm:text-base font-semibold ${
                  (portfolioStats?.netRepScoreDelta ?? 0) > 0
                    ? "text-green-500"
                    : (portfolioStats?.netRepScoreDelta ?? 0) < 0
                    ? "text-red-500"
                    : ""
                }`}>
                  {(portfolioStats?.netRepScoreDelta ?? 0) > 0 ? "+" : ""}
                  {portfolioStats?.netRepScoreDelta ?? 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function PredictionCard({ prediction }: { prediction: Prediction }) {
  const isWinner = prediction.isSettled && prediction.payoutAmount !== null && prediction.payoutAmount > prediction.stakeAmount;
  const isLoser = prediction.isSettled && prediction.payoutAmount !== null && prediction.payoutAmount < prediction.stakeAmount;

  return (
    <Link href={`/markets/${prediction.marketId}`}>
      <Card className={`transition-colors hover:bg-muted/50 ${
        prediction.isSettled
          ? isWinner
            ? "border-green-500/30 bg-green-500/5"
            : isLoser
            ? "border-red-500/30 bg-red-500/5"
            : ""
          : ""
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate mb-2">
                {prediction.market?.title ?? "Unknown Market"}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={
                    prediction.position === "YES"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  }
                >
                  {prediction.position}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Stake: {prediction.stakeAmount}
                </span>
                <span className="text-xs text-muted-foreground">
                  Weighted: {prediction.weightedStake.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              {prediction.isSettled ? (
                <>
                  <div className="flex items-center gap-1 justify-end mb-1">
                    {isWinner ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : isLoser ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : null}
                    <span className={`font-semibold ${
                      isWinner ? "text-green-500" : isLoser ? "text-red-500" : ""
                    }`}>
                      {prediction.payoutAmount?.toFixed(1) ?? 0}
                    </span>
                  </div>
                  {prediction.repScoreDelta !== null && prediction.repScoreDelta !== 0 && (
                    <span className={`text-xs ${
                      prediction.repScoreDelta > 0 ? "text-green-500" : "text-red-500"
                    }`}>
                      Rep: {prediction.repScoreDelta > 0 ? "+" : ""}{prediction.repScoreDelta}
                    </span>
                  )}
                </>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {prediction.market?.status ?? "Active"}
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {new Date(prediction.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[140px]" />
        ))}
      </div>
      <Skeleton className="h-[400px]" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
    </div>
  );
}
