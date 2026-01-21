/**
 * Oracle Resolution Engine
 * Handles deterministic market resolution based on oracle types
 */

import { createHash } from "crypto";
import { coingeckoClient, CoinGeckoPriceResponse } from "./sources/coingecko";
import { defillamaClient, DefiLlamaTVLResponse, DefiLlamaChainTVLResponse } from "./sources/defillama";
import { ethosClient } from "@/lib/ethos/client";

export type OracleType = "price_close" | "metric_threshold" | "count_threshold";
export type ResolutionOutcome = "YES" | "NO" | "INVALID";

export interface OracleConfig {
  type: OracleType;
  // For price_close
  asset?: string;
  targetPrice?: number;
  comparison?: "above" | "below";
  // For metric_threshold
  protocol?: string;
  chain?: string;
  targetValue?: number;
  metric?: "tvl";
  // For count_threshold
  source?: "ethos";
  countType?: "profiles";
  targetCount?: number;
}

export interface EvidenceSnapshot {
  timestamp: string;
  oracleType: OracleType;
  sources: SourceResponse[];
  extractedValue: number | string;
  decision: ResolutionOutcome;
  config: OracleConfig;
}

export interface SourceResponse {
  source: string;
  value: number | string | null;
  timestamp: string;
  rawResponse: unknown;
  error?: string;
}

export interface ResolutionResult {
  outcome: ResolutionOutcome;
  evidence: EvidenceSnapshot;
  evidenceHash: string;
}

/**
 * Generate a deterministic hash of the evidence snapshot
 */
function hashEvidence(evidence: EvidenceSnapshot): string {
  const normalized = JSON.stringify({
    timestamp: evidence.timestamp,
    oracleType: evidence.oracleType,
    sources: evidence.sources.map((s) => ({
      source: s.source,
      value: s.value,
      timestamp: s.timestamp,
    })),
    extractedValue: evidence.extractedValue,
    decision: evidence.decision,
  });

  return createHash("sha256").update(normalized).digest("hex");
}

/**
 * Resolve a price_close oracle
 * Determines if an asset closed above/below a target price
 */
async function resolvePriceClose(config: OracleConfig): Promise<ResolutionResult> {
  const timestamp = new Date().toISOString();
  const sources: SourceResponse[] = [];

  if (!config.asset || config.targetPrice === undefined || !config.comparison) {
    return createInvalidResult("Invalid price_close config", timestamp, config);
  }

  // Fetch from CoinGecko
  const geckoResult = await coingeckoClient.getPrice(config.asset);

  if (geckoResult) {
    sources.push({
      source: "coingecko",
      value: geckoResult.price,
      timestamp: geckoResult.timestamp,
      rawResponse: geckoResult.rawResponse,
    });
  } else {
    sources.push({
      source: "coingecko",
      value: null,
      timestamp,
      rawResponse: null,
      error: "Failed to fetch price",
    });
  }

  // Calculate consensus value (using CoinGecko as primary source)
  const validPrices = sources
    .filter((s): s is SourceResponse & { value: number } => typeof s.value === "number")
    .map((s) => s.value);

  if (validPrices.length === 0) {
    return createInvalidResult("No valid price data available", timestamp, config, sources);
  }

  // Use median for robustness (if we add more sources later)
  const extractedValue = validPrices.sort((a, b) => a - b)[Math.floor(validPrices.length / 2)];

  // Determine outcome
  let decision: ResolutionOutcome;
  if (config.comparison === "above") {
    decision = extractedValue >= config.targetPrice ? "YES" : "NO";
  } else {
    decision = extractedValue <= config.targetPrice ? "YES" : "NO";
  }

  const evidence: EvidenceSnapshot = {
    timestamp,
    oracleType: "price_close",
    sources,
    extractedValue,
    decision,
    config,
  };

  return {
    outcome: decision,
    evidence,
    evidenceHash: hashEvidence(evidence),
  };
}

/**
 * Resolve a metric_threshold oracle
 * Determines if a metric (like TVL) meets a threshold
 */
