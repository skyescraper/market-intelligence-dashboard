import { NextResponse } from "next/server";
import type { CryptoAsset } from "@/lib/types";

export const runtime = "edge";

export async function GET() {
  try {
    // CoinGecko trending API (free, no key needed)
    const trendingRes = await fetch(
      "https://api.coingecko.com/api/v3/search/trending",
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!trendingRes.ok) {
      throw new Error("CoinGecko API failed");
    }

    const trendingData = await trendingRes.json();

    // Get price data for trending coins
    const coinIds = trendingData.coins
      .slice(0, 10)
      .map((coin: any) => coin.item.id)
      .join(",");

    const priceRes = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
      {
        next: { revalidate: 300 },
      }
    );

    const priceData = await priceRes.json();

    // Combine trending and price data
    const assets: CryptoAsset[] = trendingData.coins.slice(0, 10).map((coin: any) => {
      const item = coin.item;
      const priceInfo = priceData[item.id];
      const change24h = priceInfo?.usd_24h_change || 0;

      return {
        id: item.id,
        name: item.name,
        symbol: item.symbol.toUpperCase(),
        price: priceInfo ? `$${priceInfo.usd.toLocaleString()}` : "N/A",
        change24h: Math.round(change24h * 100) / 100,
        marketCapRank: item.market_cap_rank || 0,
        volume: `${item.data?.market_cap_rank || 0}`,
        trend: change24h >= 0 ? "up" : "down",
        mentions: Math.floor(Math.random() * 1000 + 500), // Placeholder for Reddit data
        mentionsTrend: Math.floor(Math.random() * 200 - 100),
        timestamp: new Date(),
      };
    });

    return NextResponse.json({ assets, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Crypto API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch crypto data" },
      { status: 500 }
    );
  }
}
