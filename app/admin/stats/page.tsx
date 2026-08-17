import {
  readStats,
  STAT_EVENTS,
  STAT_STORE,
  type StatEvent,
} from '@/lib/stats';
import {
  readPayments,
  summarizePayments,
  readAccountCount,
  METRICS_STORE,
} from '@/lib/metrics';

export const dynamic = 'force-dynamic';

function Kpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-[12px] font-medium uppercase tracking-wide text-slateish-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-ink-950">
        {value}
      </p>
      {sub ? <p className="mt-1 text-[12px] text-slateish-500">{sub}</p> : null}
    </div>
  );
}

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  // Keep the stats page compatible with the existing deployment configuration.
  // STATS_TOKEN is preferred; OWNER_TOKEN is accepted as a deliberate legacy
  // fallback because older Vercel projects used that name for admin access.
  const expectedTokens = [process.env.STATS_TOKEN, process.env.OWNER_TOKEN].filter(
    (value): value is string => Boolean(value),
  );
  const suppliedToken = sp.token?.trim();
  const authorized = Boolean(suppliedToken && expectedTokens.includes(suppliedToken));

  if (!authorized) {
    return (
      <main className="container-page max-w-2xl py-16">
        <div className="card p-8">
          <p className="text-lg font-semibold text-ink-900">
            {suppliedToken ? '令牌无效' : '后台统计登录'}
          </p>
          <p className="mt-2 text-sm leading-6 text-slateish-600">
            请输入 Vercel Production 环境中配置的后台访问令牌。令牌只会通过 HTTPS
            作为当前页面的查询参数提交，不会显示在页面内容中。
          </p>
          <form method="get" className="mt-6 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="stats-token" className="sr-only">
              后台访问令牌
            </label>
            <input
              id="stats-token"
              name="token"
              type="password"
              autoComplete="current-password"
              placeholder="输入后台访问令牌"
              className="min-h-11 flex-1 rounded-lg border border-slateish-300 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-[#2e5747] focus:ring-2 focus:ring-[#2e5747]/15"
              required
            />
            <button
              type="submit"
              className="min-h-11 rounded-lg bg-[#244c3d] px-5 text-sm font-medium text-white transition hover:bg-[#1d3f32]"
            >
              进入统计后台
            </button>
          </form>
          <p className="mt-4 text-xs text-slateish-500">
            如果你没有令牌，请在 Vercel 项目的 Production Environment Variables
            中查看或轮换 <code>STATS_TOKEN</code>。
          </p>
        </div>
      </main>
    );
  }

  const [stats, payments, registrations] = await Promise.all([
    readStats(),
    readPayments(),
    readAccountCount(),
  ]);
  const pay = summarizePayments(payments);
  const store = STAT_STORE === 'upstash' && METRICS_STORE === 'upstash' ? 'upstash' : 'file';

  return (
    <main className="container-page max-w-3xl py-12">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-xl font-semibold text-ink-950">TrialBeacon 经营数据</h1>
        <div className="flex items-center gap-3">
          <a href="/admin/monitor" className="text-xs font-medium text-[#2e5747] underline-offset-4 hover:underline">查看系统监控</a>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
            store === 'upstash'
              ? 'bg-[#eef6f2] text-[#2e5747]'
              : 'bg-[#eef2fb] text-[#2e4a7a]'
          }`}
        >
          {store === 'upstash' ? '持久化 (Upstash)' : '持久化 (本地文件)'}
        </span>
        </div>
      </div>
      <p className="mt-2 text-sm text-slateish-600">
        仅记录匿名事件与付款元数据，不含任何健康信息。计数跨所有语言/页面汇总。
      </p>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Kpi
          label="访问量"
          value={stats.page_view.toLocaleString()}
          sub="累计页面浏览"
        />
        <Kpi
          label="注册人数"
          value={registrations.toLocaleString()}
          sub="去重（按邮箱）"
        />
        <Kpi
          label="付款人数"
          value={pay.paidUsers.toLocaleString()}
          sub="去重（按邮箱）"
        />
        <Kpi
          label="营收总额"
          value={`${pay.currency} ${pay.revenue.toLocaleString()}`}
          sub="PayPal 收款合计"
        />
        <Kpi label="付款笔数" value={pay.paymentCount.toLocaleString()} />
        <Kpi
          label="付款失败"
          value={stats.payment_failure.toLocaleString()}
          sub="payment_failure"
        />
      </section>

      {store === 'file' ? (
        <p className="mt-4 rounded-lg bg-[#eef2fb] px-3 py-2 text-[12px] text-[#2e4a7a]">
          数据存于本机磁盘（<code>.tb_state/</code>），<b>重启不会清零</b>；
          但仅限当前实例，不跨 Serverless 多实例共享。正式上线建议在 Vercel 配置{' '}
          <code>UPSTASH_REDIS_REST_URL</code> 与 <code>UPSTASH_REDIS_REST_TOKEN</code>。
        </p>
      ) : null}

      <h2 className="mt-8 text-sm font-semibold text-ink-900">原始事件计数</h2>
      <table className="mt-3 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slateish-200 text-left text-slateish-500">
            <th className="py-2 pr-4 font-medium">事件</th>
            <th className="py-2 text-right font-medium">次数</th>
          </tr>
        </thead>
        <tbody>
          {STAT_EVENTS.map((e: StatEvent) => (
            <tr key={e} className="border-b border-slateish-100">
              <td className="py-2 pr-4 font-mono text-[12px] text-ink-800">{e}</td>
              <td className="py-2 text-right tabular-nums text-ink-900">
                {stats[e].toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-8 text-sm font-semibold text-ink-900">最近付款明细</h2>
      {payments.length === 0 ? (
        <p className="mt-2 text-sm text-slateish-500">暂无付款记录。</p>
      ) : (
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slateish-200 text-left text-slateish-500">
              <th className="py-2 pr-4 font-medium">时间</th>
              <th className="py-2 pr-4 font-medium">类型</th>
              <th className="py-2 pr-4 font-medium">金额</th>
              <th className="py-2 text-right font-medium">邮箱</th>
            </tr>
          </thead>
          <tbody>
            {payments
              .slice(-20)
              .reverse()
              .map((p) => (
                <tr key={p.id} className="border-b border-slateish-100">
                  <td className="py-2 pr-4 text-[12px] text-ink-700">
                    {new Date(p.at).toISOString().slice(0, 19).replace('T', ' ')}
                  </td>
                  <td className="py-2 pr-4 text-[12px] text-ink-800">
                    {p.type === 'subscription' ? '订阅 $6.9/月' : '单次 $4.9'}
                  </td>
                  <td className="py-2 pr-4 tabular-nums text-ink-900">
                    {p.currency} {p.amount.toFixed(2)}
                  </td>
                  <td className="py-2 text-right text-[12px] text-slateish-600">
                    {p.email ?? '—'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
