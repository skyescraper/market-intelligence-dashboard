// Social media data aggregation utilities

export interface SocialPost {
  platform: "X" | "Reddit" | "小红书" | "HackerNews";
  content: string;
  author: string;
  url: string;
  timestamp: Date;
  engagement: number; // likes/upvotes
  isKOL?: boolean;
  company?: string;
}

export interface AggregatedTrend {
  topic: string;
  posts: SocialPost[];
  totalEngagement: number;
  sentiment: "positive" | "negative" | "neutral";
  trending: boolean;
}

// X/Twitter KOL accounts to track (crypto/fintech industry leaders)
export const CRYPTO_KOLS = [
  "binance",
  "cz_binance",
  "coinbase",
  "brian_armstrong",
  "VitalikButerin",
  "justinsuntron",
  "SBF_FTX",
  "krakenfx",
  "jessepollak",
  "haydenzadams",
];

export const FINTECH_KOLS = [
  "schwab",
  "RobinhoodApp",
  "IGcom",
  "pepperstone",
  "Interactive",
];

// Reddit subreddits for tracking
export const CRYPTO_SUBREDDITS = [
  "CryptoCurrency",
  "Bitcoin",
  "ethereum",
  "defi",
  "CryptoMarkets",
];

export const TRADING_SUBREDDITS = [
  "stocks",
  "investing",
  "wallstreetbets",
  "options",
  "Forex",
];

// Helper to calculate trend score
export function calculateTrendScore(
  engagement: number,
  ageInHours: number,
  platform: string
): number {
  const platformWeight = {
    X: 1.2,
    Reddit: 1.0,
    小红书: 0.9,
    HackerNews: 0.8,
  }[platform] || 1.0;

  // Decay score over time (recent posts get higher scores)
  const timeDecay = Math.exp(-ageInHours / 24);

  return engagement * platformWeight * timeDecay;
}

// Extract tickers/symbols from text
export function extractTickers(text: string): string[] {
  const tickerRegex = /\$([A-Z]{2,5})\b|#([A-Z]{2,5})\b/g;
  const matches = [...text.matchAll(tickerRegex)];
  return matches.map(m => m[1] || m[2]).filter(Boolean);
}

// Determine if user is a KOL
export function isKOLAccount(username: string): boolean {
  const lowerUsername = username.toLowerCase();
  return [...CRYPTO_KOLS, ...FINTECH_KOLS].some(
    kol => lowerUsername.includes(kol.toLowerCase())
  );
}
