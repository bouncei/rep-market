"use client";

import { useActiveMarkets } from "@/hooks";
import { MarketCard } from "@/components/markets";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";

export default function MarketsPage() {
  const { data: markets, isLoading, error } = useActiveMarkets();

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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Markets</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Browse active prediction markets and make your forecasts
        </p>
      </div>

      <Tabs defaultValue="open" className="w-full">
        <TabsList>
          <TabsTrigger value="open">
            Open ({openMarkets.length})
          </TabsTrigger>
          <TabsTrigger value="locked">
            Locked ({lockedMarkets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-6">
          {isLoading ? (
            <MarketGridSkeleton />
          ) : openMarkets.length === 0 ? (
            <EmptyState message="No open markets available" />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {openMarkets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="locked" className="mt-6">
          {isLoading ? (
            <MarketGridSkeleton />
          ) : lockedMarkets.length === 0 ? (
            <EmptyState message="No locked markets" />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {lockedMarkets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MarketGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-[300px] rounded-lg" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
