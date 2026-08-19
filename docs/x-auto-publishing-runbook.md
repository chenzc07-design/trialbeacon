# TrialBeacon X 自动发布运行说明

## 当前设计

X OAuth 2.0 PKCE 完成后，回调路由将访问令牌和刷新令牌使用 `AUTH_SECRET` 派生的 AES-GCM 密钥加密，再写入已有 Upstash Redis。令牌不会写入 Git、日志、浏览器可读 Cookie 或聊天记录。若 Upstash 未配置，授权页面会明确提示“需要服务端存储”，不会启用自动发布。

自动发布由 `/api/cron/x-publish` 执行。该接口要求 `CRON_SECRET`，并且只有当 `X_AUTOPUBLISH_ENABLED=true` 时才会运行。默认值为关闭。每次任务最多发布一条，发布间隔至少 72 小时；任务使用 Redis 锁防止并发重复发布，发布失败会把内容放回队列。队列为空时只加载经过人工审核的默认信息型文案。

## 必需配置

| 变量 | 用途 | 安全要求 |
|---|---|---|
| `AUTH_SECRET` | 加密令牌及网站会话 | 长随机值，仅 Production |
| `X_CLIENT_ID` | OAuth 2.0 Public client 标识 | 可配置在 Production，不发送 Secret |
| `UPSTASH_REDIS_REST_URL` | 服务端持久化地址 | 仅 Production |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash 访问凭据 | 仅 Production，绝不提交仓库 |
| `CRON_SECRET` | 保护定时发布接口 | 长随机值，仅 Production |
| `X_AUTOPUBLISH_ENABLED` | 总开关 | 初始必须为 `false` |

## 启用前检查

必须先确认旧的、曾在聊天中出现的 Client Secret 已经轮换；新 Secret 不需要发送给助手。随后在同一个常用浏览器和韩国节点重新打开网站 OAuth 入口，使回调把令牌写入服务端 Upstash，而不是只写入浏览器 Cookie。确认回调页面显示授权成功后，先保持 `X_AUTOPUBLISH_ENABLED=false`，由管理员使用受保护接口执行一次单条测试发布。

测试发布内容必须是已审核的单条信息型内容，包含唯一入口 `https://trialbeacon.cn`，不作诊断、治疗、疗效、治愈或个体化入组判断。测试成功后才可将开关改为 `true`，并在每次内容调整后重新暂停、审阅和启用。

## 停止条件

任何 X API 401/403、令牌刷新失败、重复发布、内容违规提示、用户投诉或数据来源错误都应立即将 `X_AUTOPUBLISH_ENABLED` 改为 `false`。不通过增加频率、切换节点、批量关注、批量评论或重复授权来解决平台限制。
