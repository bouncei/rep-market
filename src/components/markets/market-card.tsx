"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CountdownTimer } from "./countdown-timer";
import { MarketDisplayData } from "@/types";
import { cn } from "@/lib/utils";
import { Clock, Users, TrendingUp, Zap, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { getCategoryConfig, getOracleTypeConfig } from "@/constants/market-categories";

interface MarketCardProps {
  market: MarketDisplayData;
  className?: string;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  OPEN: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  LOCKED: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  RESOLVED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  SETTLED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
};


export function MarketCard({ market, className }: MarketCardProps) {
  const isOpen = market.status === "OPEN";
  const yesProbability = Math.round((market.weightedProbabilityYes ?? 0.5) * 100);
  const noProbability = 100 - yesProbability;

  const categoryConfig = getCategoryConfig(market.category);
  const oracleConfig = getOracleTypeConfig(market.oracleType);
  const CategoryIcon = categoryConfig.icon;
  const OracleIcon = oracleConfig.icon;

  return (
    <Link href={`/markets/${market.id}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Card
          className={cn(
            "overflow-hidden border-border/50 bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5",
            className
          )}
        >
          {/* Header Image/Gradient Area */}
          <div className={cn(
            "relative h-32 sm:h-36 bg-gradient-to-br overflow-hidden",
            categoryConfig.gradient
          )}>
            {/* Decorative elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent" />

            {/* Category Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <Badge className="bg-black/40 backdrop-blur-sm text-white border-0 px-2.5 py-1">
                <CategoryIcon className="w-3 h-3 mr-1" />
                {categoryConfig.label}
              </Badge>
              <Badge className="bg-black/30 backdrop-blur-sm text-white/80 border-0 px-2 py-1 text-xs">
                <OracleIcon className="w-2.5 h-2.5 mr-1" />
                {oracleConfig.label}
              </Badge>
            </div>

            {/* Status Badge */}
            <Badge
              variant="outline"
              className={cn(
                "absolute top-3 right-3 backdrop-blur-sm",
                statusColors[market.status ?? "DRAFT"]
              )}
            >
              {market.status === "OPEN" && <Zap className="w-3 h-3 mr-1" />}
              {market.status}
            </Badge>
          </div>

          <CardContent className="p-4 space-y-4">
            {/* Title */}
            <h3 className="font-semibold text-base sm:text-lg leading-tight line-clamp-2 min-h-[2.5rem]">
              {market.title}
            </h3>

            {/* Probability Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-emerald-400">{yesProbability}%</span>
                <span className="font-bold text-rose-400">{noProbability}%</span>
              </div>
              <div className="relative h-2.5 bg-rose-500/30 rounded-full overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${yesProbability}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
                {/* Divider line */}
                <div
                  className="absolute top-0 h-full w-1 bg-card transform -skew-x-12"
                  style={{ left: `calc(${yesProbability}% - 2px)` }}
                />
              </div>
            </div>

            {/* YES/NO Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="relative overflow-hidden bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-400/50 font-semibold transition-all group"
                onClick={(e) => e.preventDefault()}
              >
                <span className="relative z-10">YES</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </Button>
              <Button
                variant="outline"
                className="relative overflow-hidden bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-400/50 font-semibold transition-all group"
                onClick={(e) => e.preventDefault()}
              >
                <span className="relative z-10">NO</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-400/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </Button>
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              {/* Predictors */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[...Array(Math.min(3, Math.ceil(market.totalStake / 50)))].map((_, i) => (
                    <Avatar key={i} className="w-6 h-6 border-2 border-card">
                      <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                        {String.fromCharCode(65 + i)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {market.totalStake > 0 && (
                  <span className="text-xs text-muted-foreground">
                    +{Math.ceil(market.totalStake / 20)}
                  </span>
                )}
              </div>

              {/* Total Staked */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span className="font-medium">{market.totalStake.toFixed(0)}</span>
              </div>

              {/* Deadline */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {isOpen ? (
                  <CountdownTimer targetDate={market.locksAt} compact />
                ) : (
                  <span>{market.locksAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
