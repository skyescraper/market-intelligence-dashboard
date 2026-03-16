import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

interface DailySummary {
  date: string;
  aiTrendsSummary_zh: string;
  aiTrendsSummary_en: string;
  industryTrendsSummary_zh: string;
  industryTrendsSummary_en: string;
  twitterTrendsSummary_zh: string;
  twitterTrendsSummary_en: string;
  keyHighlights: string[];
  focusAreas: string[];
  generatedAt: Date;
}

async function fetchLatestData() {
  try {
    const [aiToolsRes, newsRes, kolRes, twitterRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/trending/ai-tools?limit=20`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/news`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/industry/kol-updates?limit=20`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/social/twitter-kols?limit=20`),
    ]);

    const aiTools = await aiToolsRes.json();
    const news = await newsRes.json();
    const kolUpdates = await kolRes.json();
    const twitter = await twitterRes.json();

    return { aiTools, news, kolUpdates, twitter };
  } catch (error) {
    console.error("Failed to fetch data for summary:", error);
    return null;
  }
}

async function generateAISummary(data: any): Promise<DailySummary | null> {
  if (!anthropic || !data) {
    return {
      date: new Date().toISOString().split("T")[0],
      aiTrendsSummary_zh: "今日AI工具和新闻概览：多个新工具发布，关注度较高",
      aiTrendsSummary_en: "Today's AI tools and news overview: Multiple new tools released with high engagement",
      industryTrendsSummary_zh: "行业动态：监管政策更新，多家机构发布公告",
      industryTrendsSummary_en: "Industry updates: Regulatory policy updates, multiple institutions announced",
      twitterTrendsSummary_zh: "X大佬动态：行业领袖活跃发声",
      twitterTrendsSummary_en: "X/Twitter KOL updates: Industry leaders actively posting",
      keyHighlights: ["AI工具发布增多", "监管动态活跃"],
      focusAreas: ["AI工具", "监管政策"],
      generatedAt: new Date(),
    };
  }

  try {
    const { aiTools, news, kolUpdates, twitter } = data;

    const topAITools = aiTools.tools?.slice(0, 10).map((t: any) => `${t.name}: ${t.description.substring(0, 80)}`).join("\n") || "";
    const topNews = news.news?.slice(0, 10).map((n: any) => `${n.title} (${n.source})`).join("\n") || "";
    const topKOL = kolUpdates.updates?.slice(0, 10).map((u: any) => `${u.company}: ${u.title}`).join("\n") || "";
    const topTwitter = twitter.posts?.slice(0, 10).map((p: any) => `${p.kolName}: ${p.description.substring(0, 100)}`).join("\n") || "";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      temperature: 0.4,
      messages: [
        {
          role: "user",
          content: `你是一位资深的市场分析师和产品经理。深入分析今日（${new Date().toLocaleDateString("zh-CN")}）的市场情报数据，生成每日核心要点（Daily Key Takeaway）。

**AI工具趋势（今日Top 10）：**
${topAITools}

**行业新闻（今日Top 10）：**
${topNews}

**KOL/企业动态（今日Top 10）：**
${topKOL}

**X/Twitter 大佬发言（今日Top 10）：**
${topTwitter}

**分析要求：**
作为交易所产品经理 + 业余投资者 + AI工具猎手，请深度挖掘以下信息：

1. **AI趋势总结**（中英文各4-5句）：
   - 哪些AI工具最值得尝试？有什么创新点？
   - 是否有颠覆性产品出现？
   - 技术趋势向哪个方向发展？

2. **行业动态总结**（中英文各4-5句）：
   - 竞品推出了什么新功能/新产品？
   - 监管有何新动向？是否影响业务？
   - 有没有重要的合作/并购/牌照信息？

3. **X/Twitter趋势总结**（中英文各4-5句）：
   - 行业大佬在讨论什么热点话题？
   - 是否有争议性观点？
   - 哪些信息值得深入研究？

4. **关键亮点**（5-7个要点）：
   - 必须是actionable insights（可执行的洞察）
   - 突出与你的工作/投资/工具选择相关的信息
   - 用简洁的中文表述

5. **今日建议关注领域**（4-6个）：
   - 具体的产品方向、投资机会、工具类别
   - 解释为什么值得关注

以JSON格式返回：
{
  "aiTrendsSummary_zh": "中文AI趋势深度总结（4-5句）",
  "aiTrendsSummary_en": "English AI trends in-depth summary (4-5 sentences)",
  "industryTrendsSummary_zh": "中文行业动态深度总结（4-5句）",
  "industryTrendsSummary_en": "English industry in-depth summary (4-5 sentences)",
  "twitterTrendsSummary_zh": "中文X趋势深度总结（4-5句）",
  "twitterTrendsSummary_en": "English X trends in-depth summary (4-5 sentences)",
  "keyHighlights": ["可执行洞察1", "可执行洞察2", "...", "洞察7"],
  "focusAreas": ["具体关注领域1（附原因）", "领域2（附原因）", "...", "领域6"]
}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response");

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      date: new Date().toISOString().split("T")[0],
      ...parsed,
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error("AI summary generation error:", error);
    return null;
  }
}

export async function GET() {
  try {
    const data = await fetchLatestData();
    const summary = await generateAISummary(data);

    if (!summary) {
      return NextResponse.json(
        { error: "Failed to generate summary" },
        { status: 500 }
      );
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Daily summary API error:", error);
    return NextResponse.json(
      { error: "Failed to generate daily summary" },
      { status: 500 }
    );
  }
}
