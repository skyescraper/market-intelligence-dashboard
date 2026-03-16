"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Activity, Loader2, ChevronDown, Sparkles } from "lucide-react";
import { formatDateGMT8 } from "@/lib/date-utils";

interface TradingPanelProps {
  timeRange: "1H" | "24H" | "7D";
  refreshKey: number;
}

type AssetCategory = "加密货币" | "股票" | "外汇" | "大宗商品";
type SortBy = "marketCap" | "volatility" | "volume" | "sentiment" | "change24h";

interface Asset {
  id: string;
  name: string;
  symbol: string;
  price: string;
  priceRaw: number;
  change24h: number;
  change1h: number;
  marketCapRank: number;
  volume24h: number;
  trend: "up" | "down";
  mentions: number;
  mentionsTrend: number;
  sentiment: "bullish" | "bearish" | "neutral";
  volatility1h: number;
  timestamp: Date;
  category: AssetCategory;
}

interface AIRecommendation {
  recommended: string;
  currentPrice?: number;
  reason_zh: string;
  reason_en: string;
  entry?: string;
  exit?: string;
  buyPrice?: string;
  sellPrice?: string;
  stopLoss?: string;
  holding: string;
  confidence?: string;
  supportingLogic?: {
    technical: string;
    sentiment: string;
    news: string;
    social: string;
    expert: string;
  };
}

const categoryEmojis: Record<AssetCategory, string> = {
  加密货币: "💎",
  股票: "📈",
  外汇: "💱",
  大宗商品: "🏆",
};

const sortOptions: { value: SortBy; label: string }[] = [
  { value: "marketCap", label: "市值" },
  { value: "change24h", label: "24h涨幅" },
  { value: "volatility", label: "波动率" },
  { value: "volume", label: "交易量" },
  { value: "sentiment", label: "市场情绪" },
];

