import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface XiaohongshuPost {
  title: string;
  content: string;
  author: string;
  url: string;
  likes: number;
  comments: number;
  timestamp: Date;
  tags: string[];
  isKOL: boolean;
}

/**
 * 小红书数据采集API
 *
 * 这个API需要使用 Agent Reach 的 xiaohongshu_mcp 工具
 * 在生产环境中，应该通过 Claude Code agent 调用
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keywords = searchParams.get("keywords") || "加密货币,比特币,交易所";
  const limit = parseInt(searchParams.get("limit") || "20");
  const page = parseInt(searchParams.get("page") || "1");

  try {
    // 注意：xiaohongshu_mcp 需要在 Claude Code 环境中通过 agent 调用
    // 这里提供Mock数据作为示例，实际应该通过 agent 获取真实数据

    // 生成真实格式的小红书note ID (24位hex)
    const generateNoteId = (seed: number) => {
      return seed.toString(16).padStart(24, '0');
    };

    const mockPosts: XiaohongshuPost[] = Array.from({ length: limit }, (_, i) => {
      const postId = (page - 1) * limit + i;
      const noteId = generateNoteId(1000000 + postId);
      return {
        title: `【加密货币】${["Binance新功能体验", "OKX合约交易心得", "Coinbase使用教程", "币圈避坑指南", "DeFi新项目分析"][postId % 5]}`,
        content: `这是第${postId + 1}条小红书帖子的内容摘要...最近发现了一个很实用的功能，分享给大家。`,
        author: `用户${postId + 1}`,
        url: `https://www.xiaohongshu.com/explore/${noteId}`,
        likes: Math.floor(Math.random() * 5000) + 100,
        comments: Math.floor(Math.random() * 500) + 10,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 3600000),
        tags: ["加密货币", "交易所", "投资"].slice(0, Math.floor(Math.random() * 3) + 1),
        isKOL: Math.random() > 0.7,
      };
    });

    return NextResponse.json({
      posts: mockPosts,
      page,
      limit,
      total: 100, // Mock总数
      hasMore: page * limit < 100,
      isMockData: true,
      note: "⚠️ 当前显示的是MOCK测试数据，URL链接为示例格式。要获取真实小红书数据，需要配置 Agent Reach 的 xiaohongshu_mcp 工具。配置完成后，真实数据将通过 MCP 工具自动采集并替换这些示例数据。",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Xiaohongshu API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Xiaohongshu data" },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for agent to submit collected data
 * Agent 可以通过这个接口提交采集到的真实数据
 */
export async function POST(request: Request) {
  try {
    const { posts, metadata } = await request.json();

    // 这里应该将数据存储到数据库
    // 目前只是返回确认

    return NextResponse.json({
      status: "success",
      received: posts?.length || 0,
      message: "Xiaohongshu data received and processed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to process Xiaohongshu data:", error);
    return NextResponse.json(
      { error: "Failed to process data" },
      { status: 500 }
    );
  }
}
