"use client";

import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface TradingPanelProps {
  timeRange: "1H" | "24H" | "7D";
}

// Mock data
const mockAssets = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    price: "$67,432",
    change: 5.2,
    volume: "2.4K mentions",
    trend: "up" as const,
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    price: "$3,251",
    change: 3.8,
    volume: "1.8K mentions",
    trend: "up" as const,
  },
  {
    name: "Tesla",
    symbol: "TSLA",
    price: "$242.5",
    change: -2.3,
    volume: "956 mentions",
    trend: "down" as const,
  },
  {
    name: "NVIDIA",
    symbol: "NVDA",
    price: "$521.8",
    change: 7.1,
    volume: "1.2K mentions",
    trend: "up" as const,
  },
];

export function TradingPanel({ timeRange }: TradingPanelProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          Trading Monitor
        </h2>
        <Activity className="h-5 w-5 text-primary" />
      </div>

      <div className="space-y-3">
        {mockAssets.map((asset) => (
          <div
            key={asset.symbol}
            className="bg-muted/50 rounded-lg p-4 border border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-foreground">{asset.name}</h3>
                <p className="text-sm text-muted-foreground">{asset.symbol}</p>
              </div>
              <div className="text-right">
                <p className="font-mono-num font-semibold text-foreground">
                  {asset.price}
                </p>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    asset.trend === "up" ? "text-up" : "text-down"
                  }`}
                >
                  {asset.trend === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span className="font-mono-num">
                    {Math.abs(asset.change)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Reddit {timeRange}
              </span>
              <span className="font-medium text-foreground">{asset.volume}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          Click any asset for AI analysis & risk assessment
        </p>
      </div>
    </div>
  );
}