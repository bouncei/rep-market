/**
 * CoinGecko API Client for price data
 * Used for price_close oracle type
 */

const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

export interface CoinGeckoPrice {
  id: string;
  symbol: string;
  current_price: number;
  price_change_24h: number;
  last_updated: string;
}

export interface CoinGeckoPriceResponse {
  price: number;
  timestamp: string;
  source: "coingecko";
  rawResponse: unknown;
}

// Map common symbols to CoinGecko IDs
const SYMBOL_TO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  AVAX: "avalanche-2",
  MATIC: "matic-network",
  ARB: "arbitrum",
  OP: "optimism",
  LINK: "chainlink",
  UNI: "uniswap",
  AAVE: "aave",
};

export class CoinGeckoClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.baseUrl = COINGECKO_API_BASE;
    this.apiKey = apiKey || COINGECKO_API_KEY;
  }

  /**
   * Get current price for a cryptocurrency
   */
  async getPrice(symbol: string): Promise<CoinGeckoPriceResponse | null> {
    try {
      const coinId = SYMBOL_TO_ID[symbol.toUpperCase()] || symbol.toLowerCase();
      const apiKeyParam = this.apiKey ? `&x_cg_demo_api_key=${this.apiKey}` : "";

      const response = await fetch(
        `${this.baseUrl}/simple/price?ids=${coinId}&vs_currencies=usd&include_last_updated_at=true${apiKeyParam}`,
        {
          headers: {
            Accept: "application/json",
          },
          next: { revalidate: 60 }, // Cache for 1 minute
        }
      );

      if (!response.ok) {
        console.error(`CoinGecko API error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (!data[coinId]) {
        console.error(`CoinGecko: No data for ${coinId}`);
        return null;
      }

      return {
        price: data[coinId].usd,
        timestamp: new Date(data[coinId].last_updated_at * 1000).toISOString(),
        source: "coingecko",
        rawResponse: data,
      };
    } catch (error) {
      console.error("CoinGecko fetch error:", error);
      return null;
    }
  }

  /**
   * Get historical price at a specific date (for verification)
   */
  async getHistoricalPrice(
    symbol: string,
    date: Date
  ): Promise<CoinGeckoPriceResponse | null> {
    try {
      const coinId = SYMBOL_TO_ID[symbol.toUpperCase()] || symbol.toLowerCase();
      const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
      const apiKeyParam = this.apiKey ? `&x_cg_demo_api_key=${this.apiKey}` : "";

      const response = await fetch(
        `${this.baseUrl}/coins/${coinId}/history?date=${dateStr}${apiKeyParam}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(`CoinGecko historical API error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (!data.market_data?.current_price?.usd) {
        console.error(`CoinGecko: No historical data for ${coinId} on ${dateStr}`);
        return null;
      }

      return {
        price: data.market_data.current_price.usd,
        timestamp: date.toISOString(),
        source: "coingecko",
        rawResponse: data,
      };
    } catch (error) {
      console.error("CoinGecko historical fetch error:", error);
      return null;
    }
  }

  /**
   * Get prices for multiple assets
   */
  async getPrices(symbols: string[]): Promise<Map<string, CoinGeckoPriceResponse>> {
    const results = new Map<string, CoinGeckoPriceResponse>();

    try {
      const coinIds = symbols.map(
        (s) => SYMBOL_TO_ID[s.toUpperCase()] || s.toLowerCase()
      );
      const apiKeyParam = this.apiKey ? `&x_cg_demo_api_key=${this.apiKey}` : "";

      const response = await fetch(
        `${this.baseUrl}/simple/price?ids=${coinIds.join(",")}&vs_currencies=usd&include_last_updated_at=true${apiKeyParam}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(`CoinGecko batch API error: ${response.status}`);
        return results;
      }

      const data = await response.json();

      for (const symbol of symbols) {
        const coinId = SYMBOL_TO_ID[symbol.toUpperCase()] || symbol.toLowerCase();
        if (data[coinId]) {
          results.set(symbol.toUpperCase(), {
            price: data[coinId].usd,
            timestamp: new Date(data[coinId].last_updated_at * 1000).toISOString(),
            source: "coingecko",
            rawResponse: { [coinId]: data[coinId] },
          });
        }
      }

      return results;
    } catch (error) {
      console.error("CoinGecko batch fetch error:", error);
      return results;
    }
  }
}

export const coingeckoClient = new CoinGeckoClient();
