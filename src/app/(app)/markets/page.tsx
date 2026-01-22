"use client";

import { useActiveMarkets } from "@/hooks";
import { MarketCard } from "@/components/markets";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Lock, BarChart3, Target, Zap } from "lucide-react";
import { ScrollReveal } from "@/components/animations";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export default function MarketsPage() {
  const { data: markets, isLoading, error } = useActiveMarkets();
  const [activeTab, setActiveTab] = useState("open");

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Failed to load markets</h2>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  const openMarkets = markets?.filter((m) => m.status === "OPEN") ?? [];
  const lockedMarkets = markets?.filter((m) => m.status === "LOCKED") ?? [];

  return (
    <div className="space-y-6">
      <SectionHeader
        badge={{ text: "Live Markets", pulse: true }}
        title="Markets"
        description="Browse active prediction markets and make your forecasts"
      />

      {/* Stats Summary */}
      {!isLoading && markets && markets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <div className="bg-card border rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Open Markets
            </div>
            <div className="text-xl sm:text-2xl font-bold">{openMarkets.length}</div>
          </div>
          <div className="bg-card border rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm mb-1">
              <Lock className="h-3.5 w-3.5" />
              Locked Markets
            </div>
            <div className="text-xl sm:text-2xl font-bold">{lockedMarkets.length}</div>
          </div>
          <div className="bg-card border rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm mb-1">
              <BarChart3 className="h-3.5 w-3.5" />
              Total Staked
            </div>
            <div className="text-xl sm:text-2xl font-bold">
              {markets.reduce((sum, m) => sum + m.totalStake, 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-card border rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm mb-1">
              <Target className="h-3.5 w-3.5" />
              Avg Probability
            </div>
            <div className="text-xl sm:text-2xl font-bold">
              {(
                (markets.reduce((sum, m) => sum + m.weightedProbabilityYes, 0) /
                  markets.length) *
                100
              ).toFixed(0)}
              %
            </div>
          </div>
        </motion.div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="open" className="gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Open ({openMarkets.length})
          </TabsTrigger>
          <TabsTrigger value="locked" className="gap-2">
            <Lock className="h-3.5 w-3.5" />
            Locked ({lockedMarkets.length})
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {activeTab === "open" && (
            <motion.div
              key="open"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <TabsContent value="open" className="mt-6">
                {isLoading ? (
                  <MarketGridSkeleton />
                ) : openMarkets.length === 0 ? (
                  <EmptyState
                    title="No Open Markets"
                    description="There are no markets currently accepting predictions. Check back soon for new opportunities."
                    icons={[TrendingUp, Target, BarChart3]}
                    action={{
                      label: "View Locked Markets",
                      onClick: () => setActiveTab("locked"),
                    }}
                  />
                ) : (
                  <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {openMarkets.map((market, index) => (
                      <ScrollReveal
                        key={market.id}
                        delay={index * 0.05}
                        direction="up"
                        margin="-50px"
                      >
                        <MarketCard market={market} />
                      </ScrollReveal>
                    ))}
                  </div>
                )}
              </TabsContent>
            </motion.div>
          )}

          {activeTab === "locked" && (
            <motion.div
              key="locked"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <TabsContent value="locked" className="mt-6">
                {isLoading ? (
                  <MarketGridSkeleton />
                ) : lockedMarkets.length === 0 ? (
                  <EmptyState
                    title="No Locked Markets"
                    description="Markets move to locked status when they're awaiting resolution."
                    icons={[Lock]}
                  />
                ) : (
                  <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {lockedMarkets.map((market, index) => (
                      <ScrollReveal
                        key={market.id}
                        delay={index * 0.05}
                        direction="up"
                        margin="-50px"
                      >
                        <MarketCard market={market} />
                      </ScrollReveal>
                    ))}
                  </div>
                )}
              </TabsContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
}

function MarketGridSkeleton() {
  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: i * 0.1,
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <Skeleton className="h-[280px] rounded-xl" />
        </motion.div>
      ))}
    </div>
  );
}
