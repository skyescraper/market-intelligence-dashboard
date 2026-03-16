"use client";

import { useState, useEffect } from "react";
import { Building2, Scale, Loader2 } from "lucide-react";
import { formatDateGMT8 } from "@/lib/date-utils";
import type { NewsItem } from "@/lib/types";

interface IndustryPanelProps {
  timeRange: "1H" | "24H" | "7D";
  refreshKey: number;
}

type IndustryCategory = "币圈交易所" | "CFD券商" | "传统券商" | "政府" | "牌照监管" | "支付" | "其他";

interface IndustryUpdate extends NewsItem {
  category: IndustryCategory;
  impact: string;
}

const categoryIcons: Record<IndustryCategory, string> = {
  币圈交易所: "💎",
  CFD券商: "📊",
  传统券商: "🏛️",
  政府: "🏢",
  牌照监管: "⚖️",
  支付: "💳",
  其他: "📌",
};

function categorizeNews(newsItem: NewsItem): IndustryCategory {
  const title = newsItem.title.toLowerCase();
  const source = newsItem.source.toLowerCase();

  if (title.includes("binance") || title.includes("okx") || title.includes("coinbase") || source.includes("coindesk")) {
    return "币圈交易所";
  }
  if (title.includes("sec") || title.includes("fca") || title.includes("监管") || newsItem.category === "监管") {
    return "牌照监管";
  }
  if (title.includes("mas") || title.includes("政府") || source.includes("sec.gov")) {
    return "政府";
  }
  if (title.includes("visa") || title.includes("payment") || title.includes("支付")) {
    return "支付";
  }
  if (title.includes("券商") || title.includes("schwab") || title.includes("broker")) {
    return "传统券商";
  }
  if (title.includes("cfd") || title.includes("ig group")) {
    return "CFD券商";
  }
  return "其他";
}

export function IndustryPanel({ timeRange, refreshKey }: IndustryPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<IndustryCategory | "全部">("全部");
  const [updates, setUpdates] = useState<IndustryUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories: (IndustryCategory | "全部")[] = ["全部", "币圈交易所", "CFD券商", "传统券商", "政府", "牌照监管", "支付", "其他"];

  useEffect(() => {
    fetchUpdates();
  }, [timeRange, refreshKey]);

  async function fetchUpdates() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/news");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();

      const mappedUpdates: IndustryUpdate[] = data.news.map((item: NewsItem) => ({
        ...item,
        category: categorizeNews(item),
        impact: item.description || "行业重要动态",
      }));

      setUpdates(mappedUpdates);
    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredUpdates =
    selectedCategory === "全部"
      ? updates
      : updates.filter((update) => update.category === selectedCategory);

  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6 h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">
          Industry Trends
        </h2>
        <Building2 className="h-5 w-5 text-chart-2" />
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
            {cat !== "全部" && categoryIcons[cat as IndustryCategory]} {cat}
          </button>
        ))}
      </div>

      <div className="space-y-3 overflow-y-auto flex-1">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-chart-2" />
          </div>
        )}
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}
        {!loading && !error && filteredUpdates.map((update, i) => (
          <a
            href={update.url}
            target="_blank"
            rel="noopener noreferrer"
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
            </div>

            <div className="mt-2 pt-2 border-t border-border/30">
              <p className="text-xs text-muted-foreground">{formatDateGMT8(update.publishedAt)}</p>
            </div>
          </a>
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