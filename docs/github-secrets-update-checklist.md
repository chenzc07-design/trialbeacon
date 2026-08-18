# TrialBeacon GitHub Secrets 更新与排查指南

**适用工作流：** `.github/workflows/weekly-ctgov-frontier.yml`
**目标：** 让 Weekly Sync 能安全生成 GitHub App installation token，并只向 TrialBeacon 写入允许的数据文件。

## 一、先了解当前失败原因

最近一次手动运行 `32155199058` 失败在 `Create GitHub App installation token` 步骤。日志显示：

```text
The 'client-id' input must be set to a non-empty string
```

这意味着工作流没有读取到有效的 Client ID。失败发生在 checkout、ClinicalTrials.gov 同步和 Git push 之前，因此本次没有产生错误数据提交。

当前工作流使用以下 Secret 名称：

```text
TRIALBEACON_APP_ID
TRIALBEACON_APP_PRIVATE_KEY
```

其中第一个名称历史上叫 `APP_ID`，但现在实际应保存 GitHub App 的 **Client ID**，不是数字形式的 App ID。为了减少混淆，后续可以改成 `TRIALBEACON_APP_CLIENT_ID`，但改名必须同步修改工作流。

## 二、准备 GitHub App 身份信息

打开 GitHub 的个人设置或对应组织设置：

```text
Settings → Developer settings → GitHub Apps
```

打开用于 TrialBeacon 的 App，记录以下信息：

| 项目 | 正确要求 |
|---|---|
| Client ID | 通常类似 `Iv1.xxxxx`，用于工作流的 `client-id` 输入 |
| App ID | 通常是数字，仅用于识别 App；不要误填到 `client-id` |
| Private key | 在 App 设置页面生成的新 PEM 私钥 |
| App 安装状态 | 必须已经安装到 `chenzc07-design` 账户 |
| 仓库范围 | Installation 中只选择 `trialbeacon` |

不要把 Client ID、App ID 或私钥发送到聊天、Issue、Pull Request、截图或公开文档中。

## 三、检查 GitHub App 权限

在 App 设置的 **Permissions & events** 中检查 Repository permissions：

| 权限 | 推荐值 | 用途 |
|---|---|---|
| Contents | Read and write | 读取仓库并推送两个前沿数据 JSON 文件 |
| Metadata | Read-only | GitHub 仓库基础访问所需的元数据权限 |
| Issues | None | Weekly Sync 不需要 |
| Pull requests | None | 当前直接推送模式不需要 |
| Actions | None | 不需要修改工作流 |
| Administration | None | 不需要管理仓库 |
| Secrets | None | 不需要读取或修改其他 Secrets |
| Members | None | 不需要读取组织成员 |

保存权限变更后，进入 App 的 **Install App** 页面，确认安装范围仍然包含 `chenzc07-design/trialbeacon`。如果修改了权限，GitHub 可能要求重新确认安装权限；必须完成确认后新权限才会生效。[1] [2]

## 四、生成或重新生成 Private Key

在 GitHub App 设置页面选择生成 Private key。下载得到的文件通常是 `.又` 或 `.pem` 文件。打开后应看到完整结构：

```text
<PEM_PRIVATE_KEY_BEGIN>
<PRIVATE_KEY_CONTENT_WITH_LINE_BREAKS>
<PEM_PRIVATE_KEY_END>
```

有些 App 使用另一种 PEM 标记，也应保留文件中完整的 `BEGIN` 和 `END` 行。不要手动删除换行，不要复制文件名代替文件内容，也不要把私钥保存进仓库。

如果怀疑旧私钥泄露，先生成新私钥，再更新 GitHub Secret，最后在 App 页面撤销旧私钥。更新成功前不要撤销唯一可用的旧私钥。

## 五、更新 Repository Secrets

打开 TrialBeacon 仓库：

```text
https://github.com/chenzc07-design/trialbeacon
```

依次进入：

