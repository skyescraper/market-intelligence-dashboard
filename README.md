# 🚀 Market Intelligence Dashboard

个人市场情报仪表板，集成加密货币、股票、外汇、AI Agent趋势和行业动态的实时监控系统。

## ✨ 核心功能

### 📊 Trading Monitor（交易监控）
- **多资产类别**：加密货币、股票、外汇、大宗商品
- **AI投资建议**：基于5维分析（技术面、情绪、新闻、社媒、专家观点）
- **精确价格建议**：具体买入区间、止盈/止损价位
- **智能推荐**：不总是推荐第一名，真正分析性价比
- **5种排序方式**：市值、波动率、交易量、情绪、24h涨幅
- **Confidence Level**：High/Medium/Low信心等级评估

### 🤖 AI Agent 雷达
- **热门Agent追踪**：从HackerNews和Reddit抓取最新Agent工具
- **用途标注**：每个Agent都有明确的使用场景说明
- **智能分类**：Coding Agent、Research Agent、Workflow Agent等
- **实时更新**：追踪最新的自主Agent和多Agent系统
- **每日AI总结**：深度分析AI Agent趋势和关键亮点

### 🏢 Industry Trends（行业动态）
- **多源数据聚合**：Twitter KOL、交易所公告、监管动态、小红书讨论
- **智能过滤**：只显示产品公告和业务动态，过滤价格分析
- **KOL发言追踪**：CZ、Brian Armstrong、Vitalik等行业领袖
- **分类浏览**：X、小红书、币圈交易所、CFD券商、传统券商、监管机构等
- **每日AI总结**：深度分析当日关键要点（Daily Key Takeaway）
- **重要性评级**：1-3星标注公告重要程度

## 技术栈

- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS + shadcn/ui (Dark Web3 theme)
- **图标**: Lucide React
- **部署**: Vercel
- **AI**: Anthropic Claude API (Day 3)

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## Day 1 MVP 状态 ✅

- ✅ Dark Web3 风格 UI (#0D0E1A 背景, #7C3AED/# accent)
- ✅ 三栏响应式布局（桌面横排，移动端堆叠）
- ✅ 静态mock数据展示
- ✅ 时间范围切换 (1H/24H/7D)
- ✅ 手动刷新按钮
- ✅ 涨跌颜色系统（绿涨红跌 + 箭头）
- ✅ 数字等宽字体
- ✅ Vercel 部署就绪

## 下一步计划

- **Day 2**: 接入真实 API 数据源 (CoinGecko, NewsAPI, HackerNews)
- **Day 3**: Claude AI 分析集成 + Reddit API
- **Week 2**: Vercel Cron 自动刷新 + KV 缓存 + 错误处理

## 成本估算

- **MVP 阶段** (~Day 1-3): $5-15/月 (仅 Claude API)
- **完整版**: $125-145/月 (含所有数据源)

## 部署到 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 一键部署，获得生产 URL

配置环境变量（Day 2+需要）：
- `ANTHROPIC_API_KEY`
- `NEWS_API_KEY`
- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`

## License

MIT
