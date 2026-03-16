import { NextResponse } from "next/server";
import Parser from "rss-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parser = new Parser();

interface KOLUpdate {
  title: string;
  titleEn: string;
  description: string;
  source: string;
  company: string;
  isKOL: boolean;
  kolName?: string;
  url: string;
  publishedAt: Date;
  category: string;
  importance: 1 | 2 | 3;
  tags: string[];
  platform: "X" | "Blog" | "LinkedIn" | "Official";
}

// 竞品官方公告频道 - 只要产品/业务动态，不要新闻
const PLATFORM_ANNOUNCEMENTS = [
  {
    url: "https://www.binance.com/en/support/announcement/c-48?navId=48",
    company: "Binance",
    category: "币圈交易所" as const,
    keywords: ["listing", "delist", "launch", "perpetual", "futures", "trading pair"],
  },
  {
    url: "https://blog.kraken.com/feed",
    company: "Kraken",
    category: "币圈交易所" as const,
    keywords: ["listing", "launch", "trading", "feature", "support"],
  },
];

// 监管机构 - 只要牌照和业务审批相关
const REGULATORY_FEEDS = [
  {
    url: "https://www.fca.org.uk/news/rss.xml",
    company: "FCA",
    category: "牌照监管" as const,
    keywords: ["license", "approval", "registration", "authorization", "firm"],
  },
];

// 政府机构 - 聚焦 RWA、数字资产政策
const GOVERNMENT_FEEDS = [
  {
    url: "https://www.mas.gov.sg/news/rss-feeds/media-releases",
    company: "MAS",
    category: "政府" as const,
    keywords: ["digital", "token", "RWA", "asset", "stablecoin", "framework"],
  },
];

// 判断是否为产品/业务公告（不是价格/市场新闻）
function isProductAnnouncement(title: string, description: string, keywords: string[]): boolean {
  const content = (title + " " + description).toLowerCase();

  // 排除价格/市场分析内容
  const excludeKeywords = [
    "price", "market analysis", "prediction", "forecast", "technical analysis",
    "bullish", "bearish", "resistance", "support",
    "trading idea", "market outlook", "price action", "rally", "dump", "crash"
  ];

  const isExcluded = excludeKeywords.some(kw => content.includes(kw));
  if (isExcluded) return false;

  // 必须包含产品/业务关键词
  const productKeywords = [
    "launch", "listing", "delist", "delisting", "feature", "product",
    "perpetual", "futures", "spot", "trading pair", "support",
    "available", "withdraw", "deposit", "upgrade", "update",
    "announce", "introduce", "service", "platform",
    "integration", "partnership", "license", "approval", "rwa",
    "stablecoin", "token", "framework", "regulation",
    "opens", "closes", "suspended", "resumed"
  ];

  const hasProductKeyword = productKeywords.some(kw => content.includes(kw));
  if (!hasProductKeyword) return false;

  // 如果提供了特定关键词，优先匹配
  if (keywords.length > 0) {
    const hasSpecificKeyword = keywords.some(kw => content.includes(kw.toLowerCase()));
    if (hasSpecificKeyword) return true;
  }

  return hasProductKeyword;
}

