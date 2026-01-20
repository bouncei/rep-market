import { Tables } from "./database";

export type Market = Tables<"markets">;

export type MarketStatus =
  | "DRAFT"
  | "OPEN"
  | "LOCKED"
  | "RESOLVED"
  | "SETTLED"
  | "CANCELLED";

export type OracleType = "price_close" | "metric_threshold" | "count_threshold";

export type ResolutionOutcome = "YES" | "NO" | "INVALID";

// Oracle config types for different oracle types
export interface PriceCloseConfig {
  asset: string;
  threshold: number;
  comparison: "above" | "below";
  sources: string[];
}

export interface MetricThresholdConfig {
  protocol: string;
  metric: string;
  threshold: number;
  comparison: "gte" | "lte" | "gt" | "lt";
}

export interface CountThresholdConfig {
  entity: string;
  threshold: number;
  comparison: "gte" | "lte" | "gt" | "lt";
}

export type OracleConfig =
  | PriceCloseConfig
  | MetricThresholdConfig
  | CountThresholdConfig;

// Market with typed oracle config
export interface TypedMarket extends Omit<Market, "oracle_config"> {
  oracle_config: OracleConfig;
}

// Market card display data
export interface MarketDisplayData {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: MarketStatus | null;
  locksAt: Date;
  rawProbabilityYes: number;
  weightedProbabilityYes: number;
  totalStake: number;
  oracleType: OracleType;
}
