import { readStats, STAT_EVENTS, STAT_PERSISTENT } from '@/lib/stats';

export const dynamic = 'force-dynamic';

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

  const stats = await readStats();

  return (
    <main className="container-page max-w-2xl py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink-950">Anonymous usage statistics</h1>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
            STAT_PERSISTENT
              ? 'bg-[#eef6f2] text-[#2e5747]'
              : 'bg-amber-50 text-amber-800'
          }`}
        >
          {STAT_PERSISTENT ? 'persistent (Upstash)' : 'in-memory (sandbox)'}
        </span>
      </div>
      <p className="mt-2 text-sm text-slateish-600">
        No personal health information is stored. Counts are anonymous and
        event-only.
      </p>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slateish-200 text-left text-slateish-500">
            <th className="py-2 pr-4 font-medium">Event</th>
            <th className="py-2 text-right font-medium">Count</th>
          </tr>
        </thead>
        <tbody>
          {STAT_EVENTS.map((e) => (
            <tr key={e} className="border-b border-slateish-100">
              <td className="py-2 pr-4 font-mono text-[12px] text-ink-800">{e}</td>
              <td className="py-2 text-right tabular-nums text-ink-900">
                {stats[e]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
