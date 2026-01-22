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
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

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

interface DataPoint {
  date: string;
  value: number;
}

interface RepScoreChartProps {
  data: DataPoint[];
  isLoading?: boolean;
  currentScore: number;
  initialScore?: number;
}

export function RepScoreChart({ data, isLoading, currentScore, initialScore = 500 }: RepScoreChartProps) {
  const trend = useMemo(() => {
    if (data.length < 2) return 0;
    const change = currentScore - initialScore;
    return change;
  }, [data, currentScore, initialScore]);

  const chartData = useMemo(() => {
    const labels = data.map((d) => {
      const date = new Date(d.date);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });

    return {
      labels,
      datasets: [
        {
          label: "RepScore",
          data: data.map((d) => d.value),
          borderColor: "hsl(var(--primary))",
          backgroundColor: "hsl(var(--primary) / 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: "hsl(var(--primary))",
          pointBorderColor: "hsl(var(--background))",
          pointBorderWidth: 2,
        },
      ],
    };
  }, [data]);

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "hsl(var(--popover))",
        titleColor: "hsl(var(--popover-foreground))",
        bodyColor: "hsl(var(--popover-foreground))",
        borderColor: "hsl(var(--border))",
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => `RepScore: ${context.parsed.y?.toFixed(0) ?? 0}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "hsl(var(--border) / 0.3)",
        },
        ticks: {
          color: "hsl(var(--muted-foreground))",
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
        },
      },
      y: {
        grid: {
          color: "hsl(var(--border) / 0.3)",
        },
        ticks: {
          color: "hsl(var(--muted-foreground))",
        },
        beginAtZero: false,
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">RepScore Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base sm:text-lg">RepScore Trend</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{currentScore.toFixed(0)}</span>
          <div
            className={`flex items-center text-sm ${
              trend > 0
                ? "text-green-500"
                : trend < 0
                ? "text-red-500"
                : "text-muted-foreground"
            }`}
          >
            {trend > 0 ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : trend < 0 ? (
              <TrendingDown className="h-4 w-4 mr-1" />
            ) : (
              <Minus className="h-4 w-4 mr-1" />
            )}
            {trend > 0 ? "+" : ""}
            {trend.toFixed(0)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No history data yet. Make predictions to track your RepScore!
          </div>
        ) : (
          <div className="h-[200px]">
            <Line data={chartData} options={options} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
