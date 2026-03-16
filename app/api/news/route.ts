import { NextResponse } from "next/server";
import Parser from "rss-parser";
import type { NewsItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parser = new Parser();

// RSS feeds for regulatory and industry news
const RSS_FEEDS = [
  { url: "https://www.sec.gov/news/pressreleases.rss", category: "监管", source: "SEC" },
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", category: "行业", source: "CoinDesk" },
  { url: "https://decrypt.co/feed", category: "行业", source: "Decrypt" },
];

async function fetchRSSFeed(feedUrl: string, category: string, source: string): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    return feed.items.slice(0, 5).map((item) => ({
      title: item.title || "",
      description: item.contentSnippet || item.content?.substring(0, 200) || "",
      source,
      url: item.link || "",
      publishedAt: new Date(item.pubDate || Date.now()),
      category,
      importance: (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3,
      tags: extractTags(item.title || ""),
    }));
  } catch (error) {
    console.error(`Failed to fetch ${source}:`, error);
    return [];
  }
}

function extractTags(title: string): string[] {
  const tags = [];
  const keywords = ["BTC", "ETH", "Bitcoin", "Ethereum", "SEC", "FCA", "MAS", "DeFi", "NFT", "ETF"];

  for (const keyword of keywords) {
    if (title.toUpperCase().includes(keyword.toUpperCase())) {
      tags.push(keyword);
    }
  }

  return tags.slice(0, 3);
}

async function fetchNewsAPI(): Promise<NewsItem[]> {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    console.warn("NEWS_API_KEY not set, skipping NewsAPI");
    return [];
  }

  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=crypto OR fintech OR blockchain OR SEC&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error("NewsAPI failed");
    }

    const data = await response.json();

    return data.articles.map((article: any) => ({
      title: article.title,
      description: article.description || "",
      source: article.source.name,
      url: article.url,
      publishedAt: new Date(article.publishedAt),
      category: "行业",
      importance: (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3,
      tags: extractTags(article.title),
    }));
  } catch (error) {
    console.error("NewsAPI error:", error);
    return [];
  }
}

export async function GET() {
  try {
    // Fetch from all sources in parallel
    const [newsApiItems, ...rssItems] = await Promise.all([
      fetchNewsAPI(),
      ...RSS_FEEDS.map((feed) => fetchRSSFeed(feed.url, feed.category, feed.source)),
    ]);

    const allNews = [...newsApiItems, ...rssItems.flat()]
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, 20);

    return NextResponse.json({
      news: allNews,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("News API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
