"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface ProbabilityDataPoint {
  timestamp: string;
  rawProbability: number;
  weightedProbability: number;
  totalStakeYes: number;
  totalStakeNo: number;
}

interface ProbabilityHistoryChartProps {
  data: ProbabilityDataPoint[];
  currentRawProbability: number;
  currentWeightedProbability: number;
  isLoading?: boolean;
  className?: string;
}

export function ProbabilityHistoryChart({
  data,
  currentRawProbability,
  currentWeightedProbability,
  isLoading,
  className,
}: ProbabilityHistoryChartProps) {
  const trend = useMemo(() => {
    if (data.length < 2) return 0;
    const firstWeighted = data[0].weightedProbability;
    const lastWeighted = data[data.length - 1].weightedProbability;
    return (lastWeighted - firstWeighted) * 100;
  }, [data]);

  const chartData = useMemo(() => {
    // If no historical data, create sample data points based on current values
    const displayData = data.length > 0 ? data : [
      { timestamp: "Start", rawProbability: 0.5, weightedProbability: 0.5 },
      { timestamp: "Now", rawProbability: currentRawProbability, weightedProbability: currentWeightedProbability },
    ];

    const labels = displayData.map((d, index) => {
      if (d.timestamp === "Start" || d.timestamp === "Now") return d.timestamp;
      const date = new Date(d.timestamp);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });

    return {
      labels,
      datasets: [
        {
          label: "Weighted Odds",
          data: displayData.map((d) => d.weightedProbability * 100),
          borderColor: "rgb(34, 197, 94)", // emerald-500
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: "rgb(34, 197, 94)",
          pointBorderColor: "hsl(var(--background))",
          pointBorderWidth: 2,
          borderWidth: 3,
        },
        {
          label: "Raw Odds",
          data: displayData.map((d) => d.rawProbability * 100),
          borderColor: "rgb(59, 130, 246)", // blue-500
          backgroundColor: "rgba(59, 130, 246, 0.05)",
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: "rgb(59, 130, 246)",
          pointBorderColor: "hsl(var(--background))",
          pointBorderWidth: 2,
          borderWidth: 2,
          borderDash: [5, 5],
        },
      ],
    };
  }, [data, currentRawProbability, currentWeightedProbability]);

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        align: "end",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
          color: "hsl(var(--muted-foreground))",
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "hsl(var(--popover))",
        titleColor: "hsl(var(--popover-foreground))",
        bodyColor: "hsl(var(--popover-foreground))",
        borderColor: "hsl(var(--border))",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y?.toFixed(1) ?? 0;
            return `${label}: ${value}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "hsl(var(--border) / 0.2)",
          drawTicks: false,
        },
        ticks: {
          color: "hsl(var(--muted-foreground))",
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
          padding: 8,
        },
        border: {
          display: false,
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: "hsl(var(--border) / 0.2)",
          drawTicks: false,
        },
        ticks: {
          color: "hsl(var(--muted-foreground))",
          callback: (value) => `${value}%`,
          stepSize: 25,
          padding: 8,
        },
        border: {
          display: false,
        },
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    elements: {
      line: {
        borderCapStyle: "round",
        borderJoinStyle: "round",
      },
    },
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Probability History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const yesPercent = Math.round(currentWeightedProbability * 100);
  const noPercent = 100 - yesPercent;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Probability History
          </CardTitle>

          {/* Current Probabilities */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                YES {yesPercent}%
              </Badge>
              <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">
                NO {noPercent}%
              </Badge>
            </div>
            {trend !== 0 && (
              <div
                className={cn(
                  "flex items-center text-sm font-medium",
                  trend > 0 ? "text-emerald-500" : trend < 0 ? "text-rose-500" : "text-muted-foreground"
                )}
              >
                {trend > 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : trend < 0 ? (
                  <TrendingDown className="h-4 w-4 mr-1" />
                ) : (
                  <Minus className="h-4 w-4 mr-1" />
                )}
                {trend > 0 ? "+" : ""}
                {trend.toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {data.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <Activity className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm">No historical data yet.</p>
            <p className="text-xs mt-1">Chart will update as predictions are placed.</p>
          </div>
        ) : (
          <div className="h-[300px]">
            <Line data={chartData} options={options} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mini sparkline version for inline display
interface ProbabilitySparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

export function ProbabilitySparkline({
  data,
  color = "rgb(34, 197, 94)",
  height = 40,
  className,
}: ProbabilitySparklineProps) {
  const chartData = useMemo(() => ({
    labels: data.map((_, i) => i.toString()),
    datasets: [
      {
        data,
        borderColor: color,
        backgroundColor: `${color}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  }), [data, color]);

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false, min: 0, max: 100 },
    },
    elements: {
      line: {
        borderCapStyle: "round",
      },
    },
  };

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
