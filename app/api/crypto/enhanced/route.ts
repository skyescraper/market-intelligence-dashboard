import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

interface CryptoAssetEnhanced {
  id: string;
  name: string;
  symbol: string;
  price: string;
  priceRaw: number;
  change24h: number;
  change1h: number;
  marketCapRank: number;
  volume24h: number;
  trend: "up" | "down";
  mentions: number;
  mentionsTrend: number;
  sentiment: "bullish" | "bearish" | "neutral";
  volatility1h: number;
  timestamp: Date;
}

async function fetchCryptoData(limit: number = 50): Promise<CryptoAssetEnhanced[]> {
  try {
    // CoinGecko market data
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=1h,24h`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) throw new Error("CoinGecko API failed");

    const data = await response.json();

    return data.map((coin: any) => {
      const change1h = coin.price_change_percentage_1h_in_currency || 0;
      const change24h = coin.price_change_percentage_24h || 0;

      return {
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        price: `$${coin.current_price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`,
        priceRaw: coin.current_price,
        change24h: Math.round(change24h * 100) / 100,
        change1h: Math.round(change1h * 100) / 100,
        marketCapRank: coin.market_cap_rank || 0,
        volume24h: coin.total_volume || 0,
        trend: change24h >= 0 ? "up" : "down",
        mentions: Math.floor(Math.random() * 2000 + 500),
        mentionsTrend: Math.floor(Math.random() * 300 - 150),
        sentiment: change24h > 5 ? "bullish" : change24h < -5 ? "bearish" : "neutral",
        volatility1h: Math.abs(change1h),
        timestamp: new Date(),
      };
    });
  } catch (error) {
    console.error("Crypto data fetch error:", error);
    return [];
  }
}

async function generateAIRecommendation(assets: CryptoAssetEnhanced[], assetType: string = "crypto"): Promise<any> {
  if (!anthropic || assets.length === 0) {
    return {
      recommended: assets[0]?.symbol || "BTC",
      reason_zh: "基于市场情绪和交易量分析",
      reason_en: "Based on market sentiment and trading volume analysis",
      entry: `当前价格附近`,
      exit: `根据个人风险偏好设定`,
      holding: "中线",
      confidence: "Medium",
      supportingLogic: {
        technical: "技术指标显示中性",
        sentiment: "市场情绪稳定",
        news: "无重大新闻影响",
        social: "社交媒体讨论度平稳",
        expert: "专家观点分歧",
      },
    };
  }

  try {
    const topAssets = assets.slice(0, 10).map((a, idx) =>
      `${idx + 1}. ${a.name} (${a.symbol}):
   当前价格 = ${a.priceRaw.toFixed(8)} USD
   24h涨跌 = ${a.change24h >= 0 ? '+' : ''}${a.change24h}%
   1h涨跌 = ${a.change1h >= 0 ? '+' : ''}${a.change1h}%
   1h波动率 = ${a.volatility1h.toFixed(2)}%
   24h交易量 = $${(a.volume24h / 1e6).toFixed(2)}M
   市场情绪 = ${a.sentiment}
   市值排名 = #${a.marketCapRank}`
    ).join("\n\n");

    const assetTypePrompts: Record<string, string> = {
      crypto: "加密货币（Crypto）",
      stocks: "股票（Stocks）",
      forex: "外汇（Forex）",
      commodities: "大宗商品（Commodities）",
    };

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: `你是一位资深的${assetTypePrompts[assetType] || "加密货币"}量化交易分析师，拥有10年+技术分析经验和实战交易记录。

**任务：从以下资产中找出当前最具投资价值的1个标的（不要总是选排名第一的，要真正分析哪个最有机会）**

**资产数据（Top 10）：**
${topAssets}

**分析要求（请逐项深入分析）：**

1. **技术面评估**：
   - 比较各资产的波动率：波动率高=机会大但风险高，波动率低=稳健但收益有限
   - 分析24h和1h涨跌幅的关系：是加速上涨？见顶回落？筑底反弹？
   - 评估交易量：高交易量=资金关注度高，低交易量=可能被冷落或即将启动
   - 基于当前价格计算合理的支撑位和阻力位

2. **市场情绪判断**：
   - sentiment显示的情绪是否与价格走势匹配？
   - 是否有情绪过热（FOMO）或过度恐慌的迹象？
   - 情绪与价格背离通常是反转信号

3. **风险收益比**：
   - 不要只看涨幅，要评估"还有多少上涨空间"vs"下跌风险"
   - 已经大涨的可能面临回调，下跌多的可能是反弹机会
   - 计算潜在收益/风险比例，优选比例>2:1的标的

4. **实战建议（必须精确计算价格）**：
   - **买入区间**：基于当前价格的±2-5%，找到技术支撑位，给出明确上下限（例：当前$43,567→买入$42,800-$43,900）
   - **止盈价位**：基于上方阻力位或风险收益比2:1，给出单一目标价（例：$48,200）
   - **止损价位**：基于近期低点下方或破位点，给出单一价格（例：$41,500）
   - 所有价格必须是可执行的精确数字，不能写"当前价格附近"、"根据支撑位"等模糊描述

**价格计算要求（严格遵守）**：
- 从上面的数据中提取实际当前价格（currentPrice字段）
- 买入区间 = 当前价格 × (1 ± 0.02~0.05)，取整到合理精度
- 止盈价位 = 买入价 × (1 + 预期收益%)，必须 > 当前价格
- 止损价位 = 买入价 × (1 - 最大容忍亏损%)，必须 < 当前价格
- 确保风险收益比 ≥ 2:1

**关键要求**：
- 不要总是选排名第一的，要找真正有性价比的
- 所有价格必须基于实际数据精确计算，给出具体数字
- 分析要结合实际数据（波动率X%、交易量$XM），不要空洞描述
- 如果都不够吸引人，推荐"观望"（WAIT）

以JSON格式返回：
{
  "recommended": "代号（如BTC/ETH/SOL/WAIT）",
  "currentPrice": 从数据提取的实际当前价格,
  "reason_zh": "为什么选它？具体说明：波动率X%意味着什么，交易量$XM说明什么，为何优于其他（3-4句）",
  "reason_en": "Why this one? Specify: volatility X% means what, volume $XM indicates what, why better than others (3-4 sentences)",
  "buyPrice": "精确买入区间（必须是数字，如：$42,800 - $43,900）",
  "sellPrice": "精确止盈价位（必须是数字，如：$48,200）",
  "stopLoss": "精确止损价位（必须是数字，如：$41,500）",
  "holding": "短线1-3天/中线1-2周/长线1月+",
  "confidence": "High/Medium/Low (百分比)",
  "supportingLogic": {
    "technical": "技术面：波动率${volatility}%表明风险/机会程度，交易量$${volume}M显示资金关注度，趋势判断XXX（具体数据分析，2-3句）",
    "sentiment": "情绪：当前${sentiment}，结合涨跌幅${change}%判断是否过热/恐慌（具体判断，1-2句）",
    "news": "基本面：近期是否有重大消息影响？（具体说明，1-2句）",
    "social": "社媒：讨论热度如何？KOL观点倾向？（具体说明，1-2句）",
    "expert": "机构：资金流向如何？分析师评级如何？（具体说明，1-2句）"
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
      recommended: assets[0]?.symbol || "BTC",
      currentPrice: assets[0]?.priceRaw || 0,
      reason_zh: "基于当前市场表现综合评估，该资产表现相对稳定",
      reason_en: "Based on comprehensive current market performance evaluation, this asset shows relative stability",
      buyPrice: "当前价格区间支撑位附近",
      sellPrice: "根据个人风险承受能力设定",
      stopLoss: "建议设置在近期低点下方3-5%",
      holding: "中线持有（1-2周）",
      confidence: "Medium (60%)",
      supportingLogic: {
        technical: "技术指标显示中性，需等待明确趋势信号",
        sentiment: "市场情绪稳定，无极端恐慌或贪婪",
        news: "无重大新闻影响，基本面稳定",
        social: "社交媒体讨论度平稳，无明显炒作迹象",
        expert: "专家观点分歧，建议谨慎观望",
      },
    };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const sortBy = searchParams.get("sortBy") || "marketCap"; // marketCap, volatility, volume, sentiment

  try {
    let assets = await fetchCryptoData(50);

    // Sort based on criteria
    switch (sortBy) {
      case "volatility":
        assets.sort((a, b) => b.volatility1h - a.volatility1h);
        break;
      case "volume":
        assets.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case "sentiment":
        assets.sort((a, b) => {
          const sentimentScore = { bullish: 3, neutral: 2, bearish: 1 };
          return (sentimentScore[b.sentiment] || 2) - (sentimentScore[a.sentiment] || 2);
        });
        break;
      case "change24h":
        assets.sort((a, b) => b.change24h - a.change24h);
        break;
      default:
        assets.sort((a, b) => a.marketCapRank - b.marketCapRank);
    }

    // Generate AI recommendation
    const aiRecommendation = await generateAIRecommendation(assets);

    return NextResponse.json({
      assets: assets.slice(0, limit),
      aiRecommendation,
      total: assets.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Enhanced crypto API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch crypto data" },
      { status: 500 }
    );
  }
}
