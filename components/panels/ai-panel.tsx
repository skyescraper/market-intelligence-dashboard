"use client";

import { useState, useEffect } from "react";
import { Sparkles, ThumbsUp, ExternalLink, Loader2 } from "lucide-react";
import { formatDateGMT8 } from "@/lib/date-utils";
import type { AITool, NewsItem } from "@/lib/types";

interface AIPanelProps {
  timeRange: "1H" | "24H" | "7D";
  refreshKey: number;
}

export function AIPanel({ timeRange, refreshKey }: AIPanelProps) {
  const [tools, setTools] = useState<AITool[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [timeRange, refreshKey]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [toolsRes, newsRes] = await Promise.all([
        fetch("/api/ai-tools"),
        fetch("/api/news"),
      ]);

      if (!toolsRes.ok || !newsRes.ok) throw new Error("Failed to fetch");

      const toolsData = await toolsRes.json();
      const newsData = await newsRes.json();

      setTools(toolsData.tools || []);
      setNews(newsData.news?.slice(0, 5) || []);
    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">AI Trends</h2>
        <Sparkles className="h-5 w-5 text-secondary" />
      </div>

      {/* Loading State */}
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
        <>
          {/* AI Tools Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              🔥 Trending Tools
            </h3>
            <div className="space-y-2">
              {tools.slice(0, 3).map((tool) => (
            <div
              key={tool.name}
              className="bg-muted/50 rounded-lg p-3 border border-border/50 hover:border-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground truncate">
                      {tool.name}
                    </h4>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {tool.pricing}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {tool.description}
                  </p>
                </div>
                <a
                  href={tool.url}
                  className="shrink-0 text-muted-foreground hover:text-secondary transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <ThumbsUp className="h-3 w-3" />
                  {tool.votes}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full ${
                    tool.sentiment === "LOVED"
                      ? "bg-up/10 text-up"
                      : "bg-secondary/10 text-secondary"
                  }`}
                >
                  {tool.sentiment}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-border/30">
                <p className="text-xs text-muted-foreground">{formatDateGMT8(tool.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

          {/* AI News Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              📰 Latest News
            </h3>
            <div className="space-y-2">
              {news.map((item, i) => (
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
                  <div className="flex items-center gap-2 mt-2">
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
          </div>
        </>
      )}
    </div>
  );
}