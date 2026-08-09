import {
  readStats,
  STAT_EVENTS,
  STAT_PERSISTENT,
  type StatEvent,
} from '@/lib/stats';
import {
  readPayments,
  summarizePayments,
  readAccountCount,
  metricsPersistent,
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
  const expected = process.env.STATS_TOKEN;
  if (!expected || sp.token !== expected) {
    return (
      <main className="container-page max-w-2xl py-16">
        <div className="card p-8 text-center">
          <p className="text-lg font-semibold text-ink-900">Unauthorized</p>
          <p className="mt-2 text-sm text-slateish-600">
            A valid <code>?token=</code> is required to view usage statistics.
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
  const persistent = STAT_PERSISTENT && metricsPersistent();

  return (
    <main className="container-page max-w-3xl py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink-950">TrialBeacon 经营数据</h1>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
            persistent
              ? 'bg-[#eef6f2] text-[#2e5747]'
              : 'bg-amber-50 text-amber-800'
          }`}
        >
          {persistent ? '持久化 (Upstash)' : '内存 (重启即清零)'}
        </span>
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

      {!persistent ? (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
          当前未配置 Upstash Redis，以上数字存于服务实例内存，<b>冷启动会清零</b>。
          在 Vercel 环境变量加上 <code>UPSTASH_REDIS_REST_URL</code> 与{' '}
          <code>UPSTASH_REDIS_REST_TOKEN</code> 后，数据即持久可信。
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