async function resolveMetricThreshold(config: OracleConfig): Promise<ResolutionResult> {
  const timestamp = new Date().toISOString();
  const sources: SourceResponse[] = [];

  if (config.targetValue === undefined) {
    return createInvalidResult("Invalid metric_threshold config", timestamp, config);
  }

  let tvlResult: DefiLlamaTVLResponse | DefiLlamaChainTVLResponse | null = null;

  // Fetch TVL based on config
  if (config.protocol) {
    tvlResult = await defillamaClient.getProtocolTVL(config.protocol);
  } else if (config.chain) {
    tvlResult = await defillamaClient.getChainTVL(config.chain);
  }

  if (tvlResult) {
    sources.push({
      source: "defillama",
      value: tvlResult.tvl,
      timestamp: tvlResult.timestamp,
      rawResponse: tvlResult.rawResponse,
    });
  } else {
    sources.push({
      source: "defillama",
      value: null,
      timestamp,
      rawResponse: null,
      error: "Failed to fetch TVL",
    });
  }

  const validValues = sources
    .filter((s): s is SourceResponse & { value: number } => typeof s.value === "number")
    .map((s) => s.value);

  if (validValues.length === 0) {
    return createInvalidResult("No valid TVL data available", timestamp, config, sources);
  }

  const extractedValue = validValues[0];

  // Determine outcome (threshold is treated as ">=")
  const decision: ResolutionOutcome = extractedValue >= config.targetValue ? "YES" : "NO";

  const evidence: EvidenceSnapshot = {
    timestamp,
    oracleType: "metric_threshold",
    sources,
    extractedValue,
    decision,
    config,
  };

  return {
    outcome: decision,
    evidence,
    evidenceHash: hashEvidence(evidence),
  };
}

/**
 * Resolve a count_threshold oracle
 * Determines if a count (like Ethos profiles) meets a threshold
 */
async function resolveCountThreshold(config: OracleConfig): Promise<ResolutionResult> {
  const timestamp = new Date().toISOString();
  const sources: SourceResponse[] = [];

  if (config.targetCount === undefined || config.source !== "ethos") {
    return createInvalidResult("Invalid count_threshold config", timestamp, config);
  }

  // Fetch profile count from Ethos
  const profileCount = await ethosClient.getProfileCount();

  sources.push({
    source: "ethos",
    value: profileCount,
    timestamp,
    rawResponse: { count: profileCount },
  });

  if (profileCount === 0) {
    // Could be an error or actually 0
    sources[0].error = "Profile count returned 0 - may be an error";
  }

  const extractedValue = profileCount;

  // Determine outcome (threshold is treated as ">=")
  const decision: ResolutionOutcome = extractedValue >= config.targetCount ? "YES" : "NO";

  const evidence: EvidenceSnapshot = {
    timestamp,
    oracleType: "count_threshold",
    sources,
    extractedValue,
    decision,
    config,
  };

  return {
    outcome: decision,
    evidence,
    evidenceHash: hashEvidence(evidence),
  };
}

/**
 * Create an INVALID result with error context
 */
function createInvalidResult(
  error: string,
  timestamp: string,
  config: OracleConfig,
  sources: SourceResponse[] = []
): ResolutionResult {
  const evidence: EvidenceSnapshot = {
    timestamp,
    oracleType: config.type,
    sources,
    extractedValue: error,
    decision: "INVALID",
    config,
  };

  return {
    outcome: "INVALID",
    evidence,
    evidenceHash: hashEvidence(evidence),
  };
}

/**
 * Main resolution function - routes to appropriate resolver based on oracle type
 */
export async function resolveMarket(
  oracleType: OracleType,
  oracleConfig: OracleConfig
): Promise<ResolutionResult> {
  const config = { ...oracleConfig, type: oracleType };

  switch (oracleType) {
    case "price_close":
      return resolvePriceClose(config);
    case "metric_threshold":
      return resolveMetricThreshold(config);
    case "count_threshold":
      return resolveCountThreshold(config);
    default:
      return createInvalidResult(
        `Unknown oracle type: ${oracleType}`,
        new Date().toISOString(),
        config
      );
  }
}

/**
 * Validate that a market can be resolved
 * Returns true if the resolution time has passed
 */
export function canResolve(resolvesAt: Date | string): boolean {
  const resolveTime = new Date(resolvesAt);
  return new Date() >= resolveTime;
}

/**
 * Check if a market should be locked
 * Returns true if the lock time has passed
 */
export function shouldLock(locksAt: Date | string): boolean {
  const lockTime = new Date(locksAt);
  return new Date() >= lockTime;
}
