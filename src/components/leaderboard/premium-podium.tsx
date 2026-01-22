"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Medal } from "lucide-react";
import { motion } from "framer-motion";
import { getTierConfig } from "@/constants";
import { CredibilityTier } from "@/types";

interface PodiumUser {
  id: string;
  rank: number;
  displayName: string;
  avatar?: string;
  repScore: number;
  accuracy: number;
  tier?: string;
  totalPredictions: number;
}

interface PremiumPodiumProps {
  users: PodiumUser[];
  metric?: "repScore" | "accuracy" | "totalWon";
}

const podiumConfig = {
  1: {
    height: "h-28 sm:h-32",
    avatarSize: "h-16 w-16 sm:h-20 sm:w-20",
    bgGradient: "from-amber-400 to-yellow-500",
    ringColor: "ring-yellow-400",
    delay: 0.3,
    icon: Crown,
  },
  2: {
    height: "h-20 sm:h-24",
    avatarSize: "h-12 w-12 sm:h-16 sm:w-16",
    bgGradient: "from-zinc-300 to-zinc-400",
    ringColor: "ring-zinc-300",
    delay: 0.4,
    icon: Medal,
  },
  3: {
    height: "h-16 sm:h-20",
    avatarSize: "h-10 w-10 sm:h-14 sm:w-14",
    bgGradient: "from-amber-600 to-amber-700",
    ringColor: "ring-amber-600",
    delay: 0.5,
    icon: Medal,
  },
};

export function PremiumPodium({ users, metric = "repScore" }: PremiumPodiumProps) {
  // Reorder for display: 2nd, 1st, 3rd
  const sortedUsers = [
    users.find((u) => u.rank === 2),
    users.find((u) => u.rank === 1),
    users.find((u) => u.rank === 3),
  ].filter(Boolean) as PodiumUser[];

  if (sortedUsers.length < 3) return null;

  const getValue = (user: PodiumUser) => {
    switch (metric) {
      case "accuracy":
        return `${(user.accuracy * 100).toFixed(1)}%`;
      case "totalWon":
        return user.repScore.toLocaleString();
      default:
        return user.repScore.toLocaleString();
    }
  };

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-4 py-6 sm:py-8">
      {sortedUsers.map((user) => {
        const config = podiumConfig[user.rank as 1 | 2 | 3];
        const tierConfig = getTierConfig((user.tier as CredibilityTier) ?? "UNTRUSTED");
        const Icon = config.icon;

        return (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: config.delay, duration: 0.5 }}
            className="flex flex-col items-center"
          >
            {/* Avatar with crown/medal */}
            <div className="relative mb-2 sm:mb-3">
              {user.rank === 1 && (
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2"
                >
                  <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 fill-yellow-500" />
                </motion.div>
              )}
              <Avatar
                className={cn(
                  config.avatarSize,
                  "ring-4",
                  config.ringColor,
                  "shadow-lg"
                )}
              >
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-base sm:text-xl">
                  {user.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Badge
                className={cn(
                  "absolute -bottom-2 left-1/2 -translate-x-1/2",
                  "bg-gradient-to-r text-white font-bold shadow-md text-xs",
                  config.bgGradient
                )}
              >
                #{user.rank}
              </Badge>
            </div>

            {/* User info */}
            <p className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1 truncate max-w-20 sm:max-w-24">
              {user.displayName}
            </p>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] sm:text-xs mb-1 sm:mb-2",
                tierConfig.bgColor,
                tierConfig.color,
                tierConfig.borderColor
              )}
            >
              {tierConfig.displayName}
            </Badge>

            {/* Podium block */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: config.delay + 0.2, duration: 0.3 }}
              style={{ originY: 1 }}
              className={cn(
                "w-20 sm:w-24 rounded-t-lg bg-gradient-to-b flex flex-col items-center justify-center gap-0.5",
                config.height,
                config.bgGradient
              )}
            >
              <span className="text-white font-bold text-sm sm:text-lg">
                {getValue(user)}
              </span>
              <span className="text-white/70 text-[10px] sm:text-xs">
                {user.totalPredictions} trades
              </span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
