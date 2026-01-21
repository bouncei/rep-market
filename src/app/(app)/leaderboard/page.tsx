"use client";

import { useState } from "react";
import { useLeaderboard, getDisplayName, getInitials, SortBy, LeaderboardUser } from "@/hooks/use-leaderboard";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTierConfig } from "@/constants";
import { CredibilityTier } from "@/types";
import { Trophy, TrendingUp, Target, Award, Crown, Medal, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function LeaderboardPage() {
  const [sortBy, setSortBy] = useState<SortBy>("rep_score");
  const { data, isLoading, error } = useLeaderboard(sortBy);
  const { profile } = useAuth();

  const topThree = data?.leaderboard.slice(0, 3) ?? [];
  const restOfLeaderboard = data?.leaderboard.slice(3) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Leaderboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {data?.stats.totalRankedUsers ?? 0} predictors ranked by performance
          </p>
        </div>

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
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg">
                    #{data.userRank.rank}
                  </div>
                  <div>
                    <p className="font-semibold">Your Ranking</p>
                    <p className="text-sm text-muted-foreground">
                      {getDisplayName(data.userRank)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
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
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No users with predictions yet. Be the first!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top 3 Podium */}
          {topThree.length >= 3 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
              {/* 2nd Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="pt-8"
              >
                <PodiumCard user={topThree[1]} rank={2} sortBy={sortBy} />
              </motion.div>

              {/* 1st Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
              >
                <PodiumCard user={topThree[0]} rank={1} sortBy={sortBy} />
              </motion.div>

              {/* 3rd Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="pt-12"
              >
                <PodiumCard user={topThree[2]} rank={3} sortBy={sortBy} />
              </motion.div>
            </div>
          )}

          {/* Rest of Leaderboard */}
          {restOfLeaderboard.length > 0 && (
            <>
              {/* Desktop Table */}
              <Card className="hidden md:block">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead className="text-right">
                          {sortBy === "accuracy_rate" ? "Accuracy" :
                           sortBy === "total_won" ? "Won" :
                           sortBy === "ethos_credibility" ? "Credibility" : "RepScore"}
                        </TableHead>
                        <TableHead className="text-right">Predictions</TableHead>
                        <TableHead className="text-right">Win Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {restOfLeaderboard.map((user) => (
                        <LeaderboardRow
                          key={user.id}
                          user={user}
                          sortBy={sortBy}
                          isCurrentUser={profile?.id === user.id}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {restOfLeaderboard.map((user) => (
                  <LeaderboardMobileCard
                    key={user.id}
                    user={user}
                    sortBy={sortBy}
                    isCurrentUser={profile?.id === user.id}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function PodiumCard({ user, rank, sortBy }: { user: LeaderboardUser; rank: number; sortBy: SortBy }) {
  const tierConfig = getTierConfig((user.tier as CredibilityTier) ?? "UNTRUSTED");

  const rankStyles = {
    1: {
      bg: "bg-gradient-to-b from-yellow-500/20 to-yellow-500/5",
      border: "border-yellow-500/30",
      icon: <Crown className="h-6 w-6 text-yellow-500" />,
      badge: "bg-yellow-500 text-yellow-950",
    },
    2: {
      bg: "bg-gradient-to-b from-slate-400/20 to-slate-400/5",
      border: "border-slate-400/30",
      icon: <Medal className="h-5 w-5 text-slate-400" />,
      badge: "bg-slate-400 text-slate-950",
    },
    3: {
      bg: "bg-gradient-to-b from-amber-600/20 to-amber-600/5",
      border: "border-amber-600/30",
      icon: <Medal className="h-5 w-5 text-amber-600" />,
      badge: "bg-amber-600 text-amber-950",
    },
  };

  const style = rankStyles[rank as keyof typeof rankStyles];

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
    <Card className={cn("relative overflow-hidden", style.bg, style.border)}>
      <CardContent className="p-3 sm:p-4 text-center">
        {/* Rank Badge */}
        <div className="absolute top-2 right-2">
          <span className={cn("inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold", style.badge)}>
            {rank}
          </span>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-2">
          {style.icon}
        </div>

        {/* Avatar */}
        <Avatar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2">
          <AvatarFallback className="text-sm sm:text-base font-semibold">
            {getInitials(user)}
          </AvatarFallback>
        </Avatar>

        {/* Name */}
        <p className="font-semibold text-xs sm:text-sm truncate mb-1">
          {getDisplayName(user)}
        </p>

        {/* Tier */}
        <Badge
          variant="outline"
          className={cn("text-xs mb-2", tierConfig.bgColor, tierConfig.color, tierConfig.borderColor)}
        >
          {tierConfig.displayName}
        </Badge>

        {/* Value */}
        <p className="text-xl sm:text-2xl font-bold">{getValue()}</p>
        <p className="text-xs text-muted-foreground">
          {user.total_predictions} predictions
        </p>
      </CardContent>
    </Card>
  );
}

function LeaderboardRow({
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
    <TableRow className={isCurrentUser ? "bg-primary/5" : undefined}>
      <TableCell>
        <span className="text-muted-foreground">{user.rank}</span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs">{getInitials(user)}</AvatarFallback>
          </Avatar>
          <span className="font-mono text-sm">{getDisplayName(user)}</span>
          {isCurrentUser && (
            <Badge variant="outline" className="text-xs">You</Badge>
          )}
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
      <TableCell className="text-right font-semibold">{getValue()}</TableCell>
      <TableCell className="text-right text-muted-foreground">
        {user.total_predictions}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {user.total_predictions > 0
          ? `${((user.correct_predictions / user.total_predictions) * 100).toFixed(0)}%`
          : "-"}
      </TableCell>
    </TableRow>
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
            <span className="inline-flex items-center justify-center w-8 h-8 text-muted-foreground font-medium">
              {user.rank}
            </span>
            <Avatar className="w-10 h-10">
              <AvatarFallback>{getInitials(user)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm font-medium">{getDisplayName(user)}</p>
                {isCurrentUser && (
                  <Badge variant="outline" className="text-xs">You</Badge>
                )}
              </div>
              <Badge
                variant="outline"
                className={cn("mt-1 text-xs", tierConfig.bgColor, tierConfig.color, tierConfig.borderColor)}
              >
                {tierConfig.displayName}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">{getValue()}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-3 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Predictions</p>
            <p className="font-semibold">{user.total_predictions}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
            <p className="font-semibold">
              {user.total_predictions > 0
                ? `${((user.correct_predictions / user.total_predictions) * 100).toFixed(0)}%`
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">RepScore</p>
            <p className="font-semibold">{user.rep_score.toFixed(0)}</p>
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
        <Skeleton className="h-48 pt-8" />
        <Skeleton className="h-56" />
        <Skeleton className="h-44 pt-12" />
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
