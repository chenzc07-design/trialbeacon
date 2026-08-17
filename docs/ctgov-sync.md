# ClinicalTrials.gov API v2 同步

TrialBeacon 使用 `scripts/sync_ctgov_snapshot.py` 从 ClinicalTrials.gov API v2 拉取癌症临床试验，并将结果保存为本地 JSON 快照和校验报告。ClinicalTrials.gov 官方说明数据通常在周一至周五刷新，使用 API 前应检查 `/api/v2/version` 返回的 `dataTimestamp`，确认当天数据刷新已经完成。[1]

## 推荐运行方式

```bash
pnpm run sync:ctgov
```

仓库默认命令采用有界同步：每个癌种按 `LastUpdatePostDate` 倒序获取前 100 条记录。这样与 TrialBeacon 当前页面的有界实时索引一致，也避免对公共 API 发起过重的全量请求。

如需更大范围同步，可以直接运行：

```bash
python3 scripts/sync_ctgov_snapshot.py \
  --output-dir data/snapshots \
  --page-size 1000 \
  --max-pages 5 \
  --timeout 20 \
  --retries 1
```

`--max-pages 0` 表示不设分页上限，但不建议在日常任务中使用；公共 API 的大条件查询可能耗时较长。脚本使用每个癌种最多 3 个并发查询，单个癌种失败不会丢弃其他癌种结果，但最终会在报告中记录失败并以非零退出码结束。

## 输出文件

运行后会生成：

| 文件 | 用途 |
|---|---|
| `data/snapshots/ctgov-latest.json` | 最新快照，包含元数据、查询条件、汇总统计和 `records`。 |
| `data/snapshots/ctgov-YYYYMMDDTHHMMSSZ.json` | 带时间戳的不可变快照。 |
| `data/snapshots/ctgov-latest.report.json` | 状态统计、癌种统计、API `dataTimestamp`、失败范围和校验错误。 |

这些每日生成文件默认被 `.gitignore` 忽略；脚本和运行说明会进入版本控制。若需要让网站直接使用生成的 TypeScript 快照，可显式传入：

```bash
python3 scripts/sync_ctgov_snapshot.py \
  --typescript-output lib/data/fresh-trials.generated.ts
```

生成的模块使用 TrialBeacon 的 `UpdateItem[]` 形状，但替换生产快照前仍应运行类型检查、构建和页面回归。

## 校验内容

脚本检查 NCT 编号格式、记录去重、标题和 URL、来源/类型、允许的招募状态、ISO 日期格式、未来日期、癌种标签以及 URL 与 NCT 编号的一致性。默认状态范围为 `RECRUITING`、`NOT_YET_RECRUITING`、`ENROLLING_BY_INVITATION` 和 `ACTIVE_NOT_RECRUITING`；如需审计闭合状态，可以使用 `--include-closed`。

## 本次运行结果

2026-08-17 UTC 运行了有界同步：11 个癌种各获取 100 条排序记录，合并去重后得到 832 条唯一记录，状态校验错误为 0，失败范围为 0。API 返回的数据时间戳为 `2026-08-17T09:00:05`。完整无分页上限的拉取被刻意避免，因为公共 API 的大页请求长时间没有进度；这不影响脚本的全量能力，但日常自动化应使用有界参数。

## References

[1]: https://clinicaltrials.gov/data-api/api "ClinicalTrials.gov API 官方文档"

[2]: https://clinicaltrials.gov/data-api/about-api/api-migration "ClinicalTrials.gov API Migration Guide"
