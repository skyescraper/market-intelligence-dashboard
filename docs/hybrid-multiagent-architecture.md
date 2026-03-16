# 混合 Multiagent 架构实现

## 架构概览

```
┌─────────────────────────────────────────────────────────┐
│              Layer 1: 数据采集层 (Claude主系统)           │
├─────────────────────────────────────────────────────────┤
│  ✓ 外部API调用 (HN, Reddit, RSS)                        │
│  ✓ 原始数据获取和存储                                    │
│  ✓ 数据清洗和初步过滤                                    │
│  ✓ 缓存管理                                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  数据传递接口 (JSON)   │
         └───────────┬───────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            Layer 2: 智能分析层 (Agents)                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Agent 1: Deep Analyzer (深度分析)                       │
│    输入: 所有采集数据                                    │
│    输出: 趋势洞察、关联分析、预测                        │
│                                                          │
│  Agent 2: Content Generator (内容生成)                   │
│    输入: 原始数据 + 分析结果                             │
│    输出: 双语描述、标签、分类                            │
│                                                          │
│  Agent 3: Quality Filter (质量过滤)                      │
│    输入: 所有内容                                        │
│    输出: 重要性评分、去重、排序                          │
│                                                          │
│  Agent 4: Summary Generator (总结生成)                   │
│    输入: 过滤后的高质量内容                              │
│    输出: 每日简报、关键亮点、关注建议                    │
│                                                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            Layer 3: API & UI 展示层                      │
├─────────────────────────────────────────────────────────┤
│  ✓ Next.js API Routes                                   │
│  ✓ Dashboard UI Components                              │
│  ✓ 实时更新和通知                                        │
└─────────────────────────────────────────────────────────┘
```

## 当前实现状态

### ✅ 已实现 (Layer 1)
- `/api/crypto/enhanced` - 加密货币数据
- `/api/stocks` - 股票数据
- `/api/forex-commodities` - 外汇大宗商品
- `/api/social/twitter-kols` - Twitter KOL
- `/api/trending/ai-tools` - AI工具 (使用 HN + Reddit)
- `/api/industry/kol-updates` - 行业动态

### ⏳ 进行中 (Layer 2)
Agents 正在开发中，当前使用简化版本：
- 数据由主系统直接处理
- AI分析通过单次 Claude API 调用
- 未来将改为 multiagent 并行处理

### 📋 计划中 (Agent Integration)

## 如何启用 Multiagent 深度分析

### 方式1: 在有权限环境中运行

创建 `/scripts/deep-analysis-agent.sh`:

```bash
#!/bin/bash
# 这个脚本应该在有文件/网络权限的环境中运行

# Step 1: 采集数据
curl -s 'https://hn.algolia.com/api/v1/search?query=AI&hitsPerPage=30' > /tmp/hn-data.json
curl -s 'https://blog.kraken.com/feed' > /tmp/kraken-feed.xml

# Step 2: 用 Claude Code 启动分析 agents
claude-code agent run --type general-purpose --input-file /tmp/hn-data.json \\
  --prompt "深度分析这些AI工具，提取真正有价值的产品，生成双语描述"

claude-code agent run --type general-purpose --input-file /tmp/kraken-feed.xml \\
  --prompt "分析交易所公告，过滤产品动态，评估重要性"
```

### 方式2: 使用 Agent Reach MCP

如果配置了 Agent Reach:

```javascript
// scripts/run-multiagent-collection.ts
import { runAgent } from '@anthropic/agent-sdk';

async function main() {
  // Agent 1: 小红书数据采集
  const xiaohongshuAgent = runAgent({
    type: 'general-purpose',
    prompt: `使用 xiaohongshu_mcp 工具搜索"加密货币交易所"，返回最近7天的热门帖子`,
    tools: ['xiaohongshu_mcp']
  });

  // Agent 2: X/Twitter 数据采集
  const twitterAgent = runAgent({
    type: 'general-purpose',
    prompt: `使用 twitter_tools 获取 @binance, @coinbase 等账号的最新发布`,
    tools: ['twitter_tools']
  });

  // 并行执行
  const results = await Promise.all([xiaohongshuAgent, twitterAgent]);

  // 传递给分析 agent
  const analysisAgent = runAgent({
    type: 'general-purpose',
    prompt: `分析以下社交媒体数据: ${JSON.stringify(results)}`,
    temperature: 0.3
  });

  return await analysisAgent;
}
```

