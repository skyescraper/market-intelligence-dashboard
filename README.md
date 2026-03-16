# Market Intelligence Dashboard

个人市场情报监控系统 - 专为交易所产品经理、业余投资者和自由职业者设计的三面板仪表板。

## 功能特性

### 📈 面板一：交易产品监控
- 加密货币和股票热度追踪
- Reddit 社区讨论量监控
- 实时价格变化和趋势
- AI 驱动的关注建议和风险提示

### 🤖 面板二：AI 趋势
- ProductHunt 和 HackerNews AI 工具发现
- AI 行业新闻聚合
- 创业项目追踪
- 社区情绪分析

### 🏢 面板三：行业趋势
- 监管机构公告（SEC, MAS, FCA等）
- 主流交易所动态
- 链上 TVL 数据
- 竞品分析

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
