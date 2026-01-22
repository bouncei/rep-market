import { 
  Bitcoin, 
  TrendingUp, 
  Building2, 
  Users, 
  Gamepad2, 
  Globe, 
  Zap,
  BarChart3,
  Target,
  Clock,
  DollarSign,
  Activity
} from "lucide-react";

export interface CategoryConfig {
  id: string;
  label: string;
  description: string;
  icon: any;
  color: string;
  gradient: string;
}

export interface FilterOption {
  id: string;
  label: string;
  value: string;
}

// Market Categories
export const MARKET_CATEGORIES: Record<string, CategoryConfig> = {
  crypto: {
    id: "crypto",
    label: "Cryptocurrency",
    description: "Bitcoin, Ethereum, and other crypto price predictions",
    icon: Bitcoin,
    color: "text-orange-400",
    gradient: "from-orange-600/80 via-amber-500/60 to-yellow-400/40"
  },
  defi: {
    id: "defi",
    label: "DeFi",
    description: "Decentralized Finance protocols and TVL metrics",
    icon: TrendingUp,
    color: "text-blue-400",
    gradient: "from-blue-600/80 via-indigo-500/60 to-purple-400/40"
  },
  social: {
    id: "social",
    label: "Social Networks",
    description: "Social platforms, user growth, and engagement metrics",
    icon: Users,
    color: "text-green-400",
    gradient: "from-green-600/80 via-emerald-500/60 to-teal-400/40"
  },
  tech: {
    id: "tech",
    label: "Technology",
    description: "Tech companies, product launches, and adoption metrics",
    icon: Zap,
    color: "text-purple-400",
    gradient: "from-purple-600/80 via-violet-500/60 to-indigo-400/40"
  },
  gaming: {
    id: "gaming",
    label: "Gaming",
    description: "Gaming industry, NFTs, and virtual worlds",
    icon: Gamepad2,
    color: "text-pink-400",
    gradient: "from-pink-600/80 via-rose-500/60 to-red-400/40"
  },
  business: {
    id: "business",
    label: "Business",
    description: "Corporate events, earnings, and market performance",
    icon: Building2,
    color: "text-slate-400",
    gradient: "from-slate-600/80 via-gray-500/60 to-zinc-400/40"
  },
  politics: {
    id: "politics",
    label: "Politics",
    description: "Elections, policy decisions, and political events",
    icon: Globe,
    color: "text-red-400",
    gradient: "from-red-600/80 via-rose-500/60 to-pink-400/40"
  }
};

// Oracle Type Labels and Descriptions
export const ORACLE_TYPES: Record<string, CategoryConfig> = {
  price_close: {
    id: "price_close",
    label: "Price Target",
    description: "Asset price reaching specific thresholds",
    icon: DollarSign,
    color: "text-emerald-400",
    gradient: "from-emerald-600/80 via-green-500/60 to-teal-400/40"
  },
  metric_threshold: {
    id: "metric_threshold",
    label: "Metric Threshold",
    description: "Protocol metrics like TVL, volume, or users",
    icon: BarChart3,
    color: "text-blue-400",
    gradient: "from-blue-600/80 via-indigo-500/60 to-purple-400/40"
  },
  count_threshold: {
    id: "count_threshold",
    label: "Count Target",
    description: "Counting milestones and growth targets",
    icon: Target,
    color: "text-orange-400",
    gradient: "from-orange-600/80 via-amber-500/60 to-yellow-400/40"
  }
};

// Time-based filters
export const TIME_FILTERS: FilterOption[] = [
  { id: "all", label: "All Time", value: "all" },
  { id: "24h", label: "Next 24 Hours", value: "24h" },
  { id: "7d", label: "Next 7 Days", value: "7d" },
  { id: "30d", label: "Next 30 Days", value: "30d" },
  { id: "90d", label: "Next 90 Days", value: "90d" }
];

// Stake amount filters
export const STAKE_FILTERS: FilterOption[] = [
  { id: "all", label: "All Stakes", value: "all" },
  { id: "low", label: "< 1,000", value: "low" },
  { id: "medium", label: "1,000 - 5,000", value: "medium" },
  { id: "high", label: "5,000 - 10,000", value: "high" },
  { id: "whale", label: "> 10,000", value: "whale" }
];

// Probability filters
export const PROBABILITY_FILTERS: FilterOption[] = [
  { id: "all", label: "All Probabilities", value: "all" },
  { id: "low", label: "< 25%", value: "low" },
  { id: "medium-low", label: "25% - 45%", value: "medium-low" },
  { id: "medium-high", label: "55% - 75%", value: "medium-high" },
  { id: "high", label: "> 75%", value: "high" },
  { id: "uncertain", label: "45% - 55%", value: "uncertain" }
];

// Sort options
export const SORT_OPTIONS: FilterOption[] = [
  { id: "newest", label: "Newest First", value: "newest" },
  { id: "ending-soon", label: "Ending Soon", value: "ending-soon" },
  { id: "highest-stake", label: "Highest Stake", value: "highest-stake" },
  { id: "most-confident", label: "Most Confident", value: "most-confident" },
  { id: "least-confident", label: "Least Confident", value: "least-confident" }
];

// Helper functions
export function getCategoryConfig(category: string | null): CategoryConfig {
  if (!category) return MARKET_CATEGORIES.crypto; // Default fallback
  return MARKET_CATEGORIES[category.toLowerCase()] || MARKET_CATEGORIES.crypto;
}

export function getOracleTypeConfig(oracleType: string): CategoryConfig {
  return ORACLE_TYPES[oracleType] || ORACLE_TYPES.price_close;
}

export function getAllCategories(): CategoryConfig[] {
  return Object.values(MARKET_CATEGORIES);
}

export function getAllOracleTypes(): CategoryConfig[] {
  return Object.values(ORACLE_TYPES);
}
