# Market Intelligence Dashboard — CLAUDE.md

## 项目定位
个人市场情报仪表板，服务于：交易所产品经理（行业动态）+ 业余投资者（交易热度）+ 自由职业者（AI 工具发现）

## 技术栈
- Framework: Next.js 14 App Router
- Styling: Tailwind CSS + shadcn/ui (dark theme)
- Charts: Recharts
- AI: Anthropic Claude API (@anthropic-ai/sdk)
- Cache: Vercel KV
- Deploy: Vercel free hobby tier

## 设计原则
- Dark Web3 UI: bg #0D0E1A, accent #7C3AED / #22D3EE, up #34D399, down #F87171
- 三栏布局，各栏独立滚动，手机端单栏堆叠
- 数字等宽字体，涨跌带 ▲▼ 箭头
- AI 建议必须附带免责声明

## 数据来源（全免费）
- CoinGecko /trending  |  Reddit API (praw)  |  HackerNews Algolia
- ProductHunt GraphQL  |  NewsAPI /everything  |  DefiLlama API
- RSS: SEC.gov, MAS, Binance, OKX, CoinDesk, Decrypt, FCA

## AI 使用规范
- Model: claude-sonnet-4-20250514
- Temperature: 0.3（投资分析）/ 0.5（工具描述）
- 不预测具体价格，只描述技术面区间状态
- 每条投资建议末尾附：「以上仅供参考，不构成投资建议」
- 只分析新增条目，已缓存的跳过（控制成本）

## 环境变量
```
ANTHROPIC_API_KEY=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
NEWS_API_KEY=
KV_URL=（Vercel KV 自动注入）
```
