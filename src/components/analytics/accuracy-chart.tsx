"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Percent } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AccuracyDataPoint {
  period: string;
  wins: number;
  losses: number;
  total: number;
  accuracy: number;
}

interface AccuracyChartProps {
  data: AccuracyDataPoint[];
  isLoading?: boolean;
  overallAccuracy: number;
  totalPredictions: number;
}

export function AccuracyChart({
  data,
  isLoading,
  overallAccuracy,
  totalPredictions,
}: AccuracyChartProps) {
  const chartData = useMemo(() => {
    return {
      labels: data.map((d) => d.period),
      datasets: [
        {
          label: "Wins",
          data: data.map((d) => d.wins),
          backgroundColor: "hsl(142.1, 76.2%, 36.3%)",
          borderRadius: 4,
        },
        {
          label: "Losses",
          data: data.map((d) => d.losses),
          backgroundColor: "hsl(346.8, 77.2%, 49.8%)",
          borderRadius: 4,
        },
      ],
    };
  }, [data]);

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "hsl(var(--muted-foreground))",
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: "hsl(var(--popover))",
        titleColor: "hsl(var(--popover-foreground))",
        bodyColor: "hsl(var(--popover-foreground))",
        borderColor: "hsl(var(--border))",
        borderWidth: 1,
        padding: 12,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          color: "hsl(var(--muted-foreground))",
        },
      },
      y: {
        stacked: true,
        grid: {
          color: "hsl(var(--border) / 0.3)",
        },
        ticks: {
          color: "hsl(var(--muted-foreground))",
          stepSize: 1,
        },
        beginAtZero: true,
      },
    },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Prediction Accuracy</CardTitle>
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
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Target className="h-4 w-4" />
          Prediction Accuracy
        </CardTitle>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-1 text-2xl font-bold">
              {(overallAccuracy * 100).toFixed(1)}
              <Percent className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              {totalPredictions} settled predictions
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No settled predictions yet. Your accuracy will appear here!
          </div>
        ) : (
          <div className="h-[200px]">
            <Bar data={chartData} options={options} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
