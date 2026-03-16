"use client";

import { useState, useEffect } from "react";
import { Building2, Scale, Loader2, ChevronDown, User, Sparkles } from "lucide-react";
import { formatDateGMT8 } from "@/lib/date-utils";

interface IndustryPanelProps {
  timeRange: "1H" | "24H" | "7D";
  refreshKey: number;
}

type IndustryCategory = "币圈交易所" | "CFD券商" | "传统券商" | "政府" | "牌照监管" | "支付" | "X" | "小红书" | "其他";

interface IndustryUpdate {
  title: string;
  titleEn?: string;
  description: string;
  category: IndustryCategory;
  importance: 1 | 2 | 3;
  source: string;
  company: string;
  isKOL: boolean;
  kolName?: string;
  url: string;
  publishedAt: Date;
  tags: string[];
  platform: "X" | "Blog" | "LinkedIn" | "Official";
}

const categoryIcons: Record<IndustryCategory, string> = {
  币圈交易所: "💎",
  CFD券商: "📊",
  传统券商: "🏛️",
  政府: "🏢",
  牌照监管: "⚖️",
  支付: "💳",
  X: "𝕏",
  小红书: "📕",
  其他: "📌",
};

interface DailySummary {
  industryTrendsSummary_zh: string;
  industryTrendsSummary_en: string;
  twitterTrendsSummary_zh: string;
  twitterTrendsSummary_en: string;
  keyHighlights: string[];
  focusAreas: string[];
}

interface XiaohongshuPost {
  title: string;
  content: string;
  author: string;
  url: string;
  likes: number;
  comments: number;
  timestamp: Date;
  tags: string[];
  isKOL: boolean;
}

