"use client";

import { useState } from "react";
import {
  useLeaderboard,
  getDisplayName,
  getInitials,
  SortBy,
  LeaderboardUser,
} from "@/hooks/use-leaderboard";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { PremiumPodium } from "@/components/leaderboard/premium-podium";
import { getTierConfig } from "@/constants";
import { CredibilityTier } from "@/types";
import {
  Trophy,
  TrendingUp,
  Target,
  Award,
  Crown,
  Users,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function LeaderboardPage() {
  const [sortBy, setSortBy] = useState<SortBy>("rep_score");
  const { data, isLoading, error } = useLeaderboard(sortBy);
  const { profile } = useAuth();

  const topThree = data?.leaderboard.slice(0, 3) ?? [];
  const restOfLeaderboard = data?.leaderboard.slice(3) ?? [];

  // Convert to podium format
  const podiumUsers = topThree.map((user) => ({
    id: user.id,
    rank: user.rank as 1 | 2 | 3,
    displayName: getDisplayName(user),
    avatar: undefined,
    repScore:
      sortBy === "rep_score"
        ? user.rep_score
        : sortBy === "total_won"
        ? user.total_won
        : sortBy === "ethos_credibility"
        ? user.ethos_credibility
        : user.accuracy_rate * 100,
    accuracy: user.accuracy_rate,
    tier: user.tier,
    totalPredictions: user.total_predictions,
  }));

  return (
    <div className="space-y-6">
      {/* Header with Sort */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <SectionHeader
          badge={{ text: "Updated Live", pulse: true, icon: Trophy }}
          title="Leaderboard"
          description={`${data?.stats.totalRankedUsers ?? 0} predictors ranked by performance`}
          className="mb-0"
        />

        {/* Sort Selector */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rep_score">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                RepScore
              </div>
            </SelectItem>
            <SelectItem value="accuracy_rate">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Accuracy
              </div>
            </SelectItem>
            <SelectItem value="ethos_credibility">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Credibility
              </div>
            </SelectItem>
            <SelectItem value="total_won">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Total Won
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User's Rank Card */}
      {data?.userRank && profile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 text-primary font-bold text-lg sm:text-xl">
                    #{data.userRank.rank}
                  </div>
                  <div>
                    <p className="font-semibold text-sm sm:text-base">Your Ranking</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {getDisplayName(data.userRank)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl sm:text-3xl font-bold">
                    {sortBy === "accuracy_rate"
                      ? `${(data.userRank.accuracy_rate * 100).toFixed(1)}%`
                      : sortBy === "total_won"
                      ? data.userRank.total_won.toFixed(0)
                      : sortBy === "ethos_credibility"
                      ? data.userRank.ethos_credibility.toFixed(0)
                      : data.userRank.rep_score.toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {data.userRank.total_predictions} predictions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {isLoading ? (
        <LeaderboardSkeleton />
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">Failed to load leaderboard</p>
          </CardContent>
        </Card>
      ) : data?.leaderboard.length === 0 ? (
        <EmptyState
          title="No Users Yet"
          description="Be the first to make predictions and appear on the leaderboard!"
          icons={[Trophy, TrendingUp, Target]}
          action={{
            label: "Browse Markets",
            href: "/markets",
          }}
        />
      ) : (
        <>
          {/* Top 3 Podium */}
          {topThree.length >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/20 rounded-xl p-4"
            >
              <PremiumPodium users={podiumUsers} />
            </motion.div>
          )}

          {/* Rest of Leaderboard */}
          {restOfLeaderboard.length > 0 && (
            <>
              {/* Desktop Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="hidden md:block overflow-hidden">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-16">Rank</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead className="text-right">
                            {sortBy === "accuracy_rate"
                              ? "Accuracy"
                              : sortBy === "total_won"
                              ? "Won"
                              : sortBy === "ethos_credibility"
                              ? "Credibility"
                              : "RepScore"}
                          </TableHead>
                          <TableHead className="text-right">Predictions</TableHead>
                          <TableHead className="text-right">Win Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {restOfLeaderboard.map((user, index) => (
                          <LeaderboardRow
                            key={user.id}
                            user={user}
                            sortBy={sortBy}
                            isCurrentUser={profile?.id === user.id}
                            index={index}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {restOfLeaderboard.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.03 }}
                  >
                    <LeaderboardMobileCard
                      user={user}
                      sortBy={sortBy}
                      isCurrentUser={profile?.id === user.id}
                    />
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function LeaderboardRow({
  user,
  sortBy,
  isCurrentUser,
  index,
}: {
  user: LeaderboardUser;
  sortBy: SortBy;
  isCurrentUser: boolean;
  index: number;
}) {
  const tierConfig = getTierConfig((user.tier as CredibilityTier) ?? "UNTRUSTED");

  const getValue = () => {
    switch (sortBy) {
      case "accuracy_rate":
        return `${(user.accuracy_rate * 100).toFixed(1)}%`;
      case "total_won":
        return user.total_won.toFixed(0);
      case "ethos_credibility":
        return user.ethos_credibility.toFixed(0);
      default:
        return user.rep_score.toFixed(0);
    }
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "transition-colors hover:bg-muted/30",
        isCurrentUser && "bg-primary/5"
      )}
    >
      <TableCell>
        <span className="text-muted-foreground font-medium">{user.rank}</span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 ring-2 ring-background">
            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
              {getInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div>
            <span className="font-medium text-sm">{getDisplayName(user)}</span>
            {isCurrentUser && (
              <Badge variant="outline" className="ml-2 text-xs">
                You
              </Badge>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn(tierConfig.bgColor, tierConfig.color, tierConfig.borderColor)}
        >
          {tierConfig.displayName}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-semibold font-mono">
        {getValue()}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {user.total_predictions}
      </TableCell>
      <TableCell className="text-right">
        <span
          className={cn(
            "font-medium",
            user.accuracy_rate >= 0.6
              ? "text-emerald-600 dark:text-emerald-400"
              : user.accuracy_rate >= 0.4
              ? "text-amber-600 dark:text-amber-400"
              : "text-red-600 dark:text-red-400"
          )}
        >
          {user.total_predictions > 0
            ? `${((user.correct_predictions / user.total_predictions) * 100).toFixed(0)}%`
            : "-"}
        </span>
      </TableCell>
    </motion.tr>
  );
}

function LeaderboardMobileCard({
  user,
  sortBy,
  isCurrentUser,
}: {
  user: LeaderboardUser;
  sortBy: SortBy;
  isCurrentUser: boolean;
}) {
  const tierConfig = getTierConfig((user.tier as CredibilityTier) ?? "UNTRUSTED");

  const getValue = () => {
    switch (sortBy) {
      case "accuracy_rate":
        return `${(user.accuracy_rate * 100).toFixed(1)}%`;
      case "total_won":
        return user.total_won.toFixed(0);
      case "ethos_credibility":
        return user.ethos_credibility.toFixed(0);
      default:
        return user.rep_score.toFixed(0);
    }
  };

  return (
    <Card className={isCurrentUser ? "border-primary/50 bg-primary/5" : undefined}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 text-muted-foreground font-medium text-sm">
              {user.rank}
            </span>
            <Avatar className="w-10 h-10 ring-2 ring-background">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{getDisplayName(user)}</p>
                {isCurrentUser && (
                  <Badge variant="outline" className="text-xs">
                    You
                  </Badge>
                )}
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "mt-1 text-xs",
                  tierConfig.bgColor,
                  tierConfig.color,
                  tierConfig.borderColor
                )}
              >
                {tierConfig.displayName}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold font-mono">{getValue()}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-3 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Predictions</p>
            <p className="font-semibold">{user.total_predictions}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
            <p
              className={cn(
                "font-semibold",
                user.accuracy_rate >= 0.6
                  ? "text-emerald-600 dark:text-emerald-400"
                  : user.accuracy_rate >= 0.4
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {user.total_predictions > 0
                ? `${((user.correct_predictions / user.total_predictions) * 100).toFixed(0)}%`
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">RepScore</p>
            <p className="font-semibold font-mono">{user.rep_score.toFixed(0)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Podium Skeleton */}
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-40 sm:h-48 pt-8 rounded-xl" />
        <Skeleton className="h-48 sm:h-56 rounded-xl" />
        <Skeleton className="h-36 sm:h-44 pt-12 rounded-xl" />
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
