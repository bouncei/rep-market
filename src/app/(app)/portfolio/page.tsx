"use client";

import { useAuth, useCredibility } from "@/hooks";
import { AuthGuard } from "@/components/auth";
import { RepScoreDisplay, CredibilityBadge } from "@/components/portfolio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Target,
  Wallet,
  Trophy,
  RefreshCw,
} from "lucide-react";

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
      </div>

      {/* Detailed Info */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Prediction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm sm:text-base text-muted-foreground">
                Your prediction history will appear here
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Prediction tracking coming in Phase 2
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
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
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
    </div>
  );
}