```text
Settings → Secrets and variables → Actions → Repository secrets
```

检查是否存在以下两个 Secret：

| Secret 名称 | Secret 值 |
|---|---|
| `TRIALBEACON_APP_ID` | GitHub App Client ID，例如 `Iv1.xxxxx` |
| `TRIALBEACON_APP_PRIVATE_KEY` | 完整 PEM 私钥内容，包括 BEGIN/END 行 |

如果 Secret 已存在，点击对应 Secret 的更新入口重新保存；GitHub 不会显示旧值，只能覆盖更新。保存后不要把值复制回聊天窗口。

请确认这两个 Secret 是 **Repository secrets**，而不是：

```text
Dependabot secrets
Environment secrets
个人电脑环境变量
GitHub App 自己的配置字段
```

当前 job 没有声明 `environment:`。如果你把 Secret 保存为 Environment secret，工作流将无法读取它，除非同时为 job 配置对应的 Environment。最简单、安全的方案是把这两个值放在 Repository secrets。

## 六、推荐的命名清理方案

为了避免 `APP_ID` 与 `Client ID` 混淆，可以使用更清晰的名称：

```text
TRIALBEACON_APP_CLIENT_ID
TRIALBEACON_APP_PRIVATE_KEY
```

然后把工作流中的配置改为：

```yaml
with:
  client-id: ${{ secrets.TRIALBEACON_APP_CLIENT_ID }}
  private-key: ${{ secrets.TRIALBEACON_APP_PRIVATE_KEY }}
  owner: chenzc07-design
  repositories: trialbeacon
  permission-contents: write
```

如果暂时不想修改工作流，只需确保现有的 `TRIALBEACON_APP_ID` Secret 中保存的是 Client ID，而不是数字 App ID。

## 七、电脑端提交前核对工作流

打开工作流文件，确认关键片段类似下面内容：

```yaml
permissions:
  contents: read

jobs:
  sync-and-publish:
    permissions:
      contents: write
    steps:
      - name: Create GitHub App installation token
        id: app-token
        uses: actions/create-github-app-token@<FULL_COMMIT_SHA> # v3.2.0
        with:
          client-id: ${{ secrets.TRIALBEACON_APP_ID }}
          private-key: ${{ secrets.TRIALBEACON_APP_PRIVATE_KEY }}
          owner: chenzc07-design
          repositories: trialbeacon
          permission-contents: write

      - name: Check out repository
        uses: actions/checkout@<FULL_COMMIT_SHA>
        with:
          fetch-depth: 0
          token: ${{ steps.app-token.outputs.token }}
          persist-credentials: true
```

检查以下项目：

| 检查项 | 要求 |
|---|---|
| Action 引用 | 使用完整 40 位 commit SHA，不使用可变 `@v3` 或 `@main` |
| 输入名称 | 使用 `client-id`，不要继续使用旧的 `app-id` |
| 私钥输入 | 使用 `private-key`，值来自 Secret |
| owner | `chenzc07-design` |
| repositories | `trialbeacon` |
| token 权限 | `permission-contents: write` |
| checkout token | 使用 `steps.app-token.outputs.token` |
| 默认权限 | 工作流默认保持 `contents: read` |
| push 路径 | 只允许 `lib/data/frontier-trials.json` 和 `lib/data/frontier-phase-matrix.json` |

## 八、手动验证流程

Secret 更新完成后，在仓库的 **Actions** 页面打开：

```text
Weekly ClinicalTrials Frontier Sync → Run workflow
```

选择：

```text
Branch: master
Skip PNG chart generation: true
```

第一次验证选择 `skip_charts=true` 可以减少运行时间，但仍会执行 App token、checkout、同步、差异检查和 push 相关步骤。

验证顺序如下：

