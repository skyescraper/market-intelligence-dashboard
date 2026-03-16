"use client client";

import { Building2, Scale, TrendingUp } from "lucide-react";

interface IndustryPanelProps {
  timeRange: "1H" | "24H" | "7D";
}

// Mock data
const mockUpdates = [
  {
    title: "SEC approves spot Bitcoin ETFs",
    category: "Regulation",
    importance: 3,
    source: "SEC.gov",
    impact: "Bullish for crypto markets",
    time: "1h ago",
    tags: ["BTC", "ETH"],
  },
  {
    title: "Binance lists new DeFi tokens",
    category: "Exchange",
    importance: 2,
    source: "Binance",
    impact: "New trading opportunities",
    time: "3h ago",
    tags: ["DeFi"],
  },
  {
    title: "MAS updates stablecoin framework",
    category: "Policy",
    importance: 3,
    source: "MAS",
    impact: "Affects Singapore operations",
    time: "5h ago",
    tags: ["USDT", "USDC"],
  },
  {
    title: "Uniswap TVL reaches $4.2B",
    category: "On-Chain",
    importance: 2,
    source: "DefiLlama",
    impact: "DeFi market growing",
    time: "6h ago",
    tags: ["UNI"],
  },
  {
    title: "Interactive Brokers adds crypto",
    category: "Broker",
    importance: 2,
    source: "PR Newswire",
    impact: "Traditional finance adoption",
    time: "12h ago",
    tags: ["BTC", "ETH"],
  },
];

const categoryIcons: Record<string, string> = {
  Regulation: "🏛️",
  Exchange: "💎",
  Policy: "📜",
  "On-Chain": "🔗",
  Broker: "📊",
};

export function IndustryPanel({ timeRange }: IndustryPanelProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          Industry Trends
        </h2>
        <Building2 className="h-5 w-5 text-chart-2" />
      </div>

      <div className="space-y-3">
        {mockUpdates.map((update, i) => (
          <div
            key={i}
            className={`bg-muted/50 rounded-lg p-4 border transition-colors cursor-pointer ${
              update.importance === 3
                ? "border-orange-500/50 hover:border-orange-500 bg-orange-500/5"
                : "border-border/50 hover:border-chart-2/50"
            }`}
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="text-lg shrink-0">
                {categoryIcons[update.category]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-medium text-foreground line-clamp-2">
                    {update.title}
                  </h3>
                  <span className="text-xs shrink-0">
                    {"⭐".repeat(update.importance)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {update.impact}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {update.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {update.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Scale className="h-4 w-4 text-chart-2" />
          <span className="text-xs font-medium text-foreground">
            Compliance Watch
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          3 regulatory updates require attention this week
        </p>
      </div>
    </div>
  );
}