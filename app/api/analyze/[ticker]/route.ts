import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AIAnalysis } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    // Fetch recent data for this ticker
    const cryptoRes = await fetch(`${request.nextUrl.origin}/api/crypto`);
    const cryptoData = await cryptoRes.json();

    const asset = cryptoData.assets?.find(
      (a: any) => a.symbol.toUpperCase() === ticker.toUpperCase()
    );

    if (!asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      );
    }

    // Generate AI analysis
    const prompt = `作为一个谨慎的市场分析师，请分析 ${asset.name} (${asset.symbol})：

当前数据：
- 价格：${asset.price}
- 24小时涨跌：${asset.change24h}%
- 社交媒体提及：${asset.mentions}次 (趋势: ${asset.mentionsTrend > 0 ? '+' : ''}${asset.mentionsTrend})

请提供：
1. 为什么现在值得关注（2-3句话，基于热度和价格动态）
2. 需要注意的风险（2-3句话）
3. 关键价位区间参考（仅技术面描述，不做精确预测）
4. 建议持有周期（短线/中线/长线）

用中文回答，简洁专业。`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    const analysisText = content.type === "text" ? content.text : "";

    // Parse the response
    const lines = analysisText.split("\n").filter((line) => line.trim());

    const analysis: AIAnalysis = {
      ticker: ticker.toUpperCase(),
      whyNow: lines.find((l) => l.includes("关注"))?.replace(/^\d+\.\s*/, "") || analysisText.substring(0, 150),
      risks: lines.find((l) => l.includes("风险"))?.replace(/^\d+\.\s*/, "") || "请注意市场波动风险",
      priceZones: lines.find((l) => l.includes("价位") || l.includes("区间"))?.replace(/^\d+\.\s*/, "") || "关注当前价格附近支撑压力",
      holdingPeriod: lines.find((l) => l.includes("周期") || l.includes("持有"))?.replace(/^\d+\.\s*/, "") || "建议根据个人风险偏好决定",
      disclaimer: "以上内容仅供参考，不构成任何投资建议。投资有风险，决策需谨慎。",
      generatedAt: new Date(),
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("AI Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to generate analysis" },
      { status: 500 }
    );
  }
}
