# TrialBeacon — 关键状态速记(精简版)

> 用途:替代冗长聊天记录。只保留账号标识、工作模式、进度、命令。
> **所有 secret 明文都在 `.env.local`(本地,已 gitignore)和 Vercel 生产环境变量,本文件不重复,防止误提交。**

## 1. 基础设施 / 账号(非敏感标识)

| 项 | 值 |
| --- | --- |
| 代码仓库 | `git@github.com:chenzc07-design/trialbeacon.git`(ssh-origin/origin),分支 `master`,push 即触发 Vercel |
| 项目目录 | `/workspace/trialbeacon`(Next.js 15 / React 19 / TS / Tailwind,`pnpm` 构建) |
| 生产域名 | `https://trialbeacon.cn` |
| 沙箱预览域名 | `https://af73f65d0b7b099a8.gz1.agentos-app.net` |
| Vercel 项目 | `trialbeacon`,scope `team_NYli4yiaxhDOVzcu5jQDSzaG`,账号 `chenzc07-2994` |
| 站点负责人邮箱 | `chouchou202601@outlook.com` |

## 2. OAuth 凭证位置(只列 client ID / 租户 ID,secret 见 .env.local + Vercel)

| 提供方 | client ID / 租户 ID | secret 位置 |
| --- | --- | --- |
| Google | `671487616075-0ooblo9ft4n89dr98unimcvnajlf0csq.apps.googleusercontent.com` | `.env.local` (GOOGLE_CLIENT_SECRET) + Vercel |
| Microsoft | client ID `377b1f93-a9b4-499f-9858-2360deb9f6f4`;租户 `d75f7856-04ea-4d36-ba8e-08e744d6c4df`(chouchou202601outlook.onmicrosoft.com) | `.env.local` (MICROSOFT_CLIENT_*) + Vercel |
| AUTH_SECRET | 生产用**强随机值**(Vercel 设置,本地 `.env.local` 的 `demo-...` 仅供本地,**禁止用于生产**) | Vercel(生产) / `.env.local`(本地 demo) |

> 曾用 Vercel token(`vcp_0lvx...`,用户临时提供):用完可到 vercel.com/account/tokens 吊销。

## 3. 我们的工作模式(必须遵守)

- **OAuth 统一走"标准授权码流程,服务端换 token"**:`/api/auth/<p>?next=` → 307 跳 provider 授权页 → provider 回跳 `/api/auth/<p>/callback?code=` → 服务端用 `client_secret` 换 token 并验证 → 发 session cookie。
- `redirect_uri` 由 `publicOrigin(req)` 从请求域名**运行时推导**,不写死,所以生产/沙箱/预览都自动匹配。
- 注册重定向 URI 必须**精确一致**(含 `https://`、`/api/auth/<p>/callback`)。
- **沙箱改完 `.env.local` 后必须重启 `next-server`**(supervisord 自动重生);构建在 `/workspace/trialbeacon` 下 `pnpm build`。
- 验证套路:端点返回 307 即正常;用假 code 走 `/callback`——
  - 返回 `token_exchange_failed`(或 `invalid_grant`)→ URI 已正确登记 ✅
  - 返回 `redirect_uri_mismatch` → URI 没登记 ❌

## 4. Vercel 生产环境变量操作命令(复用)

```bash
TOKEN="<vercel token>"   # 用户临时提供,用完吊销
PROJ=trialbeacon; SCOPE=team_NYli4yiaxhDOVzcu5jQDSzaG
# 加变量(值用 stdin 喂,避免交互)
printf '%s' "$VAL" | vercel env add <NAME> production --token "$TOKEN" --project "$PROJ" --scope "$SCOPE"
# 重新部署(必须 --cwd 指向项目,否则报 "No Next.js version")
vercel deploy --prod --yes --token "$TOKEN" --project "$PROJ" --scope "$SCOPE" --cwd /workspace/trialbeacon
```

## 5. 当前进度

- ✅ **Google**:代码 + 生产 + 沙箱全部跑通(`/api/auth/google` 307 跳 Google)。
- ✅ **Microsoft**:Vercel 变量已加 + 重新部署 + 沙箱 `.env.local` 已写并重启;服务端验证通过(`token_exchange_failed` 证明 URI 匹配)。**待用户用真实微软账号端到端实测一次。**
- 🔲 Google Cloud Console 生产重定向 URI `https://trialbeacon.cn/api/auth/google/callback` 需用户确认已加入(沙箱预览地址已加)。
- 🗑️ **Apple**:已按老板要求移除登录按钮、路由、i18n、Provider 类型(太贵,等以后再加)。

## 6. 已踩坑(别再踩)

- Google Web 应用 OAuth **即便用 PKCE 也强制要 client_secret** → 不能浏览器端换 token,老老实实用服务端授权码流程。
- `vercel deploy` 必须从 `/workspace/trialbeacon` 运行(或 `--cwd`),否则 cwd=/workspace 报 "No Next.js version"。
- 沙箱服务读 `.env.local`,改完不重启不生效。
- M365 开发者计划对个人 Outlook 账号常判"不符合资格",免费 Azure 账号才是拿到 Entra 租户的正路(需绑卡验证但不扣费)。