async function fetchRSSFeed(
  feedUrl: string,
  company: string,
  category: string,
  keywords: string[] = []
): Promise<KOLUpdate[]> {
  try {
    const feed = await parser.parseURL(feedUrl);

    if (!feed || !feed.items) {
      console.warn(`Empty feed from ${company}`);
      return [];
    }

    // 过滤并映射内容
    const filtered = feed.items
      .filter((item) => {
        const title = item.title || "";
        const description = item.contentSnippet || item.content?.substring(0, 300) || "";
        return isProductAnnouncement(title, description, keywords);
      })
      .slice(0, 15);

    if (filtered.length === 0) {
      console.warn(`No product announcements found for ${company}`);
    }

    return filtered.map((item) => {
      const title = item.title || "";
      const description = item.contentSnippet || item.content?.substring(0, 300) || "";

      // Detect if content mentions executives
      const kolKeywords = ["CEO", "founder", "executive", "announces"];
      const hasKOLMention = kolKeywords.some(
        (kw) => title.toLowerCase().includes(kw)
      );

      // Determine importance based on action type
      const highPriorityActions = ["launch", "listing", "delist", "license", "approval", "rwa", "perpetual"];
      const mediumPriorityActions = ["feature", "update", "upgrade", "partnership", "support"];

      let importance = 1;
      if (highPriorityActions.some(kw => title.toLowerCase().includes(kw))) {
        importance = 3;
      } else if (mediumPriorityActions.some(kw => title.toLowerCase().includes(kw))) {
        importance = 2;
      }

      return {
        title: title.substring(0, 150),
        titleEn: title.substring(0, 150),
        description: description.substring(0, 250),
        source: company,
        company,
        isKOL: hasKOLMention,
        kolName: undefined,
        url: item.link || "",
        publishedAt: new Date(item.pubDate || Date.now()),
        category: category as any,
        importance: importance as 1 | 2 | 3,
        tags: extractTags(title + " " + description),
        platform: "Official" as const,
      };
    });
  } catch (error) {
    console.error(`Failed to fetch ${company}:`, error);
    return [];
  }
}

function extractTags(text: string): string[] {
  const tags = [];
  const keywords = [
    "BTC", "ETH", "Bitcoin", "Ethereum", "listing", "delist",
    "perpetual", "futures", "spot", "RWA", "stablecoin",
    "license", "approval", "framework"
  ];

  for (const keyword of keywords) {
    if (text.toUpperCase().includes(keyword.toUpperCase())) {
      tags.push(keyword);
    }
  }

  return [...new Set(tags)].slice(0, 5);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const category = searchParams.get("category");

  try {
    // Fetch Twitter KOLs with proper error handling
    let twitterData = { posts: [] };
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const twitterUrl = `${baseUrl}/api/social/twitter-kols?limit=30${category ? `&category=${encodeURIComponent(category)}` : ""}`;

      const twitterRes = await fetch(twitterUrl, {
        next: { revalidate: 1800 },
      });

      if (twitterRes.ok) {
        twitterData = await twitterRes.json();
      }
    } catch (twitterError) {
      console.warn("Failed to fetch Twitter KOLs:", twitterError);
    }

    // Fetch all RSS feeds in parallel with keywords
    const allFeeds = [
      ...PLATFORM_ANNOUNCEMENTS.map((feed) =>
        fetchRSSFeed(feed.url, feed.company, feed.category, feed.keywords)
      ),
      ...REGULATORY_FEEDS.map((feed) =>
        fetchRSSFeed(feed.url, feed.company, feed.category, feed.keywords)
      ),
      ...GOVERNMENT_FEEDS.map((feed) =>
        fetchRSSFeed(feed.url, feed.company, feed.category, feed.keywords)
      ),
    ];

    const rssUpdates = (await Promise.all(allFeeds)).flat();

    // Normalize Twitter data dates
    const twitterPosts = (twitterData.posts || []).map((post: any) => ({
      ...post,
      publishedAt: new Date(post.publishedAt),
    }));

    // Combine RSS and Twitter data
    const allUpdates = [...rssUpdates, ...twitterPosts]
      .filter((update) => update.publishedAt instanceof Date && !isNaN(update.publishedAt.getTime()))
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

    // Filter by category if specified
    const filteredUpdates = category
      ? category === "X"
        ? allUpdates.filter((u) => u.platform === "X")
        : allUpdates.filter((u) => u.category === category)
      : allUpdates;

    return NextResponse.json({
      updates: filteredUpdates.slice(0, limit),
      total: filteredUpdates.length,
      kolCount: filteredUpdates.filter((u) => u.isKOL).length,
      twitterCount: twitterData.posts?.length || 0,
      productAnnouncementsCount: rssUpdates.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("KOL updates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch industry updates" },
      { status: 500 }
    );
  }
}
