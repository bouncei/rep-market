"use client";

import { useActiveMarkets } from "@/hooks";
import { MarketCard } from "@/components/markets";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem, ScrollReveal } from "@/components/animations";
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
    <div className="space-y-6 ">
      <ScrollReveal>
        <div>
          <ScrollReveal delay={0.1}>
            <h1 className="text-2xl sm:text-3xl font-bold">Markets</h1>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="text-sm sm:text-base text-muted-foreground">
              Browse active prediction markets and make your forecasts
            </p>
          </ScrollReveal>
        </div>
      </ScrollReveal>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="open">
            Open ({openMarkets.length})
          </TabsTrigger>
          <TabsTrigger value="locked">
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
                  <EmptyState message="No open markets available" />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {openMarkets.map((market, index) => (
                <ScrollReveal
                  key={market.id}
                  delay={index * 0.1}
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
                  <EmptyState message="No locked markets" />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {lockedMarkets.map((market, index) => (
                <ScrollReveal
                  key={market.id}
                  delay={index * 0.1}
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: i * 0.1,
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          <Skeleton className="h-[300px] rounded-lg" />
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      <motion.p
        className="text-muted-foreground"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {message}
      </motion.p>
    </motion.div>
  );
}
