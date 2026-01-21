"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCredibility } from "@/hooks/use-credibility";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { AlertCircle, Loader2, TrendingUp, TrendingDown, Info } from "lucide-react";
import { toast } from "sonner";

interface PredictionFormProps {
  marketId: string;
  marketTitle: string;
  currentYesProbability: number;
  isMarketOpen: boolean;
  onPredictionPlaced?: (prediction: PredictionResult) => void;
}

interface PredictionResult {
  id: string;
  position: "YES" | "NO";
  stakeAmount: number;
  weightedStake: number;
  marketUpdates?: {
    rawProbabilityYes: number;
    weightedProbabilityYes: number;
  };
}

export function PredictionForm({
  marketId,
  marketTitle,
  currentYesProbability,
  isMarketOpen,
  onPredictionPlaced,
}: PredictionFormProps) {
  const { isAuthenticated, profile, login } = useAuth();
  const { tier, maxStake } = useCredibility(
    profile?.ethosCredibility ?? 0,
    profile?.tier
  );

  const [position, setPosition] = useState<"YES" | "NO" | null>(null);
  const [stakeAmount, setStakeAmount] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingStake, setExistingStake] = useState<number>(0);

  const availableStake = Math.max(0, maxStake - existingStake);
  const canPlacePrediction = isMarketOpen && position && stakeAmount > 0 && stakeAmount <= availableStake;

  const handlePlacePrediction = async () => {
    if (!profile || !position) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId,
          userId: profile.id,
          position,
          stakeAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details?.existingStake !== undefined) {
          setExistingStake(data.details.existingStake);
        }
        throw new Error(data.error || "Failed to place prediction");
      }

      toast.success(`Prediction placed: ${stakeAmount} on ${position}`, {
        description: `Your weighted stake is ${data.prediction.weightedStake.toFixed(2)}`,
      });

      // Reset form
      setPosition(null);
      setStakeAmount(1);
      setExistingStake((prev) => prev + stakeAmount);

      // Notify parent
      if (onPredictionPlaced) {
        onPredictionPlaced(data.prediction);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to place prediction");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Make a Prediction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your wallet to place predictions on this market.
          </p>
          <Button className="w-full" onClick={login}>
            Connect to Predict
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Market not open
  if (!isMarketOpen) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Predictions Closed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">This market is not accepting predictions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm sm:text-base">
          <span>Make a Prediction</span>
          <Badge className={`${tier.bgColor} ${tier.color} ${tier.borderColor}`}>
            {tier.displayName}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Position Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Your Position</Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={position === "YES" ? "default" : "outline"}
              className={`h-16 flex flex-col items-center justify-center gap-1 ${
                position === "YES" ? "bg-green-600 hover:bg-green-700" : ""
              }`}
              onClick={() => setPosition("YES")}
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-semibold">YES</span>
            </Button>
            <Button
              variant={position === "NO" ? "default" : "outline"}
              className={`h-16 flex flex-col items-center justify-center gap-1 ${
                position === "NO" ? "bg-red-600 hover:bg-red-700" : ""
              }`}
              onClick={() => setPosition("NO")}
            >
              <TrendingDown className="h-5 w-5" />
              <span className="text-sm font-semibold">NO</span>
            </Button>
          </div>
        </div>

        {/* Stake Amount */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Stake Amount</Label>
            <span className="text-xs text-muted-foreground">
              Max: {availableStake} (Tier limit: {maxStake})
            </span>
          </div>
          <div className="space-y-4">
            <Slider
              value={[stakeAmount]}
              min={1}
              max={Math.max(1, availableStake)}
              step={1}
              onValueChange={(values) => setStakeAmount(values[0])}
              disabled={availableStake <= 0}
            />
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={stakeAmount}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 0 && value <= availableStake) {
                    setStakeAmount(value);
                  }
                }}
                min={1}
                max={availableStake}
                className="w-24"
                disabled={availableStake <= 0}
              />
              <div className="flex gap-2">
                {[10, 25, 50, 100].map((amount) => (
                  amount <= availableStake && (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setStakeAmount(amount)}
                      className="text-xs"
                    >
                      {amount}
                    </Button>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stake Info */}
        {existingStake > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <Info className="h-4 w-4" />
            <span>You have {existingStake} already staked on this market.</span>
          </div>
        )}

        {/* Weighted Stake Preview */}
        {position && stakeAmount > 0 && (
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Raw Stake</span>
              <span className="font-medium">{stakeAmount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Credibility Weight</span>
              <span className="font-medium">
                {((1 + (profile?.ethosCredibility ?? 0) / 1000) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2 mt-2">
              <span className="font-medium">Weighted Stake</span>
              <span className="font-bold text-primary">
                {(stakeAmount * (1 + (profile?.ethosCredibility ?? 0) / 1000)).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          className="w-full"
          size="lg"
          disabled={!canPlacePrediction || isSubmitting}
          onClick={handlePlacePrediction}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Placing Prediction...
            </>
          ) : position ? (
            `Predict ${position} with ${stakeAmount}`
          ) : (
            "Select a Position"
          )}
        </Button>

        {availableStake <= 0 && (
          <p className="text-xs text-center text-destructive">
            You have reached your stake limit for this market.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
