# TrialBeacon ESLint 9 迁移与 Next.js 16 评估

日期：2026-08-17

## ESLint 9 迁移结果

TrialBeacon 已从 `next lint` 迁移到 ESLint CLI。当前安装的开发依赖为 ESLint 9、`eslint-config-next@15.5.7` 和 `@eslint/eslintrc` 兼容层。仓库新增 `eslint.config.mjs`，通过 `FlatCompat` 加载 Next.js 15.5.7 的 `next/core-web-vitals` legacy 配置，并排除 `.next`、`out`、`build` 与 `next-env.d.ts`。

`package.json` 当前脚本为：

```json
{
  "lint": "eslint .",
  "lint:fix": "eslint . --fix"
}
```

首次运行暴露 3 个警告：AppQrSection 中无效的 `react/no-danger` 禁用注释，以及 LimitModal 中两个缺失的 `closeLimit` Hook 依赖。已删除无效注释并补齐两个依赖。最终 `eslint .` 返回退出码 0，没有错误或警告。

TypeScript 检查和 Next.js 生产构建均通过。Next.js 15.5.7 的构建仍会显示 linting and checking validity of types，但实际 lint 应由独立的 ESLint CLI 脚本负责。

## 当前仓库与 Next.js 16 相关扫描

当前仓库使用 `middleware.ts`，用于语言 cookie 检测与持久化；没有发现 `legacyBehavior`、`revalidateTag` 或同步 `params`/`searchParams` 类型模式。`middleware.ts` 在 Next.js 16 中属于需要迁移或至少评估的文件，因为官方已将 `proxy.ts` 作为新的命名约定，并提供 `middleware-to-proxy` codemod。

## Next.js 16 主要破坏性变更

### Node.js 与浏览器最低版本

Next.js 16 要求 Node.js 20.9 或更高版本，Node.js 18 不再支持。当前项目只声明 `>=18.18.0`，升级前应将 Vercel 与本地环境固定到 Node.js 20.9+，推荐使用当前 LTS，并同步修改 `package.json` 的 engines。

### Turbopack 默认化

Next.js 16 中 `next dev` 和 `next build` 默认使用稳定版 Turbopack。当前项目未配置自定义 webpack，风险较低，但仍应验证 PayPal、二维码、PDF、canvas 和图片处理相关依赖。若未来发现 webpack 兼容问题，可暂时使用 `next build --webpack`，但更长期的方案是迁移配置到顶层 `turbopack`。

### Async Request APIs 完全移除同步兼容

以下 API 只能异步访问：`cookies()`、`headers()`、`draftMode()`，以及 App Router 中的 `params` 和 `searchParams`。当前静态扫描没有发现明显的同步页面参数模式，但升级前仍应运行 `next-async-request-api` codemod，并人工复核认证、语言 cookie、支付回调和动态路由。

### `middleware.ts` 到 `proxy.ts`

官方提供 `middleware-to-proxy` codemod。TrialBeacon 当前 middleware 导出名为 `middleware`，因此迁移时需要将文件重命名为 `proxy.ts`，并将导出函数重命名为 `proxy`。语言检测逻辑本身可以保持不变。

### `next lint` 与构建内置 lint 行为

`next lint` 在 Next.js 16 中已移除。TrialBeacon 已提前迁移到 `eslint .`。Next.js 16 的 `next build` 不再自动运行 lint，因此应在 CI 或部署前明确执行 `pnpm run lint && pnpm run build`。

### `next.config` 与其他配置迁移

如果未来添加 `experimental.turbopack`，Next.js 16 要求迁移到顶层 `turbopack`。如果使用 `experimental_ppr`、带 `unstable_` 前缀但已稳定的 API，或旧的 middleware 配置名，也应运行官方 codemods。当前 `next.config.mjs` 未发现这些配置。

### 图片与缓存行为

Next.js 16 还涉及 `next/image` 默认行为、缓存 API 和缓存组件相关变化。TrialBeacon 依赖首页图片、二维码、PDF 和动态 ClinicalTrials.gov 数据，因此不应把这些变化当作纯版本替换；应在 staging 中验证图片尺寸/格式、实时数据刷新、支付回调和邮件确认流程。

## 推荐升级顺序

1. 保持当前 Next.js 15.5.7 的 ESLint 迁移提交独立且可回滚。
2. 在单独分支运行 `pnpm dlx @next/codemod@canary upgrade 16`，不要直接覆盖生产分支。
3. 运行 `next-async-request-api` 与 `middleware-to-proxy` codemod，并人工复核支付、认证、语言切换和动态路由。
4. 将 Node.js 固定到 20.9+，运行 `pnpm run lint`、`tsc --noEmit`、`pnpm run build`，再做线上关键路径回归。
5. 通过 staging 部署确认 ClinicalTrials.gov 请求、PayPal、邮件确认、PDF、移动端和六种语言均正常后，再合并生产分支。

## References

[1]: https://nextjs.org/docs/app/api-reference/config/eslint "Next.js ESLint 官方文档"

[2]: https://nextjs.org/docs/app/guides/upgrading/version-16 "Next.js 16 官方升级指南"

[3]: https://nextjs.org/docs/app/guides/upgrading/codemods "Next.js 官方 Codemods 文档"

[4]: https://nextjs.org/blog/next-15-5 "Next.js 15.5 官方发布说明"
