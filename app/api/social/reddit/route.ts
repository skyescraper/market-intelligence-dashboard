import { NextResponse } from "next/server";
import type { SocialPost } from "@/lib/social-aggregator";
import { CRYPTO_SUBREDDITS, TRADING_SUBREDDITS } from "@/lib/social-aggregator";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface RedditPost {
  data: {
    title: string;
    author: string;
    permalink: string;
    score: number;
    created_utc: number;
    selftext?: string;
    subreddit: string;
  };
}

async function fetchSubreddit(subreddit: string, limit: number = 10): Promise<SocialPost[]> {
  try {
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
      {
        headers: {
          "User-Agent": "MarketIntelligence/1.0",
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      console.warn(`Failed to fetch r/${subreddit}`);
      return [];
    }

    const data = await response.json();

    return data.data.children.map((post: RedditPost) => ({
      platform: "Reddit" as const,
      content: post.data.title,
      author: post.data.author,
      url: `https://reddit.com${post.data.permalink}`,
      timestamp: new Date(post.data.created_utc * 1000),
      engagement: post.data.score,
      isKOL: false,
    }));
  } catch (error) {
    console.error(`Error fetching r/${subreddit}:`, error);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "crypto";
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    const subreddits = category === "crypto" ? CRYPTO_SUBREDDITS : TRADING_SUBREDDITS;

    // Fetch from multiple subreddits in parallel
    const postsPerSubreddit = Math.ceil(limit / subreddits.length);
    const allPosts = await Promise.all(
      subreddits.map((sub) => fetchSubreddit(sub, postsPerSubreddit))
    );

    // Flatten and sort by engagement and recency
    const posts = allPosts
      .flat()
      .sort((a, b) => {
        const scoreA = a.engagement / Math.max(1, (Date.now() - a.timestamp.getTime()) / 3600000);
        const scoreB = b.engagement / Math.max(1, (Date.now() - b.timestamp.getTime()) / 3600000);
        return scoreB - scoreA;
      })
      .slice(0, limit);

    return NextResponse.json({
      posts,
      count: posts.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Reddit API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Reddit data" },
      { status: 500 }
    );
  }
}
