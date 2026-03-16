// Shared types for the dashboard

export interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  price: string;
  change24h: number;
  marketCapRank: number;
  volume: string;
  trend: "up" | "down";
  mentions: number;
  mentionsTrend: number;
  timestamp: Date;
}

export interface NewsItem {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: Date;
  category: string;
  importance: 1 | 2 | 3;
  tags: string[];
}

export interface AITool {
  name: string;
  description: string;
  url: string;
  category: string;
  votes: number;
  sentiment: "LOVED" | "USEFUL" | "MIXED" | "HYPED";
  pricing: "Free" | "Freemium" | "Paid" | "Open Source";
  source: "ProductHunt" | "HackerNews";
  timestamp: Date;
}

export interface IndustryUpdate {
  title: string;
  description: string;
  category: "币圈交易所" | "CFD券商" | "传统券商" | "政府" | "牌照监管" | "支付" | "其他";
  importance: 1 | 2 | 3;
  source: string;
  impact: string;
  url: string;
  timestamp: Date;
  tags: string[];
}

export interface AIAnalysis {
  ticker: string;
  whyNow: string;
  risks: string;
  priceZones: string;
  holdingPeriod: string;
  disclaimer: string;
  generatedAt: Date;
}
