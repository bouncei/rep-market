export interface OracleSource {
  id: string;
  name: string;
  baseUrl: string;
  description: string;
}

// Price data sources
export const PRICE_SOURCES: Record<string, OracleSource> = {
  coingecko: {
    id: "coingecko",
    name: "CoinGecko",
    baseUrl: "https://api.coingecko.com/api/v3",
    description: "Cryptocurrency price and market data",
  },
  coinbase: {
    id: "coinbase",
    name: "Coinbase",
    baseUrl: "https://api.coinbase.com/v2",
    description: "Coinbase exchange price data",
  },
};

// DeFi metrics sources
export const DEFI_SOURCES: Record<string, OracleSource> = {
  defillama: {
    id: "defillama",
    name: "DeFiLlama",
    baseUrl: "https://api.llama.fi",
    description: "DeFi TVL and protocol data",
  },
};

// Social/identity sources
export const IDENTITY_SOURCES: Record<string, OracleSource> = {
  ethos: {
    id: "ethos",
    name: "Ethos Network",
    baseUrl: "https://api.ethos.network",
    description: "Ethos credibility and profile data",
  },
};

// Supported assets for price oracles
export const SUPPORTED_ASSETS = {
  BTC: {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    coingeckoId: "bitcoin",
  },
  ETH: {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    coingeckoId: "ethereum",
  },
} as const;

// Supported protocols for metric oracles
export const SUPPORTED_PROTOCOLS = {
  eigenlayer: {
    id: "eigenlayer",
    name: "EigenLayer",
    defillamaId: "eigenlayer",
  },
  base: {
    id: "base",
    name: "Base",
    defillamaId: "base",
  },
} as const;

export type SupportedAsset = keyof typeof SUPPORTED_ASSETS;
export type SupportedProtocol = keyof typeof SUPPORTED_PROTOCOLS;
