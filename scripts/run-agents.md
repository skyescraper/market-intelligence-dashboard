# Multi-Agent Market Intelligence System

## 架构设计

这个系统使用多个并行 agents 来收集和分析市场情报：

```
┌─────────────────────────────────────────────────┐
│         Market Intelligence Orchestrator        │
└─────────────────┬───────────────────────────────┘
                  │
         ┌────────┴────────┐
         │   Parallel      │
         │   Execution     │
         └────────┬────────┘
                  │
    ┌─────────────┼─────────────┬──────────────┐
    │             │             │              │
┌───▼───┐   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
│Social │   │Exchange │   │Regulat. │   │AI Tools │
│Media  │   │Announce │   │Updates  │   │Tracker  │
│Agent  │   │Agent    │   │Agent    │   │Agent    │
└───┬───┘   └────┬────┘   └────┬────┘   └────┬────┘
    │            │             │              │
    │ 小红书     │ Binance     │ FCA          │ HN
    │ X/Twitter  │ OKX         │ MAS          │ Reddit
    │ Reddit     │ Coinbase    │ SEC          │ PH
    │            │ Kraken      │              │
    │            │             │              │
    └────────────┴─────────────┴──────────────┘
                  │
            ┌─────▼─────┐
            │  Analysis │
            │  Agent    │
            │  (Claude) │
            └─────┬─────┘
                  │
            ┌─────▼─────┐
            │ Dashboard │
            │   API     │
            └───────────┘
```

## Agent 职责

### 1. Social Media Agent
**任务**: 抓取社交媒体讨论
**工具**: Agent Reach MCP (小红书), Nitter (X), Reddit API
**输出**:
- KOL 发言
- 热门讨论话题
- 用户痛点和需求
**关键词**: 交易所、AI工具、DeFi、NFT、监管

### 2. Exchange Announcements Agent
**任务**: 监控交易所产品公告
**工具**: RSS Parser, Web Scraper
**输出**:
- 新币上线/下线
- Perpetual/Futures 新品
- 平台功能更新
**来源**: Binance, OKX, Coinbase, Kraken, Bybit

### 3. Regulatory Updates Agent
**任务**: 追踪监管动态
**工具**: RSS Parser, Web Fetch
**输出**:
- 牌照批准/吊销
- 监管框架更新
- 合规要求变化
**来源**: FCA, MAS, CFTC

### 4. AI Tools Tracker Agent
**任务**: 发现新 AI 工具
**工具**: HN API, Reddit API, ProductHunt API
**输出**:
- 新工具发布
- 工具分类和描述
- 社区评价
**分析**: 使用 Claude 生成中英文描述

### 5. Deep Analysis Agent
**任务**: 综合分析和总结
**工具**: Claude API (Sonnet 4)
**输出**:
- 每日市场总结
- 趋势分析
- 关注建议
**输入**: 所有其他 agents 的数据

## 实现方式

由于 Agent tool 只能在 Claude Code CLI 环境中使用，有两种实现方式：

### 方式 1: Claude Code CLI 定时任务 (推荐)

创建一个 Claude Code 脚本，使用 Agent tool：

\`\`\`typescript
// scripts/collect-intelligence.ts
import { Agent } from '@anthropic/agent-sdk';

async function collectMarketIntelligence() {
  // 并行启动所有 agents
  const agents = await Promise.all([
    Agent.run({
      type: 'general-purpose',
      description: 'Collect social media',
      prompt: '使用 xiaohongshu_mcp 和 twitter 工具抓取加密货币相关讨论...',
      run_in_background: true
    }),
    Agent.run({
      type: 'general-purpose',
      description: 'Fetch exchange announcements',
      prompt: '从 Binance, OKX RSS 抓取产品公告，过滤出上币、新功能...',
      run_in_background: true
    }),
    // ... 更多 agents
  ]);

  // 等待所有 agents 完成
  const results = await Promise.all(agents);

  // 聚合数据并存储
  await saveToDatabase(results);
}
\`\`\`

使用 cron 定时运行：
\`\`\`bash
# 每小时运行一次
0 * * * * cd /path/to/dashboard && claude-code run scripts/collect-intelligence.ts
\`\`\`

### 方式 2: 混合架构 (当前)

- **采集层**: 使用现有 API routes (Next.js)
- **分析层**: 手动或通过 webhook 触发 Claude Code agent
- **展示层**: Dashboard UI

## 使用 Agent Reach

Agent Reach 已安装的 MCP 工具：

1. **xiaohongshu_mcp** - 小红书爬虫
2. **weibo_mcp** - 微博爬虫
3. **twitter_tools** - X/Twitter 工具
4. **exa_mcp** - 高质量搜索
5. **github_mcp** - GitHub 数据

在 Claude Code 中使用：
\`\`\`bash
# 启动 agent 抓取小红书
claude-code agent --type general-purpose --prompt "使用 xiaohongshu_mcp 搜索关键词'加密货币交易所'，返回最近7天的热门帖子"
\`\`\`

## 下一步

1. ✅ 设计 multi-agent 架构
2. ⏳ 创建 Claude Code 脚本使用 Agent tool
3. ⏳ 配置定时任务自动采集
4. ⏳ 优化数据存储和缓存
5. ⏳ Dashboard UI 接入 agent 数据

## 成本优化

- **并行执行**: 所有 agents 同时运行，总耗时 ≈ 最慢的 agent
- **智能缓存**: 相同数据不重复抓取
- **按需分析**: 只对新内容调用 Claude API
- **增量更新**: 只拉取变化的数据

预估成本（每小时）：
- Agents execution: ~$0.50
- Claude analysis: ~$0.30
- 总计: ~$0.80/hour = ~$19/day
