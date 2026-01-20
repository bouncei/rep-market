"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTierConfig } from "@/constants";
import { CredibilityTier } from "@/types";
import { Trophy, TrendingUp, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
  id: string;
  wallet_address: string;
  rep_score: number;
  ethos_credibility: number;
  tier: CredibilityTier;
  total_predictions: number;
  correct_predictions: number;
  accuracy_rate: number;
}

function useLeaderboard(sortBy: "rep_score" | "accuracy_rate" | "ethos_credibility") {
  const supabase = createClient();

  return useQuery<LeaderboardUser[]>({
    queryKey: ["leaderboard", sortBy],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select(
          "id, wallet_address, rep_score, ethos_credibility, tier, total_predictions, correct_predictions, accuracy_rate"
        )
        .gt("total_predictions", 0)
        .order(sortBy, { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as LeaderboardUser[];
    },
  });
}

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Leaderboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Top predictors ranked by performance
        </p>
      </div>

      <Tabs defaultValue="rep_score" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rep_score" className="gap-1 sm:gap-2">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">RepScore</span>
            <span className="sm:hidden">Rep</span>
          </TabsTrigger>
          <TabsTrigger value="accuracy_rate" className="gap-1 sm:gap-2">
            <Target className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Accuracy</span>
            <span className="sm:hidden">Acc</span>
          </TabsTrigger>
          <TabsTrigger value="ethos_credibility" className="gap-1 sm:gap-2">
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Credibility</span>
            <span className="sm:hidden">Cred</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rep_score" className="mt-6">
          <LeaderboardTable sortBy="rep_score" />
        </TabsContent>
        <TabsContent value="accuracy_rate" className="mt-6">
          <LeaderboardTable sortBy="accuracy_rate" />
        </TabsContent>
        <TabsContent value="ethos_credibility" className="mt-6">
          <LeaderboardTable sortBy="ethos_credibility" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LeaderboardTable({
  sortBy,
}: {
  sortBy: "rep_score" | "accuracy_rate" | "ethos_credibility";
}) {
  const { data: users, isLoading } = useLeaderboard(sortBy);

  if (isLoading) {
    return <LeaderboardSkeleton />;
  }

  if (!users || users.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No users with predictions yet. Be the first!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">RepScore</TableHead>
                <TableHead className="text-right">Accuracy</TableHead>
                <TableHead className="text-right">Predictions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => {
                const tierConfig = getTierConfig(user.tier ?? "UNVERIFIED");
                const shortAddress = `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`;

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <RankBadge rank={index + 1} />
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{shortAddress}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          tierConfig.bgColor,
                          tierConfig.color,
                          tierConfig.borderColor
                        )}
                      >
                        {tierConfig.displayName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {(user.rep_score ?? 0).toFixed(0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {((user.accuracy_rate ?? 0) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {user.total_predictions ?? 0}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {users.map((user, index) => {
          const tierConfig = getTierConfig(user.tier ?? "UNVERIFIED");
          const shortAddress = `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`;

          return (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <RankBadge rank={index + 1} />
                    <div>
                      <p className="font-mono text-sm font-medium">{shortAddress}</p>
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
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">RepScore</p>
                    <p className="font-semibold">{(user.rep_score ?? 0).toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
                    <p className="font-semibold">{((user.accuracy_rate ?? 0) * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Predictions</p>
                    <p className="font-semibold">{user.total_predictions ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-500 font-bold">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-400/10 text-slate-400 font-bold">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-600/10 text-amber-600 font-bold">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 text-muted-foreground">
      {rank}
    </span>
  );
}

function LeaderboardSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="space-y-4 p-4">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
