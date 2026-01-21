"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Plus, TrendingUp, BarChart3, Users } from "lucide-react";

type OracleType = "price_close" | "metric_threshold" | "count_threshold";

interface OracleConfig {
  asset?: string;
  targetPrice?: number;
  comparison?: "above" | "below";
  protocol?: string;
  chain?: string;
  targetValue?: number;
  metric?: "tvl";
  source?: "ethos";
  countType?: "profiles";
  targetCount?: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [oracleType, setOracleType] = useState<OracleType>("price_close");
  const [category, setCategory] = useState("");

  // Oracle config state
  const [asset, setAsset] = useState("BTC");
  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [comparison, setComparison] = useState<"above" | "below">("above");
  const [protocol, setProtocol] = useState("EIGENLAYER");
  const [targetValue, setTargetValue] = useState<number>(0);
  const [targetCount, setTargetCount] = useState<number>(0);

  // Date state
  const [locksAt, setLocksAt] = useState("");
  const [resolvesAt, setResolvesAt] = useState("");

  const buildOracleConfig = (): OracleConfig => {
    switch (oracleType) {
      case "price_close":
        return {
          asset,
          targetPrice,
          comparison,
        };
      case "metric_threshold":
        return {
          protocol,
          targetValue,
          metric: "tvl",
        };
      case "count_threshold":
        return {
          source: "ethos",
          countType: "profiles",
          targetCount,
        };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/markets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          oracleType,
          oracleConfig: buildOracleConfig(),
          locksAt: new Date(locksAt).toISOString(),
          resolvesAt: new Date(resolvesAt).toISOString(),
          category: category || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create market");
      }

      toast.success("Market created successfully!", {
        description: `Market ID: ${data.market.id}`,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setLocksAt("");
      setResolvesAt("");

      // Navigate to the new market
      router.push(`/markets/${data.market.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create market");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Create Market</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Create a new prediction market with oracle-backed resolution
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Market Details</CardTitle>
            <CardDescription>
              Basic information about the prediction market
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Will BTC be above $100,000 on March 1, 2025?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={10}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Additional details about the market..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="defi">DeFi</SelectItem>
                  <SelectItem value="ethos">Ethos</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Oracle Configuration</CardTitle>
            <CardDescription>
              How the market will be automatically resolved
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Oracle Type *</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={oracleType === "price_close" ? "default" : "outline"}
                  className="h-20 flex flex-col items-center justify-center gap-1"
                  onClick={() => setOracleType("price_close")}
                >
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-xs">Price Close</span>
                </Button>
                <Button
                  type="button"
                  variant={oracleType === "metric_threshold" ? "default" : "outline"}
                  className="h-20 flex flex-col items-center justify-center gap-1"
                  onClick={() => setOracleType("metric_threshold")}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-xs">TVL Threshold</span>
                </Button>
                <Button
                  type="button"
                  variant={oracleType === "count_threshold" ? "default" : "outline"}
                  className="h-20 flex flex-col items-center justify-center gap-1"
                  onClick={() => setOracleType("count_threshold")}
                >
                  <Users className="h-5 w-5" />
                  <span className="text-xs">Ethos Count</span>
                </Button>
              </div>
            </div>

            <Separator />

            {/* Price Close Config */}
            {oracleType === "price_close" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Asset</Label>
                    <Select value={asset} onValueChange={setAsset}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                        <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                        <SelectItem value="SOL">Solana (SOL)</SelectItem>
                        <SelectItem value="AVAX">Avalanche (AVAX)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Comparison</Label>
                    <Select value={comparison} onValueChange={(v) => setComparison(v as "above" | "below")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above">Above</SelectItem>
                        <SelectItem value="below">Below</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Target Price (USD)</Label>
                  <Input
                    type="number"
                    placeholder="100000"
                    value={targetPrice || ""}
                    onChange={(e) => setTargetPrice(Number(e.target.value))}
                    min={0}
                    step="any"
                  />
                </div>
              </div>
            )}

            {/* Metric Threshold Config */}
            {oracleType === "metric_threshold" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Protocol</Label>
                  <Select value={protocol} onValueChange={setProtocol}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EIGENLAYER">EigenLayer</SelectItem>
                      <SelectItem value="LIDO">Lido</SelectItem>
                      <SelectItem value="AAVE">Aave</SelectItem>
                      <SelectItem value="UNISWAP">Uniswap</SelectItem>
                      <SelectItem value="MAKERDAO">MakerDAO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target TVL (USD)</Label>
                  <Input
                    type="number"
                    placeholder="10000000000"
                    value={targetValue || ""}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    min={0}
                    step="any"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter value in USD (e.g., 10B = 10000000000)
                  </p>
                </div>
              </div>
            )}

            {/* Count Threshold Config */}
            {oracleType === "count_threshold" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This market will resolve based on the total number of Ethos profiles.
                </p>
                <div className="space-y-2">
                  <Label>Target Profile Count</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={targetCount || ""}
                    onChange={(e) => setTargetCount(Number(e.target.value))}
                    min={0}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Schedule</CardTitle>
            <CardDescription>
              When the market locks and resolves
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locksAt">Locks At *</Label>
                <Input
                  id="locksAt"
                  type="datetime-local"
                  value={locksAt}
                  onChange={(e) => setLocksAt(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  No more predictions after this time
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resolvesAt">Resolves At *</Label>
                <Input
                  id="resolvesAt"
                  type="datetime-local"
                  value={resolvesAt}
                  onChange={(e) => setResolvesAt(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Oracle fetches data and resolves
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full mt-4" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Market...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Create Market
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
