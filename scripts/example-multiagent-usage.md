# Multiagent 使用示例

## 当前已验证的工作流程

我们已经成功测试了 multiagent 系统的启动和协调，现在展示实际使用方式。

## 实际运行示例

### 示例 1: 并行数据分析

```bash
# 同时启动3个分析agents
claude-code << 'EOF'
请并行启动3个agents:

1. AI工具分析agent - 分析HackerNews和Reddit的AI工具数据
2. 交易所公告agent - 过滤Kraken等交易所的产品公告
3. 监管动态agent - 提取FCA/MAS的重要监管更新

所有agents后台运行，完成后汇总结果。
EOF
```

### 示例 2: 使用 Agent Reach 抓取小红书

```bash
# 启动小红书数据采集agent
claude-code agent run \
  --type general-purpose \
  --description "收集小红书加密货币讨论" \
  --prompt "使用 xiaohongshu_mcp 工具搜索关键词'加密货币'、'比特币'、'数字货币'，返回最近7天的热门帖子和评论" \
  --background
```

### 示例 3: 深度分析工作流

```javascript
// scripts/deep-analysis-workflow.js

async function runDeepAnalysis() {
  // Step 1: 数据采集 (主系统完成)
  const rawData = await fetchAllData();

  // Step 2: 启动分析agents (并行)
  const agents = await Promise.all([
    launchAgent('content-analyzer', rawData.aiTools),
    launchAgent('trend-detector', rawData.social),
    launchAgent('sentiment-analyzer', rawData.announcements),
  ]);

  // Step 3: 等待所有agents完成
  const results = await Promise.all(agents.map(a => a.waitForCompletion()));

  // Step 4: 综合分析
  const finalReport = await launchAgent('report-generator', {
    analysisResults: results,
    context: 'daily-briefing'
  });

  // Step 5: 保存到数据库
  await saveToDatabase(finalReport);

  return finalReport;
}

// 运行
runDeepAnalysis().then(report => {
  console.log('Deep analysis complete:', report);
});
```

## Agent 配置模板

### AI 工具分析 Agent

```yaml
# config/agents/ai-tools-analyzer.yaml
name: ai-tools-analyzer
type: general-purpose
description: 分析和分类AI工具
permissions:
  - read_files
  - call_claude_api
input:
  format: json
  schema:
    tools: array
    sources: array
output:
  format: json
  schema:
    analyzed_tools: array
    categories: object
    insights: array
prompt_template: |
  分析以下AI工具数据：
  {{input.tools}}

  任务：
  1. 识别真正的产品/工具（排除讨论）
  2. 生成中英文描述
  3. 智能分类
  4. 评估实用性和创新性

  返回JSON格式结果。
```

### 交易所公告过滤 Agent

```yaml
# config/agents/exchange-announcements-filter.yaml
name: exchange-announcements-filter
type: general-purpose
description: 过滤和分类交易所产品公告
permissions:
  - read_files
input:
  format: xml
  source: rss_feeds
output:
  format: json
  schema:
    announcements: array
    byType: object
    byImportance: object
prompt_template: |
  分析以下交易所RSS数据：
  {{input.rss_content}}

  过滤条件：
  - 保留：listing, launch, feature, perpetual, futures
  - 排除：price analysis, market outlook

  为每条公告评分（1-3）并分类。
```

## 定时任务配置

### crontab 设置

```bash
# 编辑 crontab
crontab -e

# 添加以下任务

# 每小时运行数据采集和分析
0 * * * * cd /path/to/dashboard && /usr/local/bin/node scripts/multiagent-collector.js >> /var/log/market-intel.log 2>&1

# 每天早上6点生成AI总结
0 6 * * * cd /path/to/dashboard && curl -X POST http://localhost:3000/api/ai-summary/daily

# 每4小时刷新小红书数据
0 */4 * * * cd /path/to/dashboard && /usr/local/bin/scripts/xiaohongshu-collector.sh
```

### SystemD Service (推荐)

```ini
# /etc/systemd/system/market-intelligence-agent.service
[Unit]
Description=Market Intelligence Multiagent Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/dashboard
ExecStart=/usr/local/bin/node /path/to/dashboard/scripts/agent-daemon.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl enable market-intelligence-agent
sudo systemctl start market-intelligence-agent
sudo systemctl status market-intelligence-agent
```

## 监控和调试

### 查看 Agent 状态

```bash
# 列出所有运行中的agents
ps aux | grep "claude-code agent"

# 查看agent输出
tail -f /tmp/agent-*.output

# 监控agent性能
watch -n 5 'curl -s http://localhost:3000/api/agents/status | jq .'
```

### Agent 日志分析

```bash
# 查看最近的agent活动
cat ~/.claude/agent-logs/*.log | grep "completed\|failed" | tail -20

# 分析agent性能
cat ~/.claude/agent-logs/*.log | grep "duration" | \
  awk '{sum+=$NF; count++} END {print "平均耗时:", sum/count, "ms"}'
```

## 最佳实践

### 1. Agent 命名规范
```
[domain]-[function]-agent
例如: social-collector-agent, ai-analyzer-agent
```

### 2. 错误处理
```javascript
async function robustAgentCall(agentConfig) {
  let retries = 3;
  while (retries > 0) {
    try {
      const result = await launchAgent(agentConfig);
      return result;
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await sleep(5000); // 等待5秒后重试
    }
  }
}
```

### 3. 成本控制
```javascript
const AGENT_LIMITS = {
  maxParallel: 5,      // 最多5个并行agents
  maxDuration: 120000, // 单个agent最多2分钟
  dailyBudget: 50,     // 每天最多$50
};

function shouldLaunchAgent(type) {
  const today = getDailyCost();
  if (today > AGENT_LIMITS.dailyBudget) {
    console.log('Daily budget exceeded, using cache');
    return false;
  }
  return true;
}
```

## 下一步行动

### 立即可做：
1. ✅ 测试现有Dashboard功能
2. ✅ 查看 `/docs/hybrid-multiagent-architecture.md`
3. 📝 配置需要的 MCP 工具权限

### 需要权限后：
1. 启用完整 multiagent 系统
2. 配置 Agent Reach 小红书采集
3. 设置定时任务自动运行

### 长期优化：
1. 添加更多数据源
2. 优化agent提示词
3. 实现agent学习和改进机制
