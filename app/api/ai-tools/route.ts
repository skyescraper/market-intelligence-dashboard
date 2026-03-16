import { NextResponse } from "next/server";
import type { AITool } from "@/lib/types";

export const runtime = "edge";

async function fetchHackerNews(): Promise<AITool[]> {
  try {
    // HackerNews Algolia API - search for AI-related Show HN posts
    const response = await fetch(
      'https://hn.algolia.com/api/v1/search?query=AI&tags=show_hn&hitsPerPage=10',
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error("HackerNews API failed");
    }

    const data = await response.json();

    return data.hits.slice(0, 5).map((hit: any) => ({
      name: hit.title.replace(/^Show HN:\s*/i, ""),
      description: hit.title,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      category: "Development",
      votes: hit.points || 0,
      sentiment: hit.points > 100 ? "LOVED" : hit.points > 50 ? "USEFUL" : "MIXED",
      pricing: "Open Source" as const,
      source: "HackerNews" as const,
      timestamp: new Date(hit.created_at),
    }));
  } catch (error) {
    console.error("HackerNews API error:", error);
    return [];
  }
}

async function fetchProductHunt(): Promise<AITool[]> {
  try {
    // ProductHunt public API - top posts
    const response = await fetch(
      'https://api.producthunt.com/v2/api/graphql',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `{
            posts(first: 10, order: VOTES) {
              edges {
                node {
                  name
                  tagline
                  votesCount
                  url
                  createdAt
                }
              }
            }
          }`,
        }),
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      // If ProductHunt API fails, return empty array
      console.warn("ProductHunt API failed");
      return [];
    }

    const data = await response.json();

    if (!data.data?.posts?.edges) {
      return [];
    }

    return data.data.posts.edges.slice(0, 5).map((edge: any) => {
      const node = edge.node;
      return {
        name: node.name,
        description: node.tagline,
        url: node.url,
        category: "Productivity",
        votes: node.votesCount || 0,
        sentiment: node.votesCount > 500 ? "LOVED" : node.votesCount > 200 ? "USEFUL" : "MIXED",
        pricing: "Freemium" as const,
        source: "ProductHunt" as const,
        timestamp: new Date(node.createdAt),
      };
    });
  } catch (error) {
    console.error("ProductHunt API error:", error);
    return [];
  }
}

export async function GET() {
  try {
    const [hnTools, phTools] = await Promise.all([
      fetchHackerNews(),
      fetchProductHunt(),
    ]);

    const allTools = [...hnTools, ...phTools]
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 10);

    return NextResponse.json({
      tools: allTools,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI Tools API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI tools" },
      { status: 500 }
    );
  }
}
