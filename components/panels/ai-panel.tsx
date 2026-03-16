"use client";

import { Sparkles, ThumbsUp, Heart, ExternalLink } from "lucide-react";

interface AIPanelProps {
  timeRange: "1H" | "24H" | "7D";
}

// Mock data
const mockTools = [
  {
    name: "v0.dev AI",
    category: "Code Generation",
    description: "Generate UI components from text descriptions",
    votes: 2834,
    sentiment: "LOVED",
    pricing: "Freemium",
    url: "#",
  },
  {
    name: "Cursor AI",
    category: "Development",
    description: "AI-powered code editor with context awareness",
    votes: 1892,
    sentiment: "USEFUL",
    pricing: "Paid",
    url: "#",
  },
  {
    name: "Claude Code",
    category: "Productivity",
    description: "AI assistant for software development tasks",
    votes: 1543,
    sentiment: "LOVED",
    pricing: "Paid",
    url: "#",
  },
];

const mockNews = [
  {
    title: "OpenAI releases GPT-5 with advanced reasoning",
    category: "Model Breakthrough",
    stars: 3,
    source: "TechCrunch",
    time: "2h ago",
  },
  {
    title: "EU AI Act enters enforcement phase",
    category: "Policy",
    stars: 3,
    source: "Reuters",
    time: "5h ago",
  },
  {
    title: "Anthropic raises $450M Series D",
    category: "Funding",
    stars: 2,
    source: "The Information",
    time: "8h ago",
  },
];

export function AIPanel({ timeRange }: AIPanelProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">AI Trends</h2>
        <Sparkles className="h-5 w-5 text-secondary" />
      </div>

      {/* AI Tools Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          🔥 Trending Tools
        </h3>
        <div className="space-y-2">
          {mockTools.map((tool) => (
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
          {mockNews.map((news, i) => (
            <div
              key={i}
              className={`bg-muted/50 rounded-lg p-3 border transition-colors cursor-pointer ${
                news.stars === 3
                  ? "border-orange-500/50 hover:border-orange-500"
                  : "border-border/50 hover:border-secondary/50"
              }`}
            >
              <div className="flex items-start gap-2 mb-1">
                <span className="text-xs shrink-0">
                  {"⭐".repeat(news.stars)}
                </span>
                <h4 className="font-medium text-sm text-foreground line-clamp-2 flex-1">
                  {news.title}
                </h4>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{news.source}</span>
                <span className="text-muted-foreground">{news.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}