1. `Create GitHub App installation token` 为绿色成功。
2. `Check out repository` 为绿色成功。
3. `Set up pnpm`、Node.js 和 Python 成功。
4. `Sync ClinicalTrials.gov snapshot` 成功。
5. `Rebuild frontend frontier assets` 成功。
6. `Check generated diff` 成功，且没有 Unexpected tracked changes。
7. 如果 JSON 有变化，`Commit updated frontend assets` 成功。
8. 工作流整体结论为 `success`。

成功运行后，查看仓库最新提交，确认提交作者是同步机器人，并且只修改允许的两个 JSON 文件。不要只看到 token 步骤成功就认为写入验证完成；必须同时确认最后的 push 步骤成功。

## 九、失败信息对照表

| 日志信息 | 可能原因 | 处理方式 |
|---|---|---|
| `client-id ... non-empty string` | Secret 缺失、名称错误、作用域错误或值为空 | 检查 Repository secrets 和准确名称 |
| `private-key ... non-empty string` | 私钥 Secret 缺失或名称错误 | 重新保存完整 PEM 私钥 |
| `Invalid private key` | 私钥格式损坏、换行丢失或与 App 不匹配 | 从 App 页面重新生成并粘贴 |
| `Integration not found` | App 没有安装到目标账户或仓库 | 重新安装到 `trialbeacon` |
| `Resource not accessible by integration` | App 没有 Contents write 或安装权限未更新 | 检查 App 权限并重新确认安装 |
| `Repository not found` | owner/repositories 参数错误 | 核对 `chenzc07-design` 和 `trialbeacon` |
| `protected branch hook declined` | master 分支保护阻止 App push | 改为专用分支 + Pull Request，或调整分支规则 |
| `Unexpected tracked changes detected` | 同步过程修改了白名单外文件 | 检查生成逻辑，不要扩大白名单来掩盖问题 |
| `git push` 无变化 | 这次同步没有生成新的前沿 JSON 差异 | 属于正常情况，查看 diff 步骤输出 |

## 十、轮换和撤销流程

建议每次轮换都按照以下顺序执行：

1. 在 GitHub App 设置中生成新 Private Key。
2. 在 Repository secrets 中更新 `TRIALBEACON_APP_PRIVATE_KEY`。
3. 如果 Client ID 发生变化，同时更新 Client ID Secret。
4. 手动运行一次 Weekly Sync。
5. 确认 token、checkout、同步和 push 全部成功。
6. 在 App 设置中撤销旧 Private Key。
7. 记录轮换日期，但不要记录私钥内容。

如果怀疑私钥泄露，应立即撤销旧私钥，并检查 GitHub Audit Log、Actions 日志、提交历史、artifact 和聊天记录中是否出现过敏感内容。[3]

## 十一、最终打勾清单

电脑操作完成后，以下项目应全部满足：

- [ ] 使用的是 GitHub App Client ID，不是数字 App ID。
- [ ] Client ID Secret 位于 Repository secrets。
- [ ] Private key Secret 位于 Repository secrets。
- [ ] 私钥包含完整 BEGIN/END 行和换行。
- [ ] App 已安装到 `chenzc07-design/trialbeacon`。
- [ ] App 的 Contents 权限是 Read and write。
- [ ] 工作流使用 `client-id`，不是 `app-id`。
- [ ] `owner` 和 `repositories` 拼写完全正确。
- [ ] 所有 Action 仍固定为完整 commit SHA。
- [ ] 手动运行的 token 步骤成功。
- [ ] checkout 步骤成功。
- [ ] 同步和差异检查成功。
- [ ] push 步骤成功，或明确显示没有文件变化。
- [ ] 没有把任何密钥发送到聊天或提交到仓库。

## References

[1]: https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app "Choosing permissions for a GitHub App"
[2]: https://docs.github.com/en/apps/using-github-apps/installing-a-github-app-from-a-third-party "Installing a GitHub App"
[3]: https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions "Security hardening for GitHub Actions"
[4]: https://github.com/actions/create-github-app-token "actions/create-github-app-token"
