import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

interface StockAsset {
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
  category: "股票";
}

// Top stocks by market cap and discussion volume
const POPULAR_STOCKS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "BRK.B",
  "V", "UNH", "JNJ", "WMT", "JPM", "MA", "PG", "XOM", "HD", "CVX",
  "MRK", "ABBV", "KO", "PEP", "COST", "AVGO", "TMO", "CSCO", "ACN",
  "MCD", "ABT", "DHR", "VZ", "NKE", "ADBE", "CRM", "NFLX", "CMCSA",
  "TXN", "NEE", "INTC", "PM", "HON", "RTX", "UNP", "QCOM", "T",
  "ORCL", "LOW", "IBM", "AMD", "INTU"
];

async function fetchStockData(limit: number = 50): Promise<StockAsset[]> {
  try {
    // Using Yahoo Finance API via free service
    const symbols = POPULAR_STOCKS.slice(0, limit).join(",");

    // For demo, generate realistic mock data
    // In production, use Yahoo Finance API or Alpha Vantage
    const mockData: StockAsset[] = POPULAR_STOCKS.slice(0, limit).map((symbol, idx) => {
      const basePrice = 50 + Math.random() * 500;
      const change24h = (Math.random() - 0.5) * 10;
      const change1h = (Math.random() - 0.5) * 2;

      return {
        id: symbol.toLowerCase(),
        name: getStockName(symbol),
        symbol: symbol,
        price: `$${basePrice.toFixed(2)}`,
        priceRaw: basePrice,
        change24h: Math.round(change24h * 100) / 100,
        change1h: Math.round(change1h * 100) / 100,
        volume24h: Math.floor(Math.random() * 100000000),
        trend: change24h >= 0 ? "up" : "down",
        mentions: Math.floor(Math.random() * 1500 + 300),
        sentiment: change24h > 3 ? "bullish" : change24h < -3 ? "bearish" : "neutral",
        volatility1h: Math.abs(change1h),
        timestamp: new Date(),
        category: "股票" as const,
      };
    });

    return mockData;
  } catch (error) {
    console.error("Stock data fetch error:", error);
    return [];
  }
}

function getStockName(symbol: string): string {
  const names: Record<string, string> = {
    "AAPL": "Apple Inc",
    "MSFT": "Microsoft Corp",
    "GOOGL": "Alphabet Inc",
    "AMZN": "Amazon.com Inc",
    "NVDA": "NVIDIA Corp",
    "TSLA": "Tesla Inc",
    "META": "Meta Platforms",
    "BRK.B": "Berkshire Hathaway",
    "V": "Visa Inc",
    "UNH": "UnitedHealth Group",
    "JNJ": "Johnson & Johnson",
    "WMT": "Walmart Inc",
    "JPM": "JPMorgan Chase",
    "MA": "Mastercard Inc",
    "PG": "Procter & Gamble",
    "XOM": "Exxon Mobil",
    "HD": "Home Depot",
    "CVX": "Chevron Corp",
    "NFLX": "Netflix Inc",
    "AMD": "Advanced Micro Devices",
  };
  return names[symbol] || symbol;
}

