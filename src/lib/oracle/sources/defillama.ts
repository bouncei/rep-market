/**
 * DeFiLlama API Client for TVL data
 * Used for metric_threshold oracle type
 */

const DEFILLAMA_API_BASE = "https://api.llama.fi";

export interface DefiLlamaTVL {
  name: string;
  tvl: number;
  chainTvls?: Record<string, number>;
}

export interface DefiLlamaTVLResponse {
  tvl: number;
  timestamp: string;
  source: "defillama";
  protocol: string;
  rawResponse: unknown;
}

export interface DefiLlamaChainTVLResponse {
  tvl: number;
  timestamp: string;
  source: "defillama";
  chain: string;
  rawResponse: unknown;
}

// Map protocol names to DeFiLlama slugs
const PROTOCOL_SLUGS: Record<string, string> = {
  EIGENLAYER: "eigenlayer",
  LIDO: "lido",
  AAVE: "aave",
  UNISWAP: "uniswap",
  MAKERDAO: "makerdao",
  COMPOUND: "compound-finance",
  CURVE: "curve-dex",
  CONVEX: "convex-finance",
  ROCKET_POOL: "rocket-pool",
  PENDLE: "pendle",
};

// Chain name mapping
const CHAIN_NAMES: Record<string, string> = {
  BASE: "Base",
  ARBITRUM: "Arbitrum",
  OPTIMISM: "Optimism",
  POLYGON: "Polygon",
  ETHEREUM: "Ethereum",
  AVALANCHE: "Avalanche",
  BSC: "BSC",
  SOLANA: "Solana",
};

export class DefiLlamaClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = DEFILLAMA_API_BASE;
  }

  /**
   * Get current TVL for a protocol
   */
  async getProtocolTVL(protocol: string): Promise<DefiLlamaTVLResponse | null> {
    try {
      const slug = PROTOCOL_SLUGS[protocol.toUpperCase()] || protocol.toLowerCase();

      const response = await fetch(`${this.baseUrl}/protocol/${slug}`, {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (!response.ok) {
        console.error(`DeFiLlama API error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (typeof data.tvl !== "number") {
        console.error(`DeFiLlama: No TVL data for ${slug}`);
        return null;
      }

      return {
        tvl: data.tvl,
        timestamp: new Date().toISOString(),
        source: "defillama",
        protocol: data.name || slug,
        rawResponse: {
          name: data.name,
          tvl: data.tvl,
          chainTvls: data.chainTvls,
        },
      };
    } catch (error) {
      console.error("DeFiLlama fetch error:", error);
      return null;
    }
  }

  /**
   * Get current TVL for a blockchain
   */
  async getChainTVL(chain: string): Promise<DefiLlamaChainTVLResponse | null> {
    try {
      const chainName = CHAIN_NAMES[chain.toUpperCase()] || chain;

      const response = await fetch(`${this.baseUrl}/v2/chains`, {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (!response.ok) {
        console.error(`DeFiLlama chains API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const chainData = data.find(
        (c: { name: string }) => c.name.toLowerCase() === chainName.toLowerCase()
      );

      if (!chainData) {
        console.error(`DeFiLlama: No data for chain ${chainName}`);
        return null;
      }

      return {
        tvl: chainData.tvl,
        timestamp: new Date().toISOString(),
        source: "defillama",
        chain: chainData.name,
        rawResponse: chainData,
      };
    } catch (error) {
      console.error("DeFiLlama chain fetch error:", error);
      return null;
    }
  }

  /**
   * Get historical TVL for a protocol at a specific timestamp
   */
  async getHistoricalProtocolTVL(
    protocol: string,
    timestamp: number
  ): Promise<DefiLlamaTVLResponse | null> {
    try {
      const slug = PROTOCOL_SLUGS[protocol.toUpperCase()] || protocol.toLowerCase();

      const response = await fetch(`${this.baseUrl}/protocol/${slug}`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(`DeFiLlama historical API error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      // Find the TVL entry closest to the target timestamp
      if (!data.tvl || !Array.isArray(data.tvl)) {
        // If tvl is a number, return current
        if (typeof data.tvl === "number") {
          return {
            tvl: data.tvl,
            timestamp: new Date(timestamp * 1000).toISOString(),
            source: "defillama",
            protocol: data.name || slug,
            rawResponse: data,
          };
        }
        return null;
      }

      // Find closest timestamp in historical data
      const targetTime = timestamp;
      let closest = data.tvl[0];
      let minDiff = Math.abs(closest.date - targetTime);

      for (const entry of data.tvl) {
        const diff = Math.abs(entry.date - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closest = entry;
        }
      }

      return {
        tvl: closest.totalLiquidityUSD,
        timestamp: new Date(closest.date * 1000).toISOString(),
        source: "defillama",
        protocol: data.name || slug,
        rawResponse: closest,
      };
    } catch (error) {
      console.error("DeFiLlama historical fetch error:", error);
      return null;
    }
  }

  /**
   * Get total TVL across all DeFi protocols
   */
  async getTotalTVL(): Promise<number | null> {
    try {
      const response = await fetch(`${this.baseUrl}/tvl`, {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 300 },
      });

      if (!response.ok) {
        console.error(`DeFiLlama total TVL API error: ${response.status}`);
        return null;
      }

      const tvl = await response.json();
      return typeof tvl === "number" ? tvl : null;
    } catch (error) {
      console.error("DeFiLlama total TVL fetch error:", error);
      return null;
    }
  }
}

export const defillamaClient = new DefiLlamaClient();
