"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProbabilityToggle } from "./probability-toggle";
import { CountdownTimer } from "./countdown-timer";
import { MarketDisplayData } from "@/types";
import { cn } from "@/lib/utils";
import { Clock, Users, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/animations";

interface MarketCardProps {
  market: MarketDisplayData;
  className?: string;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  OPEN: "bg-green-500/10 text-green-500 border-green-500/20",
  LOCKED: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  RESOLVED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  SETTLED: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  CANCELLED: "bg-red-500/10 text-red-500 border-red-500/20",
};

const oracleTypeLabels: Record<string, string> = {
  price_close: "Price",
  metric_threshold: "TVL",
  count_threshold: "Count",
};

export function MarketCard({ market, className }: MarketCardProps) {
  const isOpen = market.status === "OPEN";
  const isLocked = market.status === "LOCKED";

  return (
    <Link href={`/markets/${market.id}`}>
      <motion.div
        whileHover={{
          scale: 1.03,
          y: -6,
          rotateX: 2,
          rotateY: -2
        }}
        whileTap={{
          scale: 0.97,
          rotateX: 0,
          rotateY: 0
        }}
        initial={{ rotateX: 0, rotateY: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          mass: 0.8
        }}
        style={{ perspective: 1000 }}
      >
        <Card
          className={cn(
            "transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/50 cursor-pointer h-full overflow-hidden",
            className
          )}
        >
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <CardHeader className="pb-2 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <motion.h3
                className="font-semibold leading-tight line-clamp-2 text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                {market.title}
              </motion.h3>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 text-xs",
                    statusColors[market.status ?? "DRAFT"]
                  )}
                >
                  {market.status}
                </Badge>
              </motion.div>
            </div>
            <motion.div
              className="flex items-center gap-2 flex-wrap"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <Badge variant="secondary" className="text-xs">
                {oracleTypeLabels[market.oracleType]}
              </Badge>
              {market.category && (
                <Badge variant="secondary" className="text-xs">
                  {market.category}
                </Badge>
              )}
            </motion.div>
          </CardHeader>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <CardContent className="py-4">
            <ProbabilityToggle
              rawProbability={market.rawProbabilityYes}
              weightedProbability={market.weightedProbabilityYes}
              size="sm"
            />
          </CardContent>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t">
            <motion.div
              className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              {isOpen && <CountdownTimer targetDate={market.locksAt} compact />}
              {isLocked && <span className="text-yellow-500">Locked</span>}
              {!isOpen && !isLocked && (
                <span>{market.locksAt.toLocaleDateString()}</span>
              )}
            </motion.div>

            <motion.div
              className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{market.totalStake.toFixed(0)} staked</span>
            </motion.div>
          </CardFooter>
        </motion.div>
        </Card>
      </motion.div>
    </Link>
  );
}
