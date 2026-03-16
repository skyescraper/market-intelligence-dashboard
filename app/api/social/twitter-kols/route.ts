import { NextResponse } from "next/server";
import Parser from "rss-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parser = new Parser();

interface TwitterKOL {
  username: string;
  name: string;
  company: string;
  category: "币圈交易所" | "CFD券商" | "传统券商" | "政府" | "牌照监管" | "支付" | "其他";
}

// Key Opinion Leaders to track on X/Twitter
const TWITTER_KOLS: TwitterKOL[] = [
  // Crypto Exchange Leaders
  { username: "cz_binance", name: "CZ (赵长鹏)", company: "Binance", category: "币圈交易所" },
  { username: "brian_armstrong", name: "Brian Armstrong", company: "Coinbase", category: "币圈交易所" },
  { username: "jessepollak", name: "Jesse Pollak", company: "Coinbase", category: "币圈交易所" },
  { username: "VitalikButerin", name: "Vitalik Buterin", company: "Ethereum", category: "币圈交易所" },
  { username: "SBF_FTX", name: "Sam Bankman-Fried", company: "FTX", category: "币圈交易所" },
  { username: "justinsuntron", name: "Justin Sun", company: "Tron", category: "币圈交易所" },

  // Traditional Finance
  { username: "schwab", name: "Charles Schwab", company: "Schwab", category: "传统券商" },
  { username: "RobinhoodApp", name: "Robinhood", company: "Robinhood", category: "传统券商" },

  // Brokers
  { username: "IGcom", name: "IG Group", company: "IG", category: "CFD券商" },
  { username: "pepperstone", name: "Pepperstone", company: "Pepperstone", category: "CFD券商" },

  // Payment
  { username: "Visa", name: "Visa", company: "Visa", category: "支付" },
  { username: "Mastercard", name: "Mastercard", company: "Mastercard", category: "支付" },
];

interface TwitterPost {
  title: string;
  titleEn: string;
  description: string;
  source: string;
  company: string;
  isKOL: boolean;
  kolName: string;
  url: string;
  publishedAt: Date;
  category: string;
  importance: 1 | 2 | 3;
  tags: string[];
  platform: "X";
}

// Nitter instances (free Twitter front-end with RSS)
const NITTER_INSTANCES = [
  "nitter.net",
  "nitter.poast.org",
  "nitter.privacydev.net",
];

async function fetchTwitterKOL(kol: TwitterKOL): Promise<TwitterPost[]> {
  // Try different nitter instances
  for (const instance of NITTER_INSTANCES) {
    try {
      const url = `https://${instance}/${kol.username}/rss`;
      const feed = await parser.parseURL(url);

      return feed.items.slice(0, 5).map((item) => {
        const title = item.title || "";
        const description = item.contentSnippet || item.content?.substring(0, 300) || "";

        // Determine importance based on keywords
        const highPriorityWords = [
          "announce", "launch", "partnership", "acquisition", "breaking",
          "important", "update", "new", "major", "宣布", "发布", "重要", "合作"
        ];
        const importance = highPriorityWords.some((word) =>
          title.toLowerCase().includes(word) || description.toLowerCase().includes(word)
        ) ? 3 : 2;

        return {
          title: `${kol.name}: ${title.substring(0, 100)}`,
          titleEn: `${kol.name}: ${title.substring(0, 100)}`,
          description: description.substring(0, 250),
          source: `X/@${kol.username}`,
          company: kol.company,
          isKOL: true,
          kolName: kol.name,
          url: item.link || `https://twitter.com/${kol.username}`,
          publishedAt: new Date(item.pubDate || Date.now()),
          category: kol.category,
          importance: importance as 1 | 2 | 3,
          tags: extractTags(title + " " + description),
          platform: "X" as const,
        };
      });
    } catch (error) {
      console.warn(`Failed to fetch from ${instance} for @${kol.username}`);
      continue;
    }
  }

  console.error(`All nitter instances failed for @${kol.username}`);
  return [];
}

function extractTags(text: string): string[] {
  const tags = [];
  const keywords = [
    "BTC", "ETH", "Bitcoin", "Ethereum", "crypto", "DeFi", "NFT",
    "regulation", "trading", "AI", "blockchain", "Web3"
  ];

  for (const keyword of keywords) {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      tags.push(keyword);
    }
  }

  // Extract hashtags
  const hashtagMatches = text.match(/#(\w+)/g);
  if (hashtagMatches) {
    tags.push(...hashtagMatches.slice(0, 3));
  }

  return [...new Set(tags)].slice(0, 5);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const category = searchParams.get("category");

  try {
    // Fetch from KOLs (limit to avoid rate limits)
    const kolsToFetch = category
      ? TWITTER_KOLS.filter((kol) => kol.category === category).slice(0, 5)
      : TWITTER_KOLS.slice(0, 10);

    const allPosts = await Promise.all(
      kolsToFetch.map((kol) => fetchTwitterKOL(kol))
    );

    const posts = allPosts
      .flat()
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, limit);

    return NextResponse.json({
      posts,
      total: posts.length,
      kolCount: posts.length,
      updatedAt: new Date().toISOString(),
      note: "Using Nitter RSS (free Twitter alternative). For real-time data, add TWITTER_BEARER_TOKEN to .env",
    });
  } catch (error) {
    console.error("Twitter KOLs API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Twitter KOL data" },
      { status: 500 }
    );
  }
}