export function TradingPanelEnhanced({ timeRange, refreshKey }: TradingPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | "全部">("加密货币");
  const [sortBy, setSortBy] = useState<SortBy>("marketCap");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [displayCount, setDisplayCount] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiRecommendation, setAIRecommendation] = useState<AIRecommendation | null>(null);

  const categories: (AssetCategory | "全部")[] = ["全部", "加密货币", "股票", "外汇", "大宗商品"];

  useEffect(() => {
    fetchAssets();
  }, [timeRange, refreshKey, sortBy, selectedCategory]);

  async function fetchAssets() {
    setLoading(true);
    setError(null);
    try {
      // Fetch all asset types in parallel
      const [cryptoRes, stocksRes, forexRes] = await Promise.all([
        fetch(`/api/crypto/enhanced?limit=50&sortBy=${sortBy}`),
        fetch(`/api/stocks?limit=50`),
        fetch(`/api/forex-commodities`),
      ]);

      const cryptoData = await cryptoRes.json();
      const stocksData = await stocksRes.json();
      const forexData = await forexRes.json();

      // Map all assets with proper categories
      const cryptoAssets: Asset[] = (cryptoData.assets || []).map((asset: any) => ({
        ...asset,
        category: "加密货币" as AssetCategory,
      }));

      const stockAssets: Asset[] = (stocksData.assets || []).map((asset: any) => ({
        ...asset,
        category: "股票" as AssetCategory,
      }));

      const forexCommodityAssets: Asset[] = (forexData.assets || []).map((asset: any) => ({
        ...asset,
        category: asset.category as AssetCategory,
      }));

      const allAssets = [...cryptoAssets, ...stockAssets, ...forexCommodityAssets];
      setAssets(allAssets);

      // Set AI recommendation based on selected category
      if (selectedCategory === "加密货币" || selectedCategory === "全部") {
        setAIRecommendation(cryptoData.aiRecommendation);
      } else if (selectedCategory === "股票") {
        setAIRecommendation(stocksData.aiRecommendation);
      } else if (selectedCategory === "外汇" || selectedCategory === "大宗商品") {
        setAIRecommendation(forexData.aiRecommendation);
      } else {
        setAIRecommendation(cryptoData.aiRecommendation); // default to crypto
      }
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

  const displayedAssets = filteredAssets.slice(0, displayCount);
  const hasMore = filteredAssets.length > displayCount;

  const sentimentColor = {
    bullish: "text-up",
    bearish: "text-down",
    neutral: "text-muted-foreground",
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6 h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Trading Monitor</h2>
        <Activity className="h-5 w-5 text-primary" />
      </div>

      {/* AI Recommendation Banner */}
      {aiRecommendation && (
        <div className="mb-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
          <div className="flex items-start gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-foreground">
                  AI 推荐关注: {aiRecommendation.recommended}
                </h3>
                {aiRecommendation.confidence && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    aiRecommendation.confidence.includes("High")
                      ? "bg-up/20 text-up"
                      : aiRecommendation.confidence.includes("Medium")
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {aiRecommendation.confidence}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-1.5 leading-relaxed">
                {aiRecommendation.reason_zh}
              </p>
              <p className="text-xs text-muted-foreground/70 mb-3 leading-relaxed">
                {aiRecommendation.reason_en}
              </p>

              {/* Price Targets */}
              <div className="grid grid-cols-3 gap-2 mb-3 p-2 bg-background/50 rounded">
                <div>
                  <span className="text-[10px] text-muted-foreground block">买入价位</span>
                  <span className="text-xs text-up font-medium">{aiRecommendation.buyPrice || aiRecommendation.entry}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">止盈价位</span>
                  <span className="text-xs text-foreground font-medium">{aiRecommendation.sellPrice || aiRecommendation.exit}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">止损价位</span>
                  <span className="text-xs text-down font-medium">{aiRecommendation.stopLoss || "谨慎设置"}</span>
                </div>
              </div>

              {/* Supporting Logic */}
              {aiRecommendation.supportingLogic && (
                <div className="space-y-1.5 text-[10px] border-t border-primary/20 pt-2">
                  <div className="flex gap-1.5">
                    <span className="text-primary shrink-0">📊</span>
                    <span className="text-muted-foreground"><strong>技术:</strong> {aiRecommendation.supportingLogic.technical}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="text-primary shrink-0">💭</span>
                    <span className="text-muted-foreground"><strong>情绪:</strong> {aiRecommendation.supportingLogic.sentiment}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="text-primary shrink-0">📰</span>
                    <span className="text-muted-foreground"><strong>新闻:</strong> {aiRecommendation.supportingLogic.news}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="text-primary shrink-0">🌐</span>
                    <span className="text-muted-foreground"><strong>社媒:</strong> {aiRecommendation.supportingLogic.social}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="text-primary shrink-0">👔</span>
                    <span className="text-muted-foreground"><strong>专家:</strong> {aiRecommendation.supportingLogic.expert}</span>
                  </div>
                </div>
              )}

              <div className="mt-2 pt-2 border-t border-primary/20">
                <span className="text-[10px] text-muted-foreground">持有周期: </span>
                <span className="text-xs text-foreground font-medium">{aiRecommendation.holding}</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/60">
            ⚠️ 以上仅供参考，不构成投资建议。投资有风险，决策需谨慎。
          </p>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
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

      {/* Sort Options */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSortBy(option.value)}
            className={`px-2 py-1 text-[11px] rounded whitespace-nowrap transition-colors ${
              sortBy === option.value
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted/30 text-muted-foreground hover:bg-muted"
            }`}
          >
            {option.label}
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
        {!loading && !error && displayedAssets.map((asset) => (
          <div
            key={asset.id}
            className="bg-muted/50 rounded-lg p-3 border border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{categoryEmojis[asset.category]}</span>
                  <h3 className="font-semibold text-foreground truncate">{asset.name}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    asset.sentiment === "bullish" ? "bg-up/20 text-up" :
                    asset.sentiment === "bearish" ? "bg-down/20 text-down" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {asset.sentiment}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{asset.symbol} · Rank #{asset.marketCapRank}</p>
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
                  <span className="font-mono-num">{Math.abs(asset.change24h)}%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
              <div>
                <span className="block text-[10px]">1h 变化</span>
                <span className={asset.change1h >= 0 ? "text-up" : "text-down"}>
                  {asset.change1h >= 0 ? "+" : ""}{asset.change1h.toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="block text-[10px]">波动率</span>
                <span className="text-foreground">{asset.volatility1h.toFixed(2)}%</span>
              </div>
              <div>
                <span className="block text-[10px]">提及数</span>
                <span className="text-foreground">{asset.mentions}</span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-border/30">
              <p className="text-xs text-muted-foreground">{formatDateGMT8(asset.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* See More Button */}
      {hasMore && !loading && (
        <button
          onClick={() => setDisplayCount(displayCount + 20)}
          className="mt-4 w-full py-2 text-sm text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-2"
        >
          <span>查看更多</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      )}

      <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          显示 {displayedAssets.length} / {filteredAssets.length} 个资产
        </p>
      </div>
    </div>
  );
}
