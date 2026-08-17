# TrialBeacon 依赖维护与技能实测报告

日期：2026-08-17

## 定时 pnpm audit 工作流

已新增 `.github/workflows/dependency-audit.yml`。工作流每周一 03:17 UTC 自动执行，也支持 `workflow_dispatch` 手动执行。它使用 Node.js 20、pnpm 10 和冻结锁文件安装，运行：

```bash
pnpm audit --audit-level=high --json > pnpm-audit.json
```

如果审计失败，将 `pnpm-audit.json` 上传为保留 14 天的 GitHub Actions artifact；工作流不会自动升级依赖。

工作流已通过手动触发验证：

- Run: https://github.com/chenzc07-design/trialbeacon/actions/runs/32036008728
- Commit: `c9b871a8ba83008c99ecd3ee424449357cdd179e`
- Result: `success`
- `Run pnpm audit`: passed

GitHub Actions 对 action 使用 Node.js 20 发出未来 runner 强制使用 Node.js 24 的提示，但本次工作流成功完成；这属于 Actions 运行时迁移提示，不是项目依赖漏洞。

## 非 Next.js 直接依赖审计

查询时间为 2026-08-17。以下依赖当前已经处于 npm 最新版本，不需要升级：

| 依赖 | 当前声明 | npm 最新 | 结论 |
|---|---:|---:|---|
| `@paypal/react-paypal-js` | `^10.3.0` | `10.3.0` | 已是最新 |
| `html2canvas` | `^1.4.1` | `1.4.1` | 已是最新 |
| `jspdf` | `^4.2.1` | `4.2.1` | 已是最新 |
| `qrcode` | `^1.5.4` | `1.5.4` | 已是最新 |
| `@types/qrcode` | `^1.5.6` | `1.5.6` | 已是最新 |

以下依赖存在更新，但不建议在本次安全维护中无差别升级：

| 依赖 | 当前 | 最新 | 级别与建议 |
|---|---:|---:|---|
| `react` | 19.2.1 | 19.2.8 | 同一 minor 的 patch 更新，建议在 staging 回归后升级 |
| `react-dom` | 19.2.1 | 19.2.8 | 与 React 成对升级 |
| `@types/react` | 19.0.7 | 19.2.18 | 类型包 minor 更新，配合 React 回归 |
| `@types/react-dom` | 19.0.3 | 19.2.4 | 类型包 minor 更新，配合 React 回归 |
| `autoprefixer` | 10.4.20 | 10.5.4 | minor 更新，先检查 PostCSS/Tailwind 兼容性 |
| `@types/node` | 22.10.7 | 26.2.0 | 跨 Node 主版本，先不要直接升级；应与 Vercel Node 运行时版本一起评估 |
| `eslint` | 9.39.5 | 10.8.1 | major 更新，当前 ESLint 9 已稳定通过，暂不升级 |
| `tailwindcss` | 3.4.17 | 4.3.3 | major 更新，需单独处理配置、PostCSS 和视觉回归 |
| `typescript` | 5.7.3 | 7.0.2 | major 更新，需与 Next、React 类型和构建链单独验证 |

`pnpm outdated` 没有列出 `@paypal/react-paypal-js`、`html2canvas`、`jspdf`、`qrcode` 或 `@types/qrcode` 的更新，另用 `pnpm view <package> version` 复核后确认它们已是当前 npm 最新版本。

## 维护技能实测

技能目录：`/home/ubuntu/skills/trialbeacon-next-maintenance/`。技能验证器结果为 `Skill is valid!`。

另外创建了隔离项目 `/tmp/trialbeacon-next-maintenance-fixture`，使用 Next.js 15.5.23、ESLint 9、TypeScript、App Router 和 Tailwind。第一次安装暴露 pnpm 新版本对未明确声明构建脚本的保护行为；按技能流程将 `allowBuilds` 和安全 overrides 写入夹具的 `pnpm-workspace.yaml`，更新锁文件后重新测试。

最终隔离项目结果如下：

| 检查 | 结果 |
|---|---|
| `pnpm install --frozen-lockfile` | 通过 |
| `pnpm run lint` | 通过 |
| `pnpm exec tsc --noEmit` | 通过 |
| `pnpm run build` | 通过，Next.js 15.5.23 Turbopack 生成 5 个静态页面 |
| `pnpm audit --audit-level=high --json` | 通过 |

该实测证明技能中的通用 ESLint、依赖审计、冻结安装和构建验证步骤可以迁移到类似的 Next.js 项目，而不依赖 TrialBeacon 的生产凭据或数据。

## References

[1]: https://www.npmjs.com/package/next "Next.js npm package"

[2]: https://www.npmjs.com/package/react "React npm package"

[3]: https://www.npmjs.com/package/tailwindcss "Tailwind CSS npm package"

[4]: https://pnpm.io/cli/audit "pnpm audit 官方文档"