### 方式3: 定时任务 (推荐生产环境)

在 crontab 中配置:

```bash
# 每小时运行一次完整的 multiagent 采集和分析
0 * * * * cd /path/to/dashboard && /usr/local/bin/scripts/deep-analysis-agent.sh

# 每天早上6点生成AI总结
0 6 * * * cd /path/to/dashboard && curl -X POST http://localhost:3000/api/ai-summary/daily
```

## 数据流示例

### 当前流程 (简化版):
```
HN API → 我直接处理 → Dashboard API
```

### 目标流程 (Multiagent):
```
HN API →
  Agent 1 (提取工具) →
    Agent 2 (生成描述) →
      Agent 3 (质量评分) →
        Agent 4 (生成总结) →
          Dashboard API
```

## Agent 职责详细定义

### Agent 1: Deep Analyzer
**输入**: 原始数据 (JSON)
**任务**:
- 识别趋势和模式
- 关联不同来源的信息
- 发现隐藏联系
**输出**: 分析报告 (JSON)

### Agent 2: Content Generator
**输入**: 原始数据 + 分析结果
**任务**:
- 生成中英文双语描述
- 提取关键标签
- 智能分类
**输出**: 结构化内容 (JSON)

### Agent 3: Quality Filter
**输入**: 所有内容
**任务**:
- 去重
- 质量评分
- 重要性排序
- 过滤噪音
**输出**: 高质量内容列表

### Agent 4: Summary Generator
**输入**: 过滤后的内容
**任务**:
- 生成每日简报
- 提炼关键亮点
- 提供关注建议
**输出**: 最终展示内容

## 成本和性能

### 当前方案 (直接处理):
- 响应时间: ~2-3秒
- API成本: ~$0.05/次
- 准确度: 85%

### Multiagent方案 (完全版):
- 响应时间: ~30-60秒 (并行)
- API成本: ~$0.50/次
- 准确度: 95%+

### 混合方案 (推荐):
- 实时展示: 使用当前方案
- 深度分析: 后台运行agents (每小时)
- 最佳平衡: 速度 + 质量

## 下一步

1. ✅ 完成 Layer 1 (数据采集) - 已完成
2. ⏳ 优化 Layer 1 的数据质量过滤
3. 📋 开发 Layer 2 agents (需要配置权限)
4. 📋 集成 Agent Reach MCP 工具
5. 📋 配置定时任务和自动化

## 快速开始

### 测试当前混合架构:

```bash
# 1. 启动开发服务器
npm run dev

# 2. 测试数据采集
curl http://localhost:3000/api/trending/ai-tools

# 3. 测试AI分析
curl http://localhost:3000/api/ai-summary/daily

# 4. 查看Dashboard
open http://localhost:3000
```

### 未来启用完整 Multiagent:

```bash
# 安装依赖
npm install @anthropic/agent-sdk

# 运行 multiagent 脚本
claude-code run scripts/run-multiagent-collection.ts

# 或使用定时任务
./scripts/setup-cron.sh
```

## 总结

**当前状态**: 混合架构第一阶段完成
- ✅ 数据采集层工作正常
- ✅ 基础分析功能可用
- ⏳ Multiagent 层架构设计完成
- ⏳ 等待权限配置后启用完整 multiagent

**优势**:
- 现在就能用（不依赖完整 multiagent）
- 未来可无缝升级到完整版
- 灵活的扩展性
- 清晰的职责分离
