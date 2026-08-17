import { cookies } from 'next/headers';
import { getMonitorSnapshot, type MonitorSnapshot } from '@/lib/monitor';

export const dynamic = 'force-dynamic';

function formatDate(value: string | null | undefined): string {
  if (!value) return '暂无';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '暂无' : date.toISOString().replace('T', ' ').slice(0, 19);
}

function formatAge(hours: number | null): string {
  if (hours === null) return '暂无';
  if (hours < 24) return `${Math.round(hours)} 小时前`;
  return `${Math.round(hours / 24)} 天前`;
}

function statusLabel(status: string): string {
  if (status === 'healthy' || status === 'success') return '正常';
  if (status === 'stale') return '需关注';
  if (status === 'degraded' || status === 'failure') return '异常';
  if (status === 'in_progress' || status === 'queued') return '运行中';
  return status === 'missing' ? '缺失' : '未知';
}

function statusClass(status: string): string {
  if (status === 'healthy' || status === 'success') return 'bg-[#eaf5ef] text-[#276146]';
  if (status === 'in_progress' || status === 'queued') return 'bg-[#fff5dc] text-[#896016]';
  if (status === 'stale' || status === 'unknown') return 'bg-[#eef2fb] text-[#36537d]';
  return 'bg-[#fff0ee] text-[#a04438]';
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(status)}`}>
      {statusLabel(status)}
    </span>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slateish-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-ink-950">{value}</p>
      <p className="mt-1 text-xs text-slateish-500">{sub}</p>
    </div>
  );
}

function HealthCard({ title, status, children }: { title: string; status: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink-950">{title}</h2>
        <StatusPill status={status} />
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slateish-100 py-2.5 text-sm last:border-0 last:pb-0 first:pt-0">
      <span className="text-slateish-600">{label}</span>
      <span className="font-medium tabular-nums text-ink-900">{value}</span>
    </div>
  );
}

function RunsTable({ runs }: { runs: MonitorSnapshot['github']['runs'] }) {
  if (runs.length === 0) return <p className="text-sm text-slateish-500">暂时没有可显示的运行记录。</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slateish-200 text-left text-xs text-slateish-500">
            <th className="px-3 py-3 font-medium">工作流</th>
            <th className="px-3 py-3 font-medium">状态</th>
            <th className="px-3 py-3 font-medium">触发方式</th>
            <th className="px-3 py-3 font-medium">分支</th>
            <th className="px-3 py-3 font-medium">更新时间</th>
            <th className="px-3 py-3 text-right font-medium">查看</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => {
            const status = run.status === 'completed' ? run.conclusion || 'unknown' : run.status;
            return (
              <tr key={run.id} className="border-b border-slateish-100 last:border-0">
                <td className="px-3 py-3 font-medium text-ink-900">{run.name}</td>
                <td className="px-3 py-3"><StatusPill status={status} /></td>
                <td className="px-3 py-3 text-xs text-slateish-600">{run.event}</td>
                <td className="px-3 py-3 font-mono text-xs text-slateish-600">{run.branch}</td>
                <td className="px-3 py-3 text-xs text-slateish-600">{formatDate(run.updatedAt)}</td>
                <td className="px-3 py-3 text-right">
                  <a className="text-xs font-medium text-[#2e5747] underline-offset-4 hover:underline" href={run.url} target="_blank" rel="noreferrer">GitHub</a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminMonitorPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const session = (await cookies()).get('tb_admin_monitor')?.value;
  if (session !== 'authenticated') {
    return (
      <main className="container-page max-w-2xl py-16">
        <div className="card p-8">
          <p className="text-lg font-semibold text-ink-900">监控后台登录</p>
          <p className="mt-2 text-sm leading-6 text-slateish-600">请输入现有统计后台使用的访问令牌。监控页面不会在客户端暴露 GitHub Token 或其他服务端凭据。</p>
          <form method="post" action="/api/admin/monitor/login" className="mt-6 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="monitor-token" className="sr-only">后台访问令牌</label>
            <input id="monitor-token" name="token" type="password" autoComplete="current-password" placeholder="输入后台访问令牌" className="min-h-11 flex-1 rounded-lg border border-slateish-300 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-[#2e5747] focus:ring-2 focus:ring-[#2e5747]/15" required />
            <button type="submit" className="min-h-11 rounded-lg bg-[#244c3d] px-5 text-sm font-medium text-white transition hover:bg-[#1d3f32]">进入监控后台</button>
          </form>
          {params.error === 'invalid' ? <p className="mt-4 rounded-lg bg-[#fff0ee] px-3 py-2 text-xs text-[#8f3e34]">令牌无效，请重新输入。</p> : null}
          <p className="mt-4 text-xs text-slateish-500">可使用 <code>STATS_TOKEN</code>；验证后会创建仅限监控后台路径的 HttpOnly 会话 Cookie。</p>
        </div>
      </main>
    );
  }

  const snapshot = await getMonitorSnapshot();
  const { github, sync, frontier } = snapshot;
  const overall = sync.status === 'healthy' && frontier.status === 'healthy' && !github.error ? 'healthy' : 'degraded';

  return (
    <main className="container-page max-w-6xl py-10 sm:py-12">
      <header className="flex flex-col justify-between gap-4 border-b border-slateish-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2e5747]">Operations / TrialBeacon</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">数据与自动化监控</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slateish-600">集中查看 GitHub Actions、ClinicalTrials.gov 快照和前沿试验索引的最新健康状态。数据只读，不会触发同步或修改生产数据。</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slateish-500"><StatusPill status={overall} /><span>检查于 {formatDate(snapshot.generatedAt)}</span></div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="快照试验" value={sync.records.toLocaleString()} sub={`更新于 ${formatAge(sync.ageHours)}`} />
        <Kpi label="Recruiting" value={sync.recruitingRecords.toLocaleString()} sub="当前招募中的试验" />
        <Kpi label="前沿项目" value={frontier.candidates.toLocaleString()} sub="靶向 / 免疫疗法候选" />
        <Kpi label="校验错误" value={sync.validationErrors.toLocaleString()} sub={sync.failedScopes ? `${sync.failedScopes} 个范围失败` : '最近快照无校验错误'} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <HealthCard title="ClinicalTrials.gov 数据同步" status={sync.status}>
          <MetricRow label="同步生成时间" value={formatDate(sync.generatedAt)} />
          <MetricRow label="源数据时间" value={formatDate(sync.dataTimestamp)} />
          <MetricRow label="快照新鲜度" value={formatAge(sync.ageHours)} />
          <MetricRow label="失败范围" value={sync.failedScopes.toLocaleString()} />
          {sync.errors.length > 0 ? <div className="mt-4 rounded-lg bg-[#fff0ee] px-3 py-2 text-xs leading-5 text-[#8f3e34]">{sync.errors.join('；')}</div> : null}
        </HealthCard>
        <HealthCard title="前沿试验索引" status={frontier.status}>
          <MetricRow label="索引生成时间" value={formatDate(frontier.generatedAt)} />
          <MetricRow label="靶向治疗独有" value={frontier.targetedOnly.toLocaleString()} />
          <MetricRow label="免疫疗法独有" value={frontier.immunotherapyOnly.toLocaleString()} />
          <MetricRow label="两类均包含" value={frontier.bothModalities.toLocaleString()} />
        </HealthCard>
      </section>

      <section className="card mt-4 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
          <div><h2 className="text-sm font-semibold text-ink-950">GitHub Actions 最近运行</h2><p className="mt-1 text-xs text-slateish-500">仓库：{github.repository} · API 检查时间：{formatDate(github.fetchedAt)}</p></div>
          <a className="text-xs font-medium text-[#2e5747] underline-offset-4 hover:underline" href={`https://github.com/${github.repository}/actions`} target="_blank" rel="noreferrer">打开 Actions 总览</a>
        </div>
        {github.error ? <p className="mt-4 rounded-lg bg-[#fff5dc] px-3 py-2 text-xs leading-5 text-[#76521a]">{github.error}。页面仍会显示本地同步资产健康状态。</p> : null}
        <div className="mt-4"><RunsTable runs={github.runs} /></div>
      </section>

      <p className="mt-5 text-xs leading-5 text-slateish-500">健康规则：同步或索引超过 10 天未更新会标记为“需关注”；存在校验错误、失败范围或 GitHub API 异常时标记为“异常”。GitHub Token 仅在服务端请求中使用。</p>
    </main>
  );
}
