"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Activity, Loader2 } from "lucide-react";
import { formatDateGMT8 } from "@/lib/date-utils";
import type { CryptoAsset } from "@/lib/types";

interface TradingPanelProps {
  timeRange: "1H" | "24H" | "7D";
  refreshKey: number;
}

type AssetCategory = "加密货币" | "股票" | "外汇" | "大宗商品";

interface Asset extends CryptoAsset {
  category: AssetCategory;
  change: number;
  volume: string;
}

const categoryEmojis: Record<AssetCategory, string> = {
  加密货币: "💎",
  股票: "📈",
  外汇: "💱",
  大宗商品: "🏆",
};

export function TradingPanel({ timeRange, refreshKey }: TradingPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | "全部">("全部");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories: (AssetCategory | "全部")[] = ["全部", "加密货币", "股票", "外汇", "大宗商品"];

  useEffect(() => {
    fetchAssets();
  }, [timeRange, refreshKey]);

  async function fetchAssets() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/crypto");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();

      // Map crypto assets to include category
      const mappedAssets: Asset[] = data.assets.map((asset: CryptoAsset) => ({
        ...asset,
        category: "加密货币" as AssetCategory,
        change: asset.change24h,
        volume: `${asset.mentions} mentions`,
      }));

      setAssets(mappedAssets);
    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredAssets =
    selectedCategory === "全部"
      ? assets
      : assets.filter((asset) => asset.category === selectedCategory);

  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6 h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Trading Monitor</h2>
        <Activity className="h-5 w-5 text-primary" />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {cat !== "全部" && categoryEmojis[cat as AssetCategory]} {cat}
          </button>
        ))}
      </div>

      {/* Assets List */}
      <div className="space-y-3 overflow-y-auto flex-1">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}
        {!loading && !error && filteredAssets.map((asset) => (
          <div
            key={asset.symbol}
            className="bg-muted/50 rounded-lg p-3 border border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{categoryEmojis[asset.category]}</span>
                  <h3 className="font-semibold text-foreground truncate">{asset.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground">{asset.symbol}</p>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="font-mono-num font-semibold text-sm text-foreground">
                  {asset.price}
                </p>
                <div
                  className={`flex items-center gap-1 text-xs font-medium justify-end ${
                    asset.trend === "up" ? "text-up" : "text-down"
                  }`}
                >
                  {asset.trend === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span className="font-mono-num">{Math.abs(asset.change)}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Reddit {timeRange}: {asset.volume}</span>
            </div>

            <div className="mt-2 pt-2 border-t border-border/30">
              <p className="text-xs text-muted-foreground">{formatDateGMT8(asset.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          Click any asset for AI analysis & risk assessment
        </p>
      </div>
    </div>
  );
}