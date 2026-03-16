import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

interface Asset {
  id: string;
  name: string;
  symbol: string;
  price: string;
  priceRaw: number;
  change24h: number;
  change1h: number;
  volume24h: number;
  trend: "up" | "down";
  mentions: number;
  sentiment: "bullish" | "bearish" | "neutral";
  volatility1h: number;
  timestamp: Date;
  category: "外汇" | "大宗商品";
}

const FOREX_PAIRS = [
  { symbol: "EUR/USD", name: "欧元/美元", base: 1.08 },
  { symbol: "GBP/USD", name: "英镑/美元", base: 1.27 },
  { symbol: "USD/JPY", name: "美元/日元", base: 149.5 },
  { symbol: "USD/CHF", name: "美元/瑞郎", base: 0.88 },
  { symbol: "AUD/USD", name: "澳元/美元", base: 0.65 },
  { symbol: "USD/CAD", name: "美元/加元", base: 1.36 },
  { symbol: "NZD/USD", name: "纽元/美元", base: 0.59 },
  { symbol: "EUR/GBP", name: "欧元/英镑", base: 0.85 },
  { symbol: "EUR/JPY", name: "欧元/日元", base: 161.5 },
  { symbol: "GBP/JPY", name: "英镑/日元", base: 190.2 },
];

const COMMODITIES = [
  { symbol: "XAU/USD", name: "黄金", base: 2045 },
  { symbol: "XAG/USD", name: "白银", base: 24.5 },
  { symbol: "WTI", name: "美国原油", base: 78.5 },
  { symbol: "BRENT", name: "布伦特原油", base: 82.3 },
  { symbol: "NG", name: "天然气", base: 2.85 },
  { symbol: "XCU", name: "铜", base: 3.82 },
  { symbol: "XPT", name: "铂金", base: 915 },
  { symbol: "XPD", name: "钯金", base: 1050 },
  { symbol: "WHEAT", name: "小麦", base: 5.85 },
  { symbol: "CORN", name: "玉米", base: 4.55 },
];

