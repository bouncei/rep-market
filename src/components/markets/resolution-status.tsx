"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle, Clock, Loader2 } from "lucide-react";

interface ResolutionStatusProps {
  status: string | null;
  outcome?: string | null;
  resolutionValue?: string | null;
  resolvedAt?: string | null;
  settledAt?: string | null;
  compact?: boolean;
}

const statusConfig: Record<
  string,
  { icon: React.ReactNode; color: string; bgColor: string; label: string }
> = {
  DRAFT: {
    icon: <Clock className="h-4 w-4" />,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    label: "Draft",
  },
  OPEN: {
    icon: <Clock className="h-4 w-4" />,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    label: "Open for Predictions",
  },
  LOCKED: {
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    label: "Locked - Awaiting Resolution",
  },
  RESOLVED: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    label: "Resolved - Settling",
  },
  SETTLED: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    label: "Settled",
  },
  CANCELLED: {
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    label: "Cancelled",
  },
};

const outcomeConfig: Record<
  string,
  { icon: React.ReactNode; color: string; bgColor: string; label: string }
> = {
  YES: {
    icon: <CheckCircle className="h-5 w-5" />,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    label: "YES",
  },
  NO: {
    icon: <XCircle className="h-5 w-5" />,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    label: "NO",
  },
  INVALID: {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    label: "INVALID",
  },
};

export function ResolutionStatus({
  status,
  outcome,
  resolutionValue,
  resolvedAt,
  settledAt,
  compact = false,
}: ResolutionStatusProps) {
  const statusInfo = statusConfig[status || "DRAFT"];
  const outcomeInfo = outcome ? outcomeConfig[outcome] : null;

  if (compact) {
    return (
      <Badge
        variant="outline"
        className={`${statusInfo.bgColor} ${statusInfo.color} flex items-center gap-1`}
      >
        {statusInfo.icon}
        <span>{status}</span>
      </Badge>
    );
  }

  // Full resolution card for resolved/settled markets
  if (outcome && (status === "RESOLVED" || status === "SETTLED")) {
    return (
      <Card className={`${outcomeInfo?.bgColor} border-2 ${outcomeInfo?.color.replace("text-", "border-")}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Resolution</span>
            <Badge variant="outline" className={`${statusInfo.bgColor} ${statusInfo.color}`}>
              {status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-center gap-2 py-4">
            <span className={outcomeInfo?.color}>{outcomeInfo?.icon}</span>
            <span className={`text-3xl font-bold ${outcomeInfo?.color}`}>
              {outcomeInfo?.label}
            </span>
          </div>

          {resolutionValue && (
            <div className="text-center text-sm text-muted-foreground">
              <span className="font-medium">Resolved Value: </span>
              <span className="font-mono">{resolutionValue}</span>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center space-y-1">
            {resolvedAt && (
              <p>Resolved: {new Date(resolvedAt).toLocaleString()}</p>
            )}
            {settledAt && (
              <p>Settled: {new Date(settledAt).toLocaleString()}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Simple status display for non-resolved markets
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg ${statusInfo.bgColor}`}>
      <span className={statusInfo.color}>{statusInfo.icon}</span>
      <span className={`text-sm font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    </div>
  );
}
