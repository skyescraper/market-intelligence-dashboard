import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AITool } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

async function fetchHackerNews(): Promise<any[]> {
  try {
    // Search for Agent-related content
    const response = await fetch(
      'https://hn.algolia.com/api/v1/search?query=(agent OR agents OR "AI agent" OR "autonomous agent" OR "agentic" OR "multi-agent")&tags=story&hitsPerPage=40',
      { next: { revalidate: 1800 } }
    );

    if (!response.ok) return [];
    const data = await response.json();

    return data.hits
      .filter((hit: any) => {
        const title = hit.title?.toLowerCase() || "";
        const isAgent = title.includes("agent") ||
                       title.includes("autonomous") ||
                       title.includes("agentic") ||
                       title.includes("workflow automation") ||
                       title.includes("copilot");
        return isAgent;
      })
      .slice(0, 20);
  } catch (error) {
    console.error("HackerNews error:", error);
    return [];
  }
}

async function fetchRedditAgents(): Promise<any[]> {
  try {
    const subreddits = ["ArtificialInteligence", "AutomateYourself", "OpenAI", "LocalLLaMA"];
    const allPosts = await Promise.all(
      subreddits.map(async (sub) => {
        const res = await fetch(
          `https://www.reddit.com/r/${sub}/hot.json?limit=15`,
          {
            headers: { "User-Agent": "MarketIntelligence/1.0" },
            next: { revalidate: 1800 },
          }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.data.children
          .filter((post: any) => {
            const title = post.data.title.toLowerCase();
            return title.includes("agent") ||
                   title.includes("automation") ||
                   title.includes("autonomous") ||
                   title.includes("workflow") ||
                   title.includes("copilot");
          })
          .map((post: any) => ({
            title: post.data.title,
            url: `https://reddit.com${post.data.permalink}`,
            score: post.data.score,
            created: post.data.created_utc,
            source: "Reddit",
          }));
      })
    );

    return allPosts.flat().slice(0, 20);
  } catch (error) {
    console.error("Reddit Agents error:", error);
    return [];
  }
}

async function analyzeWithClaude(items: any[]): Promise<AITool[]> {
  if (!anthropic || items.length === 0) {
    // Fallback without AI analysis
    return items.slice(0, 20).map((item, idx) => ({
      name: item.title || item.name || "AI Agent",
      description: item.title || "AI Agent trending on social media",
      useCase: "Agent工具",
      useCaseEn: "Agent tool",
      url: item.url || "#",
      category: "Other",
      votes: item.score || item.points || 0,
      sentiment: "USEFUL" as const,
      pricing: "Unknown" as const,
      source: (item.source || "HackerNews") as "ProductHunt" | "HackerNews" | "Reddit",
      timestamp: new Date(item.created ? item.created * 1000 : Date.now()),
    }));
  }

  try {
    const itemsText = items.slice(0, 20).map((item, idx) =>
      `${idx + 1}. ${item.title || item.name} (Score: ${item.score || item.points || 0})`
    ).join("\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      temperature: 0.4,
      messages: [
        {
          role: "user",
          content: `你是一位AI Agent领域专家。分析以下AI Agent工具和讨论，为每个提供：

1. **Agent名称**（英文，如果是讨论帖提取核心Agent工具名）
2. **用途说明**（中文，1-2句话说明这个Agent用来做什么，解决什么问题）
3. **Use Case**（英文，简短描述使用场景，如"Code generation and debugging", "Research and data analysis"）
4. **分类**：
   - Coding Agent（代码生成、调试、重构）
   - Research Agent（信息搜索、数据分析、总结）
   - Workflow Agent（自动化流程、任务编排）
   - Creative Agent（内容创作、设计辅助）
   - Multi-Agent System（多Agent协作系统）
   - Other
5. **情绪**（LOVED=强烈推荐 / USEFUL=实用 / HYPED=炒作 / MIXED=褒贬不一）
6. **定价**（Free/Freemium/Paid/Open Source/Unknown）

列表：
${itemsText}

**重要：**
- 只保留真正的Agent工具，过滤掉纯讨论帖
- 用途说明要具体，不要泛泛而谈
- 如果无法确定是Agent，跳过该项

以JSON数组格式返回，每项包含：
{
  "name": "Agent名称",
  "useCase_zh": "中文用途（1-2句）",
  "useCase_en": "English use case (brief)",
  "description_en": "English description",
  "description_zh": "中文描述",
  "category": "分类",
  "sentiment": "情绪",
  "pricing": "定价"
}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // Try to parse JSON from Claude's response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const analyzed = JSON.parse(jsonMatch[0]);

    return analyzed.slice(0, 20).map((item: any, idx: number) => ({
      name: item.name || items[idx]?.title || "AI Agent",
      description: `${item.description_zh || ""}\n${item.description_en || ""}`.trim(),
      useCase: item.useCase_zh || item.useCase_en || "Agent工具",
      useCaseEn: item.useCase_en || "",
      url: items[idx]?.url || "#",
      category: item.category || "Other",
      votes: items[idx]?.score || items[idx]?.points || 0,
      sentiment: item.sentiment || "USEFUL",
      pricing: item.pricing || "Unknown",
      source: (items[idx]?.source || "HackerNews") as "ProductHunt" | "HackerNews" | "Reddit",
      timestamp: new Date(items[idx]?.created ? items[idx].created * 1000 : Date.now()),
    }));
  } catch (error) {
    console.error("Claude analysis error:", error);
    // Fallback to basic mapping
    return items.slice(0, 20).map((item) => ({
      name: item.title || item.name || "AI Agent",
      description: item.title || "Trending AI Agent",
      useCase: "Agent工具",
      useCaseEn: "Agent tool",
      url: item.url || "#",
      category: "Other",
      votes: item.score || item.points || 0,
      sentiment: "USEFUL" as const,
      pricing: "Unknown" as const,
      source: (item.source || "HackerNews") as "ProductHunt" | "HackerNews" | "Reddit",
      timestamp: new Date(item.created ? item.created * 1000 : Date.now()),
    }));
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    // Fetch from multiple sources
    const [hnData, redditData] = await Promise.all([
      fetchHackerNews(),
      fetchRedditAgents(),
    ]);

    // Combine and sort by recency and engagement
    const allItems = [...hnData, ...redditData]
      .sort((a, b) => {
        const timeA = a.created_at || a.created || Date.now() / 1000;
        const timeB = b.created_at || b.created || Date.now() / 1000;
        return timeB - timeA;
      })
      .slice(0, 50);

    // Analyze with Claude AI
    const tools = await analyzeWithClaude(allItems);

    return NextResponse.json({
      tools: tools.slice(0, limit),
      total: tools.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI Tools trending error:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI tools" },
      { status: 500 }
    );
  }
}