export function IndustryPanelEnhanced({ timeRange, refreshKey }: IndustryPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<IndustryCategory | "全部">("全部");
  const [showKOLOnly, setShowKOLOnly] = useState(false);
  const [updates, setUpdates] = useState<IndustryUpdate[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(20);
  const [xiaohongshuPosts, setXiaohongshuPosts] = useState<XiaohongshuPost[]>([]);
  const [xiaohongshuPage, setXiaohongshuPage] = useState(1);
  const [xiaohongshuHasMore, setXiaohongshuHasMore] = useState(false);
  const [xiaohongshuIsMock, setXiaohongshuIsMock] = useState(false);

  const categories: (IndustryCategory | "全部")[] = [
    "全部",
    "X",
    "小红书",
    "币圈交易所",
    "CFD券商",
    "传统券商",
    "政府",
    "牌照监管",
    "支付",
    "其他",
  ];

  useEffect(() => {
    if (selectedCategory === "小红书") {
      fetchXiaohongshu(1, true);
    } else {
      fetchUpdates();
    }
    fetchDailySummary();
  }, [timeRange, refreshKey, selectedCategory]);

  async function fetchDailySummary() {
    try {
      const response = await fetch("/api/ai-summary/daily");
      if (response.ok) {
        const data = await response.json();
        setDailySummary(data);
      }
    } catch (err) {
      console.error("Failed to fetch daily summary:", err);
    }
  }

  async function fetchUpdates() {
    setLoading(true);
    setError(null);
    try {
      const categoryParam = selectedCategory !== "全部" ? `&category=${encodeURIComponent(selectedCategory)}` : "";
      const response = await fetch(`/api/industry/kol-updates?limit=50${categoryParam}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("API error:", errorData);
        throw new Error(errorData.error || "Failed to fetch");
      }

      const data = await response.json();
      setUpdates(data.updates || []);
    } catch (err) {
      console.error("Failed to fetch industry updates:", err);
      setError("数据加载失败，请稍后重试");
      // Don't block UI, show empty state
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchXiaohongshu(page: number, reset: boolean = false) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/social/xiaohongshu?page=${page}&limit=20`);

      if (!response.ok) {
        throw new Error("Failed to fetch Xiaohongshu data");
      }

      const data = await response.json();
      const newPosts = data.posts.map((post: any) => ({
        ...post,
        timestamp: new Date(post.timestamp),
      }));

      if (reset) {
        setXiaohongshuPosts(newPosts);
      } else {
        setXiaohongshuPosts((prev) => [...prev, ...newPosts]);
      }

      setXiaohongshuPage(page);
      setXiaohongshuHasMore(data.hasMore);
      setXiaohongshuIsMock(data.isMockData || false);
    } catch (err) {
      console.error("Failed to fetch Xiaohongshu posts:", err);
      setError("小红书数据加载失败，请稍后重试");
      setXiaohongshuPosts([]);
    } finally {
      setLoading(false);
    }
  }

  // Filter updates by KOL only (category filtering is done in API)
  const filteredUpdates = updates.filter((update) => {
    if (showKOLOnly && !update.isKOL) return false;
    return true;
  });

  const displayedUpdates = filteredUpdates.slice(0, displayCount);
  const hasMore = filteredUpdates.length > displayCount;
  const kolCount = updates.filter((u) => u.isKOL).length;

  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6 h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Industry Trends</h2>
        <Building2 className="h-5 w-5 text-chart-2" />
      </div>

      {/* AI Daily Summary */}
      {dailySummary && (
        <div className="mb-4 p-4 bg-chart-2/10 border border-chart-2/30 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-chart-2 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                {selectedCategory === "X" ? "今日 X 大佬动态 AI 总结" : selectedCategory === "小红书" ? "今日小红书讨论 AI 总结" : "今日行业动态 AI 总结"}
              </h3>

              {/* Show Twitter summary when X is selected */}
              {selectedCategory === "X" && dailySummary.twitterTrendsSummary_zh && (
                <>
                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                    {dailySummary.twitterTrendsSummary_zh}
                  </p>
                  <p className="text-xs text-muted-foreground/80 mb-3 leading-relaxed">
                    {dailySummary.twitterTrendsSummary_en}
                  </p>
                </>
              )}

              {/* Show industry summary for Xiaohongshu and other categories */}
              {selectedCategory !== "X" && (
                <>
                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                    {selectedCategory === "小红书"
                      ? "小红书上的加密货币讨论主要集中在交易所体验、投资心得和新项目分析。用户分享的实用内容和避坑指南值得关注。"
                      : dailySummary.industryTrendsSummary_zh}
                  </p>
                  <p className="text-xs text-muted-foreground/80 mb-3 leading-relaxed">
                    {selectedCategory === "小红书"
                      ? "Cryptocurrency discussions on Xiaohongshu focus on exchange experiences, investment insights, and new project analysis. User-shared practical content and risk warnings are noteworthy."
                      : dailySummary.industryTrendsSummary_en}
                  </p>
                </>
              )}

              {dailySummary.keyHighlights.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">关键亮点：</p>
                  {dailySummary.keyHighlights.slice(0, 3).map((highlight, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-chart-2 text-[10px] mt-0.5">▸</span>
                      <span className="text-[10px] text-foreground">{highlight}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KOL Filter Toggle */}
      {kolCount > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setShowKOLOnly(!showKOLOnly)}
            className={`flex-1 p-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              showKOLOnly
                ? "bg-orange-500/20 border border-orange-500/50 text-orange-600"
                : "bg-muted/50 border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            <User className="h-4 w-4" />
            <span className="text-xs font-medium">
              {showKOLOnly ? `显示全部 (${kolCount}/${updates.length})` : `仅KOL发言 (${kolCount})`}
            </span>
          </button>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              setDisplayCount(20);
            }}
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

        {/* Xiaohongshu Mock Data Warning */}
        {!loading && selectedCategory === "小红书" && xiaohongshuIsMock && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-3">
            <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
              ℹ️ <strong>开发说明：</strong>小红书数据需要通过独立的数据采集脚本获取。由于API限制，建议使用以下方案：<br/>
              1️⃣ 使用第三方小红书API服务（如DataHub、巨量算数）<br/>
              2️⃣ 自建爬虫脚本（注意遵守robots.txt和法律法规）<br/>
              3️⃣ 手动导入CSV/JSON数据文件<br/>
              当前显示为示例数据格式。
            </p>
          </div>
        )}

        {/* Xiaohongshu Posts */}
        {!loading && !error && selectedCategory === "小红书" && xiaohongshuPosts.map((post, i) => (
          <a
            key={i}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`block bg-muted/50 rounded-lg p-4 border transition-colors cursor-pointer ${
              post.isKOL
                ? "border-yellow-500/50 hover:border-yellow-500 bg-yellow-500/5"
                : "border-border/50 hover:border-chart-2/50"
            }`}
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="text-lg shrink-0">📕</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground line-clamp-2 mb-1">
                  {post.title}
                </h3>

                {post.isKOL && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-yellow-500/20 text-yellow-600 border border-yellow-500/30 mb-2">
                    <User className="h-3 w-3" />
                    KOL
                  </span>
                )}

                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {post.content}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-chart-2/10 text-chart-2">
                  {post.author}
                </span>
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>👍 {post.likes}</span>
                <span>💬 {post.comments}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/30">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{formatDateGMT8(post.timestamp).split('|')[0]}</span>
                <span className="text-muted-foreground/70">{formatDateGMT8(post.timestamp).split('|')[1]}</span>
              </div>
            </div>
          </a>
        ))}

        {/* Industry Updates */}
        {!loading && !error && selectedCategory !== "小红书" && displayedUpdates.map((update, i) => (
          <a
            key={i}
            href={update.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`block bg-muted/50 rounded-lg p-4 border transition-colors cursor-pointer ${
              update.importance === 3
                ? "border-orange-500/50 hover:border-orange-500 bg-orange-500/5"
                : update.isKOL
                ? "border-yellow-500/50 hover:border-yellow-500 bg-yellow-500/5"
                : "border-border/50 hover:border-chart-2/50"
            }`}
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="text-lg shrink-0">
                {categoryIcons[update.category]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground line-clamp-2 mb-1">
                      {update.title}
                    </h3>
                    {update.titleEn && update.titleEn !== update.title && (
                      <p className="text-xs text-muted-foreground/80 line-clamp-1">
                        {update.titleEn}
                      </p>
                    )}
                  </div>
                  <span className="text-xs shrink-0">
                    {"⭐".repeat(update.importance)}
                  </span>
                </div>

                {/* KOL Badge */}
                {update.isKOL && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-yellow-500/20 text-yellow-600 border border-yellow-500/30">
                      <User className="h-3 w-3" />
                      KOL发言
                    </span>
                    {update.kolName && (
                      <span className="text-[10px] text-muted-foreground">
                        {update.kolName}
                      </span>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {update.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-chart-2/10 text-chart-2">
                  {update.company}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {update.platform}
                </span>
                {update.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-border/30">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{formatDateGMT8(update.publishedAt).split('|')[0]}</span>
                <span className="text-muted-foreground/70">{formatDateGMT8(update.publishedAt).split('|')[1]}</span>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* See More Button */}
      {selectedCategory === "小红书" && xiaohongshuHasMore && !loading && (
        <button
          onClick={() => fetchXiaohongshu(xiaohongshuPage + 1, false)}
          className="mt-4 w-full py-2 text-sm text-chart-2 hover:text-chart-2/80 transition-colors flex items-center justify-center gap-2"
        >
          <span>加载更多小红书帖子</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
      {selectedCategory !== "小红书" && hasMore && !loading && (
        <button
          onClick={() => setDisplayCount(displayCount + 20)}
          className="mt-4 w-full py-2 text-sm text-chart-2 hover:text-chart-2/80 transition-colors flex items-center justify-center gap-2"
        >
          <span>查看更多动态</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      )}

      <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Scale className="h-4 w-4 text-chart-2" />
          <span className="text-xs font-medium text-foreground">
            {selectedCategory === "小红书" ? "小红书统计" : "行业监控统计"}
          </span>
        </div>
        {selectedCategory === "小红书" ? (
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <span className="text-foreground font-medium">{xiaohongshuPosts.length}</span> 条帖子
            </div>
            <div>
              <span className="text-foreground font-medium">{xiaohongshuPosts.filter(p => p.isKOL).length}</span> 条KOL
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <span className="text-foreground font-medium">{displayedUpdates.length}</span> / {filteredUpdates.length} 条显示
            </div>
            <div>
              <span className="text-foreground font-medium">{kolCount}</span> 条KOL发言
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
