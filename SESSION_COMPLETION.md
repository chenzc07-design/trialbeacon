# TrialBeacon — 收尾任务完成报告

本次会话完成了此前遗留的四项收尾任务，并对预览站点做了完整回归验证。

## 已完成的任务

### 1. 修复退订死链并补齐周报闭环（Task #6）
- 新增 `app/unsubscribe/page.tsx` 与 `components/UnsubscribeForm.tsx`：一键退订，无确认步骤，立即移除。
- 新增 `app/api/cron/digest/route.ts`：每周摘要任务，支持 `CRON_SECRET` 鉴权与 `dryRun` 模式，按订阅癌种+地区聚合变更、渲染并发送。
- 新增 `lib/mailer.ts`：Resend / Postmark 适配器，未配置时自动降级为 dry-run。
- 扩展 `lib/subscriptions.ts`：`Subscription` 增加 `token` 字段；`SubscriptionStore` 增加 `findByToken / confirm / list`；`upsert` 签名收窄为 `Omit<Subscription,'id'|'createdAt'|'confirmed'|'token'>`（与现有调用兼容）。
- 端到端验证：订阅 → 写入 `.data/subscriptions.json`（含 token）→ 退订（幂等，二次退订返回 `removed:false`）→ 非法邮箱返回 400，全部通过。

### 2. 补齐 SEO 基础设施（Task #7）
- `app/sitemap.ts`：自动生成 `sitemap.xml`，覆盖首页、10 个癌种索引页、各癌种详情页及工具/关于页，含 `changefreq` 与 `priority`。
- `app/robots.ts`：允许全站爬取，仅屏蔽 `/api/` 与 `/unsubscribe`，并声明 sitemap 位置。
- JSON-LD：`app/layout.tsx` 注入站点级 `WebSite + Organization` 图谱；`app/cancers/[slug]/page.tsx` 注入各癌种 `CollectionPage`。
- `lib/seo.ts`：统一 `SITE_URL`（可由 `SITE_URL` 环境变量覆盖，默认 `https://trialbeacon.example.com`）与结构化数据构造器。

### 3. Change Tracker 已关闭状态数据（Task #8，前次已完成）
- `lib/data/trials.ts` 补充 10 条真实关闭状态记录（Terminated / Withdrawn / Completed / Suspended），使「已关闭」分组不再为空。

### 4. 清理调试依赖并终验（Task #9）
- 已从 `package.json` 移除 `playwright` 调试依赖并同步 lockfile。
- 尝试将 `next` 升级至已修复 CVE-2025-66478 的补丁版本，但沙箱离线无法下载新版本，故保留 `next@15.1.6`，并在 README 注明升级步骤（低风险，代码未依赖版本相关 API）。
- 重新构建（`pnpm build` 通过，26 个页面全部生成）。
- 重启预览服务以加载新构建；supervisord 自动拉起 `next-server`。
- 完整回归：14 条路由全部返回 `200`；`/sitemap.xml`、`/robots.txt`、`/unsubscribe` 经 8000 预览端口验证正常；订阅/退订闭环验证通过；重新核查中性用语（grep 仅命中「政策说明」与「官方来源标题原文」，无推广性措辞）。

## 预览地址
- 8000 端口转发（对外预览）：`http://127.0.0.1:8000/`（对应原始对外 URL 的 8000 端口）
- 本地直接访问：`http://localhost:3000/`

## 备注
- `next@15.1.6` 存在安全公告（CVE-2025-66478）。部署前请联网执行 `pnpm add next@latest` 升级至已修复版本。
- `.data/` 已在 `.gitignore` 中，订阅数据不会被提交。