async function generateMockData(): Promise<Asset[]> {
  const forexData: Asset[] = FOREX_PAIRS.map((pair) => {
    const change24h = (Math.random() - 0.5) * 2;
    const change1h = (Math.random() - 0.5) * 0.5;
    const price = pair.base * (1 + change24h / 100);

    return {
      id: pair.symbol.toLowerCase().replace(/\//g, ""),
      name: pair.name,
      symbol: pair.symbol,
      price: price.toFixed(4),
      priceRaw: price,
      change24h: Math.round(change24h * 100) / 100,
      change1h: Math.round(change1h * 100) / 100,
      volume24h: Math.floor(Math.random() * 50000000),
      trend: change24h >= 0 ? "up" : "down",
      mentions: Math.floor(Math.random() * 800 + 200),
      sentiment: change24h > 0.5 ? "bullish" : change24h < -0.5 ? "bearish" : "neutral",
      volatility1h: Math.abs(change1h),
      timestamp: new Date(),
      category: "外汇" as const,
    };
  });

  const commodityData: Asset[] = COMMODITIES.map((commodity) => {
    const change24h = (Math.random() - 0.5) * 5;
    const change1h = (Math.random() - 0.5) * 1.5;
    const price = commodity.base * (1 + change24h / 100);

    return {
      id: commodity.symbol.toLowerCase().replace(/\//g, ""),
      name: commodity.name,
      symbol: commodity.symbol,
      price: `$${price.toFixed(2)}`,
      priceRaw: price,
      change24h: Math.round(change24h * 100) / 100,
      change1h: Math.round(change1h * 100) / 100,
      volume24h: Math.floor(Math.random() * 30000000),
      trend: change24h >= 0 ? "up" : "down",
      mentions: Math.floor(Math.random() * 600 + 150),
      sentiment: change24h > 2 ? "bullish" : change24h < -2 ? "bearish" : "neutral",
      volatility1h: Math.abs(change1h),
      timestamp: new Date(),
      category: "大宗商品" as const,
    };
  });

  return [...forexData, ...commodityData];
}

async function generateAIRecommendation(assets: Asset[]): Promise<any> {
  if (!anthropic || assets.length === 0) {
    return {
      recommended: assets[0]?.symbol || "XAU/USD",
      currentPrice: assets[0]?.priceRaw || 0,
      reason_zh: "基于技术面和宏观经济分析",
      reason_en: "Based on technical and macroeconomic analysis",
      buyPrice: "等待回调至关键支撑位",
      sellPrice: "根据技术阻力位设定",
      stopLoss: "近期低点下方2-3%",
      holding: "短线（1-3天）",
      confidence: "Medium (55%)",
      supportingLogic: {
        technical: "技术指标中性，需确认趋势",
        sentiment: "市场避险情绪平稳",
        news: "无重大宏观事件",
        social: "交易者关注度正常",
        expert: "机构观点分歧",
      },
    };
  }

  try {
    const topAssets = assets.slice(0, 10).map((a, idx) =>
      `${idx + 1}. ${a.name} (${a.symbol}):
   当前价格 = ${a.category === "外汇" ? a.priceRaw.toFixed(5) : `$${a.priceRaw.toFixed(2)}`}
   24h涨跌 = ${a.change24h >= 0 ? '+' : ''}${a.change24h}%
   1h涨跌 = ${a.change1h >= 0 ? '+' : ''}${a.change1h}%
   1h波动率 = ${a.volatility1h.toFixed(2)}%
   市场情绪 = ${a.sentiment}
   类型 = ${a.category}`
    ).join("\n\n");

    const hasForex = assets.some(a => a.category === "外汇");
    const hasCommodity = assets.some(a => a.category === "大宗商品");
    const assetTypeDesc = hasForex && hasCommodity ? "外汇和大宗商品" : hasForex ? "外汇" : "大宗商品";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: `你是一位资深的${assetTypeDesc}交易分析师，拥有10年+外汇和商品市场经验。请深度分析以下标的，推荐当前最值得关注的1个：

**${assetTypeDesc}数据（Top 10）：**
${topAssets}

**分析维度（必须结合以下5个维度）：**
1. **技术分析（Technical Analysis）**：价格趋势、关键支撑阻力位、波动率、技术指标
2. **市场情绪（Market Sentiment）**：避险情绪、美元指数、多空比例
3. **新闻影响（News Impact）**：央行政策、地缘政治、经济数据、供需变化
4. **社媒舆情（Social Media）**：交易者讨论热度、专业交易员观点
5. **专家分析（Expert Opinion）**：投行预测、机构持仓、资金流向

**输出要求（必须基于实际数据精确计算）：**

所有价格必须是精确数字：
- 外汇：5位小数（如：1.08234 - 1.09012）
- 大宗商品：2位小数（如：$2,045.80 - $2,068.50）

**价格计算要求**：
- 买入区间：当前价格±1-3%（外汇波动小，商品波动大）
- 止盈：基于技术阻力位或风险收益比2:1
- 止损：基于近期低点或最大容忍亏损2-3%

以JSON格式返回：
{
  "recommended": "代号（不要总选第一个）",
  "currentPrice": 实际当前价格,
  "reason_zh": "为什么选它？结合波动率${X}%、情绪${sentiment}、涨跌${change}%具体分析（3-4句）",
  "reason_en": "Why this one? Based on volatility ${X}%, sentiment, change ${X}% (3-4 sentences)",
  "buyPrice": "精确区间（外汇：1.08234-1.09012 / 商品：$2,045.80-$2,068.50）",
  "sellPrice": "精确价格（外汇：1.10500 / 商品：$2,180.00）",
  "stopLoss": "精确价格（外汇：1.07500 / 商品：$2,010.00）",
  "holding": "短线1-3天/中线1-2周",
  "confidence": "High/Medium/Low (百分比)",
  "supportingLogic": {
    "technical": "波动率${X}%表明XXX，趋势判断XXX（具体分析）",
    "sentiment": "避险情绪${sentiment}如何影响",
    "news": "央行政策/地缘政治/经济数据如何影响",
    "social": "交易者讨论热度和观点如何",
    "expert": "投行预测和机构持仓如何"
  }
}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response");

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("AI recommendation error:", error);
    return {
      recommended: assets[0]?.symbol || "XAU/USD",
      currentPrice: assets[0]?.priceRaw || 0,
      reason_zh: "基于当前市场环境和技术面综合评估",
      reason_en: "Based on current market conditions and technical analysis",
      buyPrice: "等待回调至关键支撑位",
      sellPrice: "根据技术阻力位设定目标",
      stopLoss: "建议设置在近期低点下方2-3%",
      holding: "短线（1-3天）",
      confidence: "Medium (55%)",
      supportingLogic: {
        technical: "技术指标显示震荡，需等待明确方向",
        sentiment: "市场避险情绪平稳，无极端情况",
        news: "宏观面无重大变化，关注央行政策",
        social: "专业交易者关注度正常",
        expert: "机构观点分歧，建议谨慎操作",
      },
    };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category"); // "外汇" or "大宗商品"

  try {
    const allAssets = await generateMockData();

    const filteredAssets = category
      ? allAssets.filter((asset) => asset.category === category)
      : allAssets;

    const aiRecommendation = await generateAIRecommendation(filteredAssets);

    return NextResponse.json({
      assets: filteredAssets,
      aiRecommendation,
      total: filteredAssets.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Forex/Commodities API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
