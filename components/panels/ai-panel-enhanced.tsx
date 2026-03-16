"use client";

import { useState, useEffect } from "react";
import { Sparkles, ThumbsUp, ExternalLink, Loader2, ChevronDown } from "lucide-react";
import { formatDateGMT8 } from "@/lib/date-utils";

interface AIPanelProps {
  timeRange: "1H" | "24H" | "7D";
  refreshKey: number;
}

interface AIAgent {
  name: string;
  description: string;
  useCase: string;
  useCaseEn: string;
  url: string;
  category: string;
  votes: number;
  sentiment: "LOVED" | "USEFUL" | "MIXED" | "HYPED";
  pricing: string;
  source: "ProductHunt" | "HackerNews" | "Reddit";
  timestamp: Date;
}

interface NewsItem {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: Date;
  category: string;
  importance: 1 | 2 | 3;
  tags: string[];
}

interface DailySummary {
  aiTrendsSummary_zh: string;
  aiTrendsSummary_en: string;
  keyHighlights: string[];
  focusAreas: string[];
}

export function AIPanelEnhanced({ timeRange, refreshKey }: AIPanelProps) {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentsDisplayCount, setAgentsDisplayCount] = useState(10);
  const [newsDisplayCount, setNewsDisplayCount] = useState(10);

  useEffect(() => {
    fetchData();
    fetchDailySummary();
  }, [timeRange, refreshKey]);

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

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [agentsRes, newsRes] = await Promise.all([
        fetch("/api/trending/ai-tools?limit=50"),
        fetch("/api/news"),
      ]);

      if (!agentsRes.ok || !newsRes.ok) throw new Error("Failed to fetch");

      const agentsData = await agentsRes.json();
      const newsData = await newsRes.json();

      setAgents(agentsData.tools || []);
      setNews(newsData.news?.slice(0, 50) || []);
    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const displayedAgents = agents.slice(0, agentsDisplayCount);
  const displayedNews = news.slice(0, newsDisplayCount);
  const hasMoreAgents = agents.length > agentsDisplayCount;
  const hasMoreNews = news.length > newsDisplayCount;

  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6 h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">🤖 热门 Agent 雷达</h2>
        <Sparkles className="h-5 w-5 text-secondary" />
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6 overflow-y-auto flex-1">
          {/* AI Daily Summary */}
          {dailySummary && (
            <div className="p-4 bg-secondary/10 border border-secondary/30 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    今日 AI Agent 趋势总结
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                    {dailySummary.aiTrendsSummary_zh}
                  </p>
                  <p className="text-xs text-muted-foreground/80 mb-3 leading-relaxed">
                    {dailySummary.aiTrendsSummary_en}
                  </p>
                  {dailySummary.focusAreas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      <p className="text-[10px] text-muted-foreground font-medium w-full mb-1">建议关注：</p>
                      {dailySummary.focusAreas.slice(0, 4).map((area, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-[10px] rounded-full bg-secondary/20 text-secondary"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Agents Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              🤖 热门 AI Agents ({agents.length})
            </h3>
            <div className="space-y-2">
              {displayedAgents.map((agent, idx) => (
                <div
                  key={idx}
                  className="bg-muted/50 rounded-lg p-3 border border-border/50 hover:border-secondary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-medium text-foreground">
                          {agent.name}
                        </h4>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {agent.pricing}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary shrink-0">
                          {agent.source}
                        </span>
                      </div>
                      {/* Use Case Badge */}
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary border border-primary/20">
                          <span>🎯</span>
                          <span className="font-medium">用途：</span>
                          <span>{agent.useCase}</span>
                        </span>
                      </div>
                      {/* Bilingual description */}
                      <p className="text-xs text-muted-foreground whitespace-pre-line">
                        {agent.description}
                      </p>
                    </div>
                    <a
                      href={agent.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-muted-foreground hover:text-secondary transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <ThumbsUp className="h-3 w-3" />
                      {agent.votes}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        agent.sentiment === "LOVED"
                          ? "bg-up/10 text-up"
                          : agent.sentiment === "HYPED"
                          ? "bg-orange-500/10 text-orange-500"
                          : "bg-secondary/10 text-secondary"
                      }`}
                    >
                      {agent.sentiment}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-muted/50 text-muted-foreground">
                      {agent.category}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{formatDateGMT8(agent.timestamp).split('|')[0]}</span>
                      <span className="text-muted-foreground/70">{formatDateGMT8(agent.timestamp).split('|')[1]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {hasMoreAgents && (
              <button
                onClick={() => setAgentsDisplayCount(agentsDisplayCount + 10)}
                className="mt-3 w-full py-2 text-sm text-secondary hover:text-secondary/80 transition-colors flex items-center justify-center gap-2"
              >
                <span>查看更多 Agents</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* AI News Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              📰 Latest AI News ({news.length})
            </h3>
            <div className="space-y-2">
              {displayedNews.map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block bg-muted/50 rounded-lg p-3 border transition-colors cursor-pointer ${
                    item.importance === 3
                      ? "border-orange-500/50 hover:border-orange-500"
                      : "border-border/50 hover:border-secondary/50"
                  }`}
                >
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-xs shrink-0">
                      {"⭐".repeat(item.importance)}
                    </span>
                    <h4 className="font-medium text-sm text-foreground line-clamp-2 flex-1">
                      {item.title}
                    </h4>
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs rounded-full bg-secondary/10 text-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="text-muted-foreground">{item.source}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <p className="text-xs text-muted-foreground">{formatDateGMT8(item.publishedAt)}</p>
                  </div>
                </a>
              ))}
            </div>
            {hasMoreNews && (
              <button
                onClick={() => setNewsDisplayCount(newsDisplayCount + 10)}
                className="mt-3 w-full py-2 text-sm text-secondary hover:text-secondary/80 transition-colors flex items-center justify-center gap-2"
              >
                <span>查看更多新闻</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