async function generateAIRecommendation(assets: StockAsset[]): Promise<any> {
  if (!anthropic || assets.length === 0) {
    return {
      recommended: assets[0]?.symbol || "AAPL",
      currentPrice: assets[0]?.priceRaw || 0,
      reason_zh: "基于当前市场表现和基本面分析",
      reason_en: "Based on current market performance and fundamental analysis",
      buyPrice: "等待回调至支撑位",
      sellPrice: "根据技术阻力位设定",
      stopLoss: "近期低点下方3-5%",
      holding: "中线（1-2周）",
      confidence: "Medium (60%)",
      supportingLogic: {
        technical: "技术指标中性，等待突破信号",
        sentiment: "市场情绪稳定",
        news: "无重大消息影响",
        social: "社交媒体讨论度正常",
        expert: "分析师观点分歧",
      },
    };
  }

  try {
    const topAssets = assets.slice(0, 10).map((a, idx) =>
      `${idx + 1}. ${a.name} (${a.symbol}):
   当前价格 = $${a.priceRaw.toFixed(2)}
   24h涨跌 = ${a.change24h >= 0 ? '+' : ''}${a.change24h}%
   1h涨跌 = ${a.change1h >= 0 ? '+' : ''}${a.change1h}%
   1h波动率 = ${a.volatility1h.toFixed(2)}%
   24h交易量 = $${(a.volume24h / 1e6).toFixed(2)}M
   市场情绪 = ${a.sentiment}`
    ).join("\n\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: `你是一位资深的美股分析师，拥有CFA资格和10年+投资经验。请深度分析以下股票，推荐当前最值得关注的1个标的：

**股票数据（Top 10）：**
${topAssets}

**分析维度（必须结合以下5个维度）：**
1. **技术分析（Technical Analysis）**：价格趋势、支撑阻力位、交易量、技术指标
2. **市场情绪（Market Sentiment）**：投资者情绪、恐慌贪婪指数、涨跌幅
3. **新闻影响（News Impact）**：财报、产品发布、监管、并购
4. **社媒舆情（Social Media）**：Reddit/Twitter讨论热度、散户情绪
5. **专家分析（Expert Opinion）**：机构评级、分析师目标价、资金流向

**输出要求（必须基于实际数据精确计算）：**

所有价格必须是精确数字，不能用模糊描述：
- 当前价格：从数据提取（如：$156.78）
- 买入区间：基于当前价格±2-5%计算（如：$153.20 - $158.40）
- 止盈价位：单一目标价（如：$168.50）
- 止损价位：单一价格（如：$149.80）

**价格计算公式**：
- 买入下限 = 当前价格 × 0.97（支撑位）
- 买入上限 = 当前价格 × 1.01（合理进场）
- 止盈 = 当前价格 × 1.08-1.12（目标收益）
- 止损 = 当前价格 × 0.95（最大亏损容忍）

以JSON格式返回：
{
  "recommended": "股票代号（不要总选第一个）",
  "currentPrice": 实际当前价格,
  "reason_zh": "为什么选它？结合波动率${X}%、交易量$${X}M、涨跌幅${X}%具体分析（3-4句）",
  "reason_en": "Why this one? Based on volatility ${X}%, volume $${X}M, change ${X}% (3-4 sentences)",
  "buyPrice": "精确区间（如：$153.20 - $158.40）",
  "sellPrice": "精确价格（如：$168.50）",
  "stopLoss": "精确价格（如：$149.80）",
  "holding": "短线/中线/长线",
  "confidence": "High/Medium/Low (百分比)",
  "supportingLogic": {
    "technical": "波动率${X}%说明XXX，交易量$${X}M表示XXX（具体数据分析）",
    "sentiment": "当前情绪${sentiment}，结合涨跌${change}%判断XXX",
    "news": "基本面：近期财报/产品/监管如何影响",
    "social": "社媒热度和散户情绪如何",
    "expert": "机构评级和资金流向如何"
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
      recommended: assets[0]?.symbol || "AAPL",
      currentPrice: assets[0]?.priceRaw || 0,
      reason_zh: "基于当前市场表现综合评估，该股票基本面稳健",
      reason_en: "Based on comprehensive evaluation, this stock has solid fundamentals",
      buyPrice: "当前价格区间支撑位附近",
      sellPrice: "根据技术阻力位设定目标价",
      stopLoss: "建议设置在近期低点下方3-5%",
      holding: "中线持有（1-2周）",
      confidence: "Medium (60%)",
      supportingLogic: {
        technical: "技术指标显示中性，等待明确突破信号",
        sentiment: "市场情绪稳定，无极端情况",
        news: "基本面稳定，无重大利好或利空",
        social: "社交媒体讨论度正常，无异常波动",
        expert: "机构观点分歧，建议谨慎观望",
      },
    };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    const stocks = await fetchStockData(50);
    const aiRecommendation = await generateAIRecommendation(stocks);

    return NextResponse.json({
      assets: stocks.slice(0, limit),
      aiRecommendation,
      total: stocks.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stocks API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}
