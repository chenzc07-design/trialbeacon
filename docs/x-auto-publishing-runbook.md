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

## Production configuration check (2026-08-19)

The Vercel Production environment visibly contains `X_CLIENT_ID`, `AUTH_SECRET`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN`. A search for `CRON_SECRET` returned no result. The auto-publish endpoint therefore remains correctly protected and cannot run until the owner adds a new server-only `CRON_SECRET`; no value was read or changed during this check. `X_AUTOPUBLISH_ENABLED` also remains absent/default-off until explicitly added.

## Production configuration update (2026-08-19)

A newly generated random `CRON_SECRET` was added to Vercel Production only. Its value was not printed in user-facing messages, committed, or stored in the repository. Vercel reports that a new deployment is required before the value becomes active. `X_AUTOPUBLISH_ENABLED` remains unset and therefore false by default; no X post can be triggered by the scheduler at this stage.

## Deployment after CRON_SECRET (2026-08-19)

Vercel Production redeploy was initiated from the current `a345a32` source with the newly added `CRON_SECRET`. The X auto-publish switch remains unset/default-off. No X authorization or publication was triggered during this configuration step.

## Controlled test credential rotation (2026-08-19)

For the explicitly confirmed single-post test, the Production-only `CRON_SECRET` was rotated to a newly generated random value and a redeploy was initiated. The value was never committed or shown in a final message. Long-term X auto-publishing remains disabled.

The explicitly confirmed single-test switch `X_AUTOPUBLISH_ENABLED=true` was added only to Production. It must be reverted to `false` immediately after the one-post verification; it is not a long-term operating setting.

## Cron diagnostics hardening (2026-08-19)

The protected endpoint now accepts `?dryRun=1` only after normal `CRON_SECRET` authorization. This check does not dequeue content or create an X post. It verifies only non-sensitive health signals: Redis reachability, encrypted token readability, whether a refresh token exists or is due, and a read-only X authorization check. It returns stable error codes and emits no token, secret, queue text, or X account data to logs.

The user-directed Production switch is currently set to `X_AUTOPUBLISH_ENABLED=true`, but the actual publishing path has not yet passed acceptance: the earlier protected request returned HTTP 502. The switch must not be treated as confirmation that an X post can be created. First use the protected dry-run to identify the failing dependency, then carry out at most one explicitly confirmed post test after the result is healthy.
