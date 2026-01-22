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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  ExternalLink,
  DollarSign,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Prediction, SellPreview } from "@/hooks/use-predictions";
import { toast } from "sonner";
import { useState, useEffect } from "react";

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
  const { tier, maxStake, nextTier, credibilityToNextTier } = useCredibility(
    profile?.ethosCredibility ?? 0,
    profile?.tier
  );
  const {
    predictions,
    portfolioStats,
    isLoading: isLoadingPredictions,
    sellPrediction,
    getSellPreview,
    isSellingPrediction,
    refetchPredictions,
  } = usePredictions();
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
  const totalPredictions = predictions?.length ?? 0;
  const correctPredictions = settledPredictions.filter(p =>
    p.payoutAmount !== null && p.payoutAmount > p.stakeAmount
  ).length;
  const accuracyRate = settledPredictions.length > 0
    ? correctPredictions / settledPredictions.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
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
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isSyncingCredibility ? "animate-spin" : ""}`}
          />
          Sync Credibility
        </Button>
      </div>

      {/* Main Stats - 4 cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* RepScore Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">RepScore</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <RepScoreDisplay
                score={profile.repScore}
                lockedScore={profile.lockedRepScore}
                size="md"
                showLabel={false}
                showBreakdown={profile.lockedRepScore > 0}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Tier Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tier</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CredibilityBadge
                credibility={profile.ethosCredibility}
                tier={profile.tier}
                showProgress
                showIcon
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Accuracy Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {settledPredictions.length > 0
                  ? `${(accuracyRate * 100).toFixed(1)}%`
                  : "-"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {settledPredictions.length > 0
                  ? `${correctPredictions} / ${settledPredictions.length} correct`
                  : "No settled predictions yet"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Won Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Won</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {profile.stats.totalWon.toFixed(0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {profile.lockedRepScore > 0
                  ? `${profile.lockedRepScore.toFixed(0)} currently staked`
                  : `${profile.stats.totalStaked.toFixed(0)} total staked`}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <RepScoreChart
            data={analyticsData?.repScoreHistory ?? []}
            isLoading={isLoadingAnalytics}
            currentScore={profile.repScore}
            initialScore={analyticsData?.user?.initialRepScore ?? profile.ethosCredibility ?? 0}
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
            overallAccuracy={accuracyRate}
            totalPredictions={settledPredictions.length}
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
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Your Predictions
              </CardTitle>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {activePredictions.length} active
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {settledPredictions.length} settled
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingPredictions ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : !predictions || predictions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  You have not made any predictions yet
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
                <TabsList className="w-full grid grid-cols-2 mb-4">
                  <TabsTrigger value="active" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Active ({activePredictions.length})
                  </TabsTrigger>
                  <TabsTrigger value="settled" className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Settled ({settledPredictions.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-3 mt-0">
                  {activePredictions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No active predictions
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {activePredictions.map((prediction) => (
                        <PredictionCard
                          key={prediction.id}
                          prediction={prediction}
                          onSell={sellPrediction.mutate}
                          getSellPreview={getSellPreview}
                          isSellingPrediction={isSellingPrediction}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="settled" className="space-y-3 mt-0">
                  {settledPredictions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No settled predictions yet
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {settledPredictions.map((prediction) => (
                        <PredictionCard key={prediction.id} prediction={prediction} />
                      ))}
                    </div>
                 
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Info Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Ethos Credibility Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Ethos Credibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Credibility Score</span>
                <span className="text-lg font-semibold">
                  {profile.ethosCredibility.toFixed(0)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Current Tier</span>
                <Badge
                  variant="outline"
                  className={`${tier.bgColor} ${tier.color} ${tier.borderColor}`}
                >
                  {tier.displayName}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Max Stake per Market</span>
                <span className="font-semibold">{maxStake}</span>
              </div>
              {nextTier && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Next Tier</span>
                  <span className="text-sm">
                    <span className="font-medium">{nextTier.displayName}</span>
                    <span className="text-muted-foreground ml-1">
                      ({credibilityToNextTier.toFixed(0)} more)
                    </span>
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Ethos Profile</span>
                {profile.twitterUsername ? (
                  <a
                    href={`https://app.ethos.network/profile/x/${profile.twitterUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View Profile
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">Not linked</span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Performance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Total Predictions</span>
                <span className="text-lg font-semibold">{totalPredictions}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Win Rate</span>
                <span className="font-semibold">
                  {settledPredictions.length > 0
                    ? `${(accuracyRate * 100).toFixed(1)}%`
                    : "-"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Total Staked</span>
                <span className="font-semibold">
                  {portfolioStats?.totalStaked.toFixed(0) ?? profile.stats.totalStaked.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Total Weighted Stake</span>
                <span className="font-semibold">
                  {portfolioStats?.totalWeightedStake.toFixed(1) ?? "-"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Net Rep Change</span>
                <span className={`font-semibold ${
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

interface PredictionCardProps {
  prediction: Prediction;
  onSell?: (predictionId: string) => void;
  getSellPreview?: (predictionId: string) => Promise<SellPreview>;
  isSellingPrediction?: boolean;
}

function PredictionCard({ prediction, onSell, getSellPreview, isSellingPrediction }: PredictionCardProps) {
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [sellPreview, setSellPreview] = useState<SellPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const isWinner = prediction.isSettled && prediction.payoutAmount !== null && prediction.payoutAmount > prediction.stakeAmount;
  const isLoser = prediction.isSettled && prediction.payoutAmount !== null && prediction.payoutAmount < prediction.stakeAmount;
  const canSell = !prediction.isSettled && prediction.market?.status === "OPEN" && onSell;

  // Fetch sell preview when dialog opens
  useEffect(() => {
    if (sellDialogOpen && getSellPreview && !sellPreview) {
      setIsLoadingPreview(true);
      getSellPreview(prediction.id)
        .then(setSellPreview)
        .catch((err) => {
          toast.error(err.message || "Failed to load sell preview");
          setSellDialogOpen(false);
        })
        .finally(() => setIsLoadingPreview(false));
    }
  }, [sellDialogOpen, getSellPreview, prediction.id, sellPreview]);

  const handleSell = () => {
    if (onSell) {
      onSell(prediction.id);
      setSellDialogOpen(false);
      toast.success("Position sold successfully");
    }
  };

  const cardContent = (
    <Card className={`transition-all hover:bg-muted/50 hover:shadow-sm ${
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
            <p className="font-medium text-sm line-clamp-2 mb-2">
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
                <div className="flex items-center gap-1.5 justify-end mb-1">
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
              <div className="flex items-center gap-2">
                {canSell && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSellDialogOpen(true);
                    }}
                  >
                    <DollarSign className="h-3 w-3 mr-1" />
                    Sell
                  </Button>
                )}
                <Badge variant="secondary" className="text-xs">
                  {prediction.market?.status ?? "OPEN"}
                </Badge>
              </div>
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
  );

  return (
    <>
      <Link href={`/markets/${prediction.marketId}`}>
        {cardContent}
      </Link>

      {/* Sell Dialog */}
      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sell Position</DialogTitle>
            <DialogDescription>
              Exit your {prediction.position} position on this market at the current price.
            </DialogDescription>
          </DialogHeader>

          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sellPreview ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Position</span>
                  <Badge
                    variant="outline"
                    className={
                      sellPreview.position === "YES"
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    }
                  >
                    {sellPreview.position}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Original Stake</span>
                  <span className="font-medium">{sellPreview.originalStake}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Probability</span>
                  <span className="font-medium">{(sellPreview.currentProbability * 100).toFixed(1)}%</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base Value</span>
                  <span>{sellPreview.sellValue.baseValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price Impact</span>
                  <span className="text-orange-500">-{sellPreview.sellValue.priceImpact.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fee (2%)</span>
                  <span className="text-orange-500">-{sellPreview.sellValue.fee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>You Receive</span>
                  <span className="text-lg">{sellPreview.sellValue.netValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profit/Loss</span>
                  <span className={sellPreview.profitLoss.amount >= 0 ? "text-green-500" : "text-red-500"}>
                    {sellPreview.profitLoss.amount >= 0 ? "+" : ""}{sellPreview.profitLoss.amount.toFixed(2)}
                    {" "}({sellPreview.profitLoss.percent >= 0 ? "+" : ""}{sellPreview.profitLoss.percent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSellDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSell}
              disabled={isSellingPrediction || isLoadingPreview || !sellPreview?.canSell}
            >
              {isSellingPrediction ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Selling...
                </>
              ) : (
                "Confirm Sell"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-96" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